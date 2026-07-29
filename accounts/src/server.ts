import { buildApp } from './app.ts';
import { makePool } from './db.ts';

const app = buildApp(makePool());
const port = Number(process.env.PORT ?? 8091);
app.listen({ port, host: '0.0.0.0' })
  .then(() => console.log(`krag-accounts on :${port}`))
  .catch((e) => { console.error(e); process.exit(1); });
