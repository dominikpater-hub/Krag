/* Dev-server kont na pamięci (bez Postgresa), z otwartym CORS — do wiązania z powitaniem.
 * Uruchom: npx tsx src/dev-memory.ts   (PORT domyślnie 8091) */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { newDb } from 'pg-mem';
import { buildApp } from './app.ts';

const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(here, '..', 'schema.sql'), 'utf8');
// C-9: dev-only. CORS '*' poniżej nie może trafić na produkcję.
if (process.env.NODE_ENV === 'production') {
  console.error('dev-memory.ts (CORS *, pg-mem) NIE jest do produkcji. Użyj server.ts + Postgres.');
  process.exit(1);
}

const mem = newDb();
mem.public.none(schema);
const { Pool } = mem.adapters.createPg();
const app = buildApp(new Pool());

app.addHook('onRequest', async (req, reply) => {
  reply.header('access-control-allow-origin', '*');
  reply.header('access-control-allow-headers', 'content-type,authorization');
  reply.header('access-control-allow-methods', 'GET,POST,PUT,OPTIONS');
  if (req.method === 'OPTIONS') reply.code(204).send();
});

const PORT = Number(process.env.PORT ?? 8091);
await app.listen({ port: PORT, host: '0.0.0.0' });
console.log(`krag-accounts (pg-mem) http://localhost:${PORT}`);
