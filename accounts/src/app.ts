import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import crypto from 'node:crypto';
import { hashPassword, verifyPassword, newToken, daysFromNow } from './auth.ts';

const SESSION_DAYS = 30;
const DEFAULT_PSEUDO = 'Ktoś z Kręgu';

type Queryable = { query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }> };

function httpError(code: number, msg: string) {
  const e: any = new Error(msg);
  e.statusCode = code;
  return e;
}

export function buildApp(db: Queryable): FastifyInstance {
  const app = Fastify({ logger: false });

  app.setErrorHandler((err: any, _req, reply) => {
    const c = err.statusCode ?? 500;
    reply.code(c >= 400 && c < 600 ? c : 500).send({ error: err.message });
  });

  const accountForToken = async (token: string) => {
    const { rows } = await db.query(
      'select a.* from sessions s join accounts a on a.id = s.account_id where s.token = $1 and s.expires_at > now()',
      [token],
    );
    return rows[0] || null;
  };
  const requireAuth = async (req: FastifyRequest) => {
    const h = req.headers.authorization ?? '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!token) throw httpError(401, 'Brak tokenu');
    const a = await accountForToken(token);
    if (!a) throw httpError(401, 'Sesja nieważna');
    (req as any).account = a;
    return a;
  };
  const startSession = async (accountId: string) => {
    const token = newToken();
    await db.query('insert into sessions (token, account_id, expires_at) values ($1,$2,$3)',
      [token, accountId, daysFromNow(SESSION_DAYS)]);
    return token;
  };
  const publicAcc = (a: any, token: string) =>
    ({ token, pseudonym: a.pseudonym, email: a.email || null, provider: a.provider });

  app.get('/health', async () => ({ ok: true, service: 'krag-accounts', ts: new Date().toISOString() }));

  // ——— Rejestracja e-mailem ———
  app.post('/auth/register', async (req) => {
    const { email, password, pseudonym } = (req.body as any) || {};
    if (!email || !password) throw httpError(400, 'Podaj e-mail i hasło');
    if (String(password).length < 8) throw httpError(400, 'Hasło musi mieć min. 8 znaków');
    if ((await db.query('select 1 from accounts where email = $1', [email])).rows.length)
      throw httpError(409, 'Konto z tym e-mailem już istnieje');
    const id = crypto.randomUUID();
    const ps = pseudonym || DEFAULT_PSEUDO;
    await db.query('insert into accounts (id, email, pass_hash, pseudonym, provider) values ($1,$2,$3,$4,$5)',
      [id, email, hashPassword(password), ps, 'email']);
    return publicAcc({ pseudonym: ps, email, provider: 'email' }, await startSession(id));
  });

  // ——— Logowanie e-mailem ———
  app.post('/auth/login', async (req) => {
    const { email, password } = (req.body as any) || {};
    if (!email || !password) throw httpError(400, 'Podaj e-mail i hasło');
    const a = (await db.query('select * from accounts where email = $1', [email])).rows[0];
    if (!a || !verifyPassword(password, a.pass_hash)) throw httpError(401, 'Zły e-mail lub hasło');
    return publicAcc(a, await startSession(a.id));
  });

  // ——— Konto anonimowe (bez e-maila) ———
  app.post('/auth/anon', async (req) => {
    const { pseudonym } = (req.body as any) || {};
    const id = crypto.randomUUID();
    const ps = pseudonym || DEFAULT_PSEUDO;
    await db.query('insert into accounts (id, pseudonym, provider) values ($1,$2,$3)', [id, ps, 'anon']);
    return publicAcc({ pseudonym: ps, email: null, provider: 'anon' }, await startSession(id));
  });

  // ——— Google — działa dopiero po ustawieniu GOOGLE_CLIENT_ID ———
  app.post('/auth/google', async (req) => {
    if (!process.env.GOOGLE_CLIENT_ID)
      throw httpError(501, 'Logowanie Google nie jest jeszcze skonfigurowane (brak GOOGLE_CLIENT_ID)');
    const { idToken, pseudonym } = (req.body as any) || {};
    if (!idToken) throw httpError(400, 'Brak idToken');
    const info = await verifyGoogle(idToken);
    let a = (await db.query('select * from accounts where email = $1', [info.email])).rows[0];
    if (!a) {
      const id = crypto.randomUUID();
      const ps = pseudonym || DEFAULT_PSEUDO;
      await db.query('insert into accounts (id, email, pseudonym, provider) values ($1,$2,$3,$4)',
        [id, info.email, ps, 'google']);
      a = { id, email: info.email, pseudonym: ps, provider: 'google' };
    }
    return publicAcc(a, await startSession(a.id));
  });

  app.get('/me', async (req) => {
    const a = await requireAuth(req);
    return { pseudonym: a.pseudonym, email: a.email || null, provider: a.provider };
  });

  // ——— Synchronizacja: cały dokument konta, last-write-wins ———
  app.put('/sync', async (req) => {
    const a = await requireAuth(req);
    const { data, updatedAt } = (req.body as any) || {};
    const payload = typeof data === 'string' ? data : JSON.stringify(data ?? {});
    const now = updatedAt ? new Date(updatedAt) : new Date();
    const exists = (await db.query('select 1 from sync_docs where account_id = $1', [a.id])).rows.length;
    if (exists) await db.query('update sync_docs set data = $2, updated_at = $3 where account_id = $1', [a.id, payload, now]);
    else await db.query('insert into sync_docs (account_id, data, updated_at) values ($1,$2,$3)', [a.id, payload, now]);
    return { updatedAt: now.toISOString() };
  });

  app.get('/sync', async (req) => {
    const a = await requireAuth(req);
    const { rows } = await db.query('select data, updated_at from sync_docs where account_id = $1', [a.id]);
    if (!rows.length) return { data: {}, updatedAt: null };
    let data: any = {};
    try { data = JSON.parse(rows[0].data); } catch { /* uszkodzone → puste */ }
    return { data, updatedAt: rows[0].updated_at };
  });

  return app;
}

// Weryfikacja tokenu Google przez tokeninfo. Uruchamiana tylko, gdy GOOGLE_CLIENT_ID ustawione.
async function verifyGoogle(idToken: string): Promise<{ email: string }> {
  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken));
  if (!r.ok) throw httpError(401, 'Google odrzucił token');
  const info: any = await r.json();
  if (info.aud !== process.env.GOOGLE_CLIENT_ID) throw httpError(401, 'Token nie dla tej aplikacji');
  if (!info.email) throw httpError(401, 'Google nie zwrócił e-maila');
  return { email: info.email };
}
