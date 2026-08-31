import 'server-only';
import { getPool } from './neon';

const ORDER_REVIEWS_TABLE_SQL = `
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
  CREATE INDEX IF NOT EXISTS order_reviews_created_at_idx ON order_reviews (created_at DESC);
  CREATE INDEX IF NOT EXISTS order_reviews_rating_idx ON order_reviews (rating);
  CREATE INDEX IF NOT EXISTS order_reviews_featured_idx ON order_reviews (is_featured) WHERE is_featured = true;
  `;

export type OrderReview = {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string | null;
  rating: number;
  comment: string;
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
};

/** Safe public representation — never exposes email or orderId */
export type FeaturedPublicReview = {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type OrderReviewStats = {
  reviews: OrderReview[];
  total: number;
  average: number;
  counts: Record<number, number>;
};

export type OrderReviewInput = {
  orderId: string;
  customerName?: string;
  customerEmail?: string | null;
  rating: number;
  comment?: string;
  tags?: string[];
};

export async function ensureOrderReviewsTable(): Promise<void> {
  const pool = getPool();
  await pool.query(ORDER_REVIEWS_TABLE_SQL);
  // Backfill for existing deployments that created the table before is_featured existed
  await pool.query(`ALTER TABLE order_reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false`);
  await pool.query(`CREATE INDEX IF NOT EXISTS order_reviews_featured_idx ON order_reviews (is_featured) WHERE is_featured = true`);
}

function rowToReview(row: {
  id: string;
  order_id: string;
  customer_name: string | null;
  customer_email: string | null;
  rating: number;
  comment: string | null;
  tags: unknown;
  is_featured?: boolean | null;
  created_at: string;
}): OrderReview {
  let parsedTags: string[] = [];
  if (Array.isArray(tagsLiteral(row.tags))) {
    parsedTags = (tagsLiteral(row.tags) as unknown[]).filter(
      (t): t is string => typeof t === 'string',
    );
  }
  return {
    id: row.id,
    orderId: row.order_id,
    customerName: row.customer_name ?? '',
    customerEmail: row.customer_email ?? null,
    rating: Number(row.rating),
    comment: row.comment ?? '',
    tags: parsedTags,
    isFeatured: Boolean(row.is_featured),
    createdAt: row.created_at,
  };
}

function tagsLiteral(tags: unknown): unknown {
  if (typeof tags === 'string') {
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  }
  return tags;
}

/**
 * Inserts a review for an order. Uses an upsert on `order_id` so re-submitting
 * the same token updates the existing review instead of creating duplicates
 * (idempotent).
 */
export async function upsertOrderReview(
  input: OrderReviewInput,
): Promise<OrderReview> {
  const pool = getPool();
  await ensureOrderReviewsTable();
  const res = await pool.query<{
    id: string;
    order_id: string;
    customer_name: string | null;
    customer_email: string | null;
    rating: number;
    comment: string | null;
    tags: unknown;
    is_featured: boolean | null;
    created_at: string;
  }>(
    `INSERT INTO order_reviews (order_id, customer_name, customer_email, rating, comment, tags, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (order_id) DO UPDATE SET
        customer_name = EXCLUDED.customer_name,
        customer_email = EXCLUDED.customer_email,
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        tags = EXCLUDED.tags,
        created_at = EXCLUDED.created_at
      RETURNING id, order_id, customer_name, customer_email, rating, comment, tags, is_featured, created_at`,
    [
      input.orderId,
      input.customerName ?? '',
      input.customerEmail ?? null,
      input.rating,
      input.comment && input.comment.trim() ? input.comment.slice(0, 2000) : null,
      JSON.stringify(input.tags ?? []),
      new Date().toISOString(),
    ],
  );
  return rowToReview(res.rows[0]);
}

export async function listOrderReviews(): Promise<OrderReview[]> {
  const pool = getPool();
  await ensureOrderReviewsTable();
  const res = await pool.query<{
    id: string;
    order_id: string;
    customer_name: string | null;
    customer_email: string | null;
    rating: number;
    comment: string | null;
    tags: unknown;
    is_featured: boolean | null;
    created_at: string;
  }>(
    `SELECT id, order_id, customer_name, customer_email, rating, comment, tags, is_featured, created_at
     FROM order_reviews
     ORDER BY created_at DESC`,
    [],
  );
  return res.rows.map(rowToReview);
}

export async function getReviewByOrder(
  orderId: string,
): Promise<OrderReview | null> {
  const pool = getPool();
  await ensureOrderReviewsTable();
  const res = await pool.query<{
    id: string;
    order_id: string;
    customer_name: string | null;
    customer_email: string | null;
    rating: number;
    comment: string | null;
    tags: unknown;
    is_featured: boolean | null;
    created_at: string;
  }>(
    `SELECT id, order_id, customer_name, customer_email, rating, comment, tags, is_featured, created_at
     FROM order_reviews WHERE order_id = $1 LIMIT 1`,
    [orderId],
  );
  if (res.rows.length === 0) return null;
  return rowToReview(res.rows[0]);
}

export async function deleteOrderReview(id: string): Promise<boolean> {
  const pool = getPool();
  await ensureOrderReviewsTable();
  const res = await pool.query(
    `DELETE FROM order_reviews WHERE id = $1`,
    [id],
  );
  return (res.rowCount ?? 0) > 0;
}

export async function setReviewFeatured(
  id: string,
  featured: boolean,
): Promise<OrderReview | null> {
  const pool = getPool();
  await ensureOrderReviewsTable();
  const res = await pool.query<{
    id: string;
    order_id: string;
    customer_name: string | null;
    customer_email: string | null;
    rating: number;
    comment: string | null;
    tags: unknown;
    is_featured: boolean | null;
    created_at: string;
  }>(
    `UPDATE order_reviews SET is_featured = $2 WHERE id = $1
     RETURNING id, order_id, customer_name, customer_email, rating, comment, tags, is_featured, created_at`,
    [id, featured],
  );
  if (res.rows.length === 0) return null;
  return rowToReview(res.rows[0]);
}

export async function listFeaturedReviews(): Promise<FeaturedPublicReview[]> {
  const pool = getPool();
  await ensureOrderReviewsTable();
  const res = await pool.query<{
    id: string;
    customer_name: string | null;
    rating: number;
    comment: string | null;
    created_at: string;
  }>(
    `SELECT id, customer_name, rating, comment, created_at
     FROM order_reviews
     WHERE is_featured = true
     ORDER BY created_at DESC`,
    [],
  );
  return res.rows.map((row) => ({
    id: row.id,
    customerName: row.customer_name ?? 'Anonymous',
    rating: Number(row.rating),
    comment: row.comment ?? '',
    createdAt: row.created_at,
  }));
}

export async function getOrderReviewStats(): Promise<OrderReviewStats> {
  const reviews = await listOrderReviews();
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    sum += r.rating;
    if (counts[r.rating] !== undefined) counts[r.rating] += 1;
  }
  const average = reviews.length ? sum / reviews.length : 0;
  return {
    reviews,
    total: reviews.length,
    average: Math.round(average * 10) / 10,
    counts,
  };
}
