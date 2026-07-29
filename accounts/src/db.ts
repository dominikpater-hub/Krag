import pg from 'pg';

export function makePool() {
  return new pg.Pool({ connectionString: process.env.DATABASE_URL });
}
