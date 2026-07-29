import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { newDb } from 'pg-mem';
import { buildApp } from './app.ts';

const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(here, '..', 'schema.sql'), 'utf8');

let app: any;
before(async () => {
  const mem = newDb();
  mem.public.none(schema);
  const { Pool } = mem.adapters.createPg();
  app = buildApp(new Pool());
  await app.ready();
});

const H = (token?: string) => ({ 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) });
const post = (url: string, body: any, token?: string) => app.inject({ method: 'POST', url, headers: H(token), payload: JSON.stringify(body || {}) });
const put = (url: string, body: any, token: string) => app.inject({ method: 'PUT', url, headers: H(token), payload: JSON.stringify(body || {}) });
const get = (url: string, token?: string) => app.inject({ method: 'GET', url, headers: H(token) });

test('rejestracja e-mailem + /me', async () => {
  const r = await post('/auth/register', { email: 'a@b.pl', password: 'haslo1234', pseudonym: 'Cichy Świt' });
  assert.equal(r.statusCode, 200);
  const d = r.json();
  assert.ok(d.token);
  assert.equal(d.pseudonym, 'Cichy Świt');
  assert.equal(d.provider, 'email');
  const me = await get('/me', d.token);
  assert.equal(me.json().email, 'a@b.pl');
});

test('krótkie hasło → 400', async () => {
  assert.equal((await post('/auth/register', { email: 'x@y.pl', password: 'krotkie' })).statusCode, 400);
});

test('duplikat e-maila → 409', async () => {
  assert.equal((await post('/auth/register', { email: 'a@b.pl', password: 'haslo1234' })).statusCode, 409);
});

test('login: złe hasło → 401, dobre → token', async () => {
  assert.equal((await post('/auth/login', { email: 'a@b.pl', password: 'zle-haslo' })).statusCode, 401);
  const ok = await post('/auth/login', { email: 'a@b.pl', password: 'haslo1234' });
  assert.equal(ok.statusCode, 200);
  assert.ok(ok.json().token);
});

test('sync: zapis i odczyt (round-trip przez konto)', async () => {
  const reg = (await post('/auth/register', { email: 'c@d.pl', password: 'haslo1234' })).json();
  const w = await put('/sync', { data: { diary: [{ ts: 1, note: 'x' }] }, updatedAt: '2026-07-29T00:00:00Z' }, reg.token);
  assert.equal(w.statusCode, 200);
  const g = await get('/sync', reg.token);
  assert.equal(g.json().data.diary[0].note, 'x');
});

test('konto anonimowe + sync działa', async () => {
  const an = (await post('/auth/anon', { pseudonym: 'Nocny Ogród' })).json();
  assert.equal(an.provider, 'anon');
  assert.equal(an.email, null);
  await put('/sync', { data: { k: 1 } }, an.token);
  assert.equal((await get('/sync', an.token)).json().data.k, 1);
});

test('sync bez tokenu → 401', async () => {
  assert.equal((await get('/sync')).statusCode, 401);
});

test('Google bez konfiguracji → 501', async () => {
  assert.equal((await post('/auth/google', { idToken: 'x' })).statusCode, 501);
});

test('Google skonfigurowane: brak idToken → 400 (nie 501)', async () => {
  process.env.GOOGLE_CLIENT_ID = 'test-client-id';
  const r = await post('/auth/google', {});
  delete process.env.GOOGLE_CLIENT_ID;
  assert.equal(r.statusCode, 400);
});
