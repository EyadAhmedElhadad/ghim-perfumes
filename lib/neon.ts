import { Pool } from '@neondatabase/serverless';

const connectionString =
  process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    if (!connectionString) {
      throw new Error(
        'Neon is not configured. Set DATABASE_URL (or NEON_DATABASE_URL) to your Neon connection string.',
      );
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

export const ORDERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    items JSONB NOT NULL,
    address JSONB NOT NULL,
    governorate TEXT NOT NULL,
    subtotal NUMERIC NOT NULL,
    shipping NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EGP',
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL,
    discount_code TEXT,
    discount_amount NUMERIC NOT NULL DEFAULT 0,
    bundle_discount_amount NUMERIC NOT NULL DEFAULT 0,
    bundle_discount_percentage INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
`;
