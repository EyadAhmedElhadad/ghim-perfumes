-- Migration: Add missing is_featured column to reviews tables
-- Bug: column "is_featured" does not exist
-- This migration is idempotent (IF NOT EXISTS) and safe to run multiple times.
-- Canonical table is `order_reviews`; legacy deployments may use `reviews`.

-- 1. Ensure canonical table exists (for fresh DBs) and add column if missing
CREATE TABLE IF NOT EXISTS order_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE REFERENCES orders (id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_email TEXT,
  rating INTEGER NOT NULL,
  comment TEXT,
  tags JSONB,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exact spec required (safe, idempotent)
ALTER TABLE order_reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_order_reviews_featured ON order_reviews (is_featured) WHERE is_featured = true;

-- Additional indexes for compatibility (also created by app at runtime)
CREATE INDEX IF NOT EXISTS order_reviews_featured_idx
  ON order_reviews (is_featured) WHERE is_featured = true;

-- 2. Legacy table `reviews` (if present) — required to fix "column does not exist" error
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_reviews_featured ON reviews (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS reviews_featured_idx
  ON reviews (is_featured) WHERE is_featured = true;

-- Verify
-- SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name IN ('order_reviews','reviews') AND column_name='is_featured';
