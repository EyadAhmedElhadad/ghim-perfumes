import 'server-only';
import { neon } from '@neondatabase/serverless';
import { isDbConfigured } from './env';

export { isDbConfigured };

const url = process.env.DATABASE_URL;

let _sql: ReturnType<typeof neon> | null = null;

export function getNeon(): ReturnType<typeof neon> {
  if (!url) {
    throw new Error('DATABASE_URL is not set. Add it to .env.local');
  }
  if (!_sql) _sql = neon(url);
  return _sql;
}
