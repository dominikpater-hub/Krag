import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import crypto from 'node:crypto';
import { hashPassword, verifyPassword, newToken, hashToken, daysFromNow } from './auth.ts';

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

  // C-4: nieoczekiwane błędy (bez statusCode, np. rzuty Postgresa) → generyczne 500 bez szczegółów.
  // Nasze zamierzone błędy (httpError ustawia statusCode) zachowują kod i komunikat, także 5xx jak 501.
  app.setErrorHandler((err: any, _req, reply) => {
    const c = err.statusCode;
    if (!c) return reply.code(500).send({ error: 'Błąd serwera' });
    reply.code(c >= 400 && c < 600 ? c : 500).send({ error: err.message, ...(err.serverData ? { serverData: err.serverData } : {}) });
  });

  // Nagłówki bezpieczeństwa dla API (audyt P1-8).
  app.addHook('onSend', async (_req, reply) => {
    reply.header('x-content-type-options', 'nosniff');
    reply.header('referrer-policy', 'no-referrer');
    reply.header('permissions-policy', 'geolocation=(), camera=(), microphone=()');
    reply.header('cache-control', 'no-store');
  });

  const norm = (e: any) => String(e ?? '').trim().toLowerCase();   // B-6: normalizacja e-maila

  // B-2: prosty rate-limit per IP+akcja (fail-closed). Blokuje zgadywanie haseł i enumerację.
  const hits = new Map<string, number[]>();
  const guard = (req: FastifyRequest, action: string, max = 20, windowMs = 10 * 60_000) => {
    const key = `${req.ip}:${action}`;
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    arr.push(now);
    hits.set(key, arr);
    if (arr.length > max) throw httpError(429, 'Za dużo prób. Spróbuj później.');
  };

  const accountForToken = async (token: string) => {
    const { rows } = await db.query(
      'select a.* from sessions s join accounts a on a.id = s.account_id where s.token = $1 and s.expires_at > now()',
      [hashToken(token)],   // C-2: w bazie trzymamy hash tokenu, nie token
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
    await db.query('delete from sessions where expires_at < now()');   // C-3: sprzątanie wygasłych sesji
    const token = newToken();
    await db.query('insert into sessions (token, account_id, expires_at) values ($1,$2,$3)',
      [hashToken(token), accountId, daysFromNow(SESSION_DAYS)]);        // C-2
    return token;
  };
  const publicAcc = (a: any, token: string) =>
    ({ token, pseudonym: a.pseudonym, email: a.email || null, provider: a.provider });

  app.get('/health', async () => ({ ok: true, service: 'krag-accounts', ts: new Date().toISOString() }));

  // ——— Rejestracja e-mailem ———
  app.post('/auth/register', async (req) => {
    guard(req, 'register');
    const body = (req.body as any) || {};
    const email = norm(body.email);
    const password = body.password;
    if (!email || !password) throw httpError(400, 'Podaj e-mail i hasło');
    if (String(password).length < 8) throw httpError(400, 'Hasło musi mieć min. 8 znaków');
    // B-1: pełne zamknięcie enumeracji wymaga weryfikacji e-mail (mailer) — TODO gdy będzie provider poczty.
    if ((await db.query('select 1 from accounts where email = $1', [email])).rows.length)
      throw httpError(409, 'Konto z tym e-mailem już istnieje');
    const id = crypto.randomUUID();
    const ps = body.pseudonym || DEFAULT_PSEUDO;
    await db.query('insert into accounts (id, email, pass_hash, pseudonym, provider) values ($1,$2,$3,$4,$5)',
      [id, email, await hashPassword(password), ps, 'email']);
    return publicAcc({ pseudonym: ps, email, provider: 'email' }, await startSession(id));
  });

  // ——— Logowanie e-mailem ———
  app.post('/auth/login', async (req) => {
    guard(req, 'login');
    const body = (req.body as any) || {};
    const email = norm(body.email);
    const password = body.password;
    if (!email || !password) throw httpError(400, 'Podaj e-mail i hasło');
    const a = (await db.query('select * from accounts where email = $1', [email])).rows[0];
    // Lockout po serii nieudanych prób (audyt P1-7).
    if (a && a.locked_until && new Date(a.locked_until) > new Date())
      throw httpError(429, 'Za dużo prób. Spróbuj ponownie za kilka minut.');
    const okPass = a ? await verifyPassword(password, a.pass_hash) : false;
    if (!okPass) {
      if (a) {
        const n = (a.failed_count || 0) + 1;
        const lock = n >= 5 ? new Date(Date.now() + 15 * 60_000) : null;
        await db.query('update accounts set failed_count = $2, locked_until = $3 where id = $1', [a.id, n, lock]);
      }
      throw httpError(401, 'Zły e-mail lub hasło');
    }
    if (a.failed_count) await db.query('update accounts set failed_count = 0, locked_until = null where id = $1', [a.id]);
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
    guard(req, 'google');
    if (!process.env.GOOGLE_CLIENT_ID)
      throw httpError(501, 'Logowanie Google nie jest jeszcze skonfigurowane (brak GOOGLE_CLIENT_ID)');
    const { idToken, pseudonym } = (req.body as any) || {};
    if (!idToken) throw httpError(400, 'Brak idToken');
    const info = await verifyGoogle(idToken);   // Google potwierdził ten e-mail
    const email = norm(info.email);
    let a = (await db.query('select * from accounts where email = $1', [email])).rows[0];
    // Pre-hijacking (audyt P0-1): nie loguj do konta założonego HASŁEM, którego e-maila nikt nie zweryfikował.
    if (a && a.provider !== 'google' && !a.email_verified)
      throw httpError(409, 'Konto z tym e-mailem założono hasłem. Zaloguj się hasłem, aby połączyć je z Google.');
    if (!a) {
      const id = crypto.randomUUID();
      const ps = pseudonym || DEFAULT_PSEUDO;
      await db.query('insert into accounts (id, email, pseudonym, provider, email_verified) values ($1,$2,$3,$4,true)',
        [id, email, ps, 'google']);
      a = { id, email, pseudonym: ps, provider: 'google' };
    }
    return publicAcc(a, await startSession(a.id));
  });

  app.get('/me', async (req) => {
    const a = await requireAuth(req);
    return { pseudonym: a.pseudonym, email: a.email || null, provider: a.provider };
  });

  // Wylogowanie unieważnia token po stronie serwera (audyt P1-7).
  app.post('/auth/logout', async (req) => {
    const h = req.headers.authorization ?? '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (token) await db.query('delete from sessions where token = $1', [hashToken(token)]);   // C-2
    return { ok: true };
  });

  // ——— Synchronizacja: cały dokument konta ———
  app.put('/sync', async (req) => {
    const a = await requireAuth(req);
    const { data, updatedAt } = (req.body as any) || {};
    const payload = typeof data === 'string' ? data : JSON.stringify(data ?? {});
    const cur = (await db.query('select data, updated_at from sync_docs where account_id = $1', [a.id])).rows[0];
    // Ochrona przed cichą utratą (audyt P1-6): nie nadpisuj nowszej wersji starszą — zwróć 409 z danymi serwera.
    if (cur && updatedAt && new Date(updatedAt) < new Date(cur.updated_at)) {
      let serverData: any = {}; try { serverData = JSON.parse(cur.data); } catch { /* uszkodzone */ }
      throw Object.assign(httpError(409, 'Nowsza wersja danych jest na serwerze — scal i spróbuj ponownie'), { serverData });
    }
    const now = updatedAt ? new Date(updatedAt) : new Date();
    if (cur) await db.query('update sync_docs set data = $2, updated_at = $3 where account_id = $1', [a.id, payload, now]);
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
  if (info.iss !== 'accounts.google.com' && info.iss !== 'https://accounts.google.com')
    throw httpError(401, 'Nieprawidłowy wystawca tokenu');
  if (info.email_verified === false || info.email_verified === 'false')
    throw httpError(401, 'E-mail Google niezweryfikowany');
  if (!info.email) throw httpError(401, 'Google nie zwrócił e-maila');
  return { email: info.email };
}
