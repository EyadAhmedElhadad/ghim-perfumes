import 'server-only';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
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
  CREATE INDEX IF NOT EXISTS idx_order_reviews_featured ON order_reviews (is_featured) WHERE is_featured = true;
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

function isReviewsDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL);
}

const REVIEWS_DEMO_DIR = path.join(process.cwd(), 'data');
const REVIEWS_DEMO_FILE = path.join(REVIEWS_DEMO_DIR, 'order-reviews.json');

const DEMO_REVIEWS_FALLBACK: OrderReview[] = [
  {
    id: 'demo-review-1',
    orderId: 'order-demo-1',
    customerName: 'Layla A.',
    customerEmail: null,
    rating: 5,
    comment: 'GHIM fragrances are absolutely divine — long-lasting and elegant. The packaging feels truly luxury.',
    tags: ['Beautiful packaging', 'Great selection'],
    isFeatured: true,
    createdAt: '2026-08-20T10:00:00.000Z',
  },
  {
    id: 'demo-review-2',
    orderId: 'order-demo-2',
    customerName: 'Omar K.',
    customerEmail: null,
    rating: 5,
    comment: 'Exceptional scent and fast delivery. The 30% bundle offer is fantastic value!',
    tags: ['Fast loading', 'Great prices'],
    isFeatured: true,
    createdAt: '2026-08-21T12:00:00.000Z',
  },
  {
    id: 'demo-review-3',
    orderId: 'order-demo-3',
    customerName: 'Sara M.',
    customerEmail: null,
    rating: 4,
    comment: 'Beautiful Middle Eastern heritage in every bottle. Will definitely order again.',
    tags: ['Easy checkout'],
    isFeatured: true,
    createdAt: '2026-08-22T14:00:00.000Z',
  },
  {
    id: 'demo-review-4',
    orderId: 'order-demo-4',
    customerName: 'Youssef H.',
    customerEmail: null,
    rating: 5,
    comment: 'Outstanding customer service and authentic feedback system. GHIM has my trust.',
    tags: ['Helpful support'],
    isFeatured: false,
    createdAt: '2026-08-23T09:00:00.000Z',
  },
];

function loadFileReviews(): OrderReview[] {
  try {
    const raw = readFileSync(REVIEWS_DEMO_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [...DEMO_REVIEWS_FALLBACK];
    const mapped = parsed
      .map((r) => {
        if (!r || typeof r !== 'object') return null;
        const o = r as Record<string, unknown>;
        return {
          id: String(o.id ?? ''),
          orderId: String(o.orderId ?? o.order_id ?? ''),
          customerName: String(o.customerName ?? o.customer_name ?? ''),
          customerEmail: (o.customerEmail as string) ?? (o.customer_email as string) ?? null,
          rating: Number(o.rating ?? 0),
          comment: String(o.comment ?? ''),
          tags: Array.isArray(o.tags) ? (o.tags as string[]) : [],
          isFeatured: Boolean(o.isFeatured ?? o.is_featured ?? false),
          createdAt: String(o.createdAt ?? o.created_at ?? new Date().toISOString()),
        } as OrderReview;
      })
      .filter((x): x is OrderReview => x !== null && Boolean(x.id && x.orderId));
    // If file exists but empty, return demo fallback so dashboard/homepage are not empty in demo mode
    if (mapped.length === 0) return [...DEMO_REVIEWS_FALLBACK];
    return mapped;
  } catch {
    // File missing or unreadable — return demo fallback for local demo without DB
    return [...DEMO_REVIEWS_FALLBACK];
  }
}

function saveFileReviews(reviews: OrderReview[]): void {
  try {
    mkdirSync(REVIEWS_DEMO_DIR, { recursive: true });
    writeFileSync(REVIEWS_DEMO_FILE, JSON.stringify(reviews, null, 2), 'utf8');
  } catch (e) {
    console.warn('[order_reviews] file persist failed:', e);
  }
}

export async function ensureOrderReviewsTable(): Promise<void> {
  if (!isReviewsDbConfigured()) return;
  const pool = getPool();
  await pool.query(ORDER_REVIEWS_TABLE_SQL);
  // Backfill for existing deployments that created the table before is_featured existed
  // Spec requires exact: ALTER TABLE order_reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
  await pool.query(`ALTER TABLE order_reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false`);
  await pool.query(`CREATE INDEX IF NOT EXISTS order_reviews_featured_idx ON order_reviews (is_featured) WHERE is_featured = true`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_order_reviews_featured ON order_reviews (is_featured) WHERE is_featured = true`);
  // Legacy `reviews` table (if present) — also ensure is_featured exists
  try {
    await pool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL`);
  } catch {
    // table `reviews` may not exist — ignore (order_reviews is canonical)
  }
  try {
    await pool.query(`CREATE INDEX IF NOT EXISTS reviews_featured_idx ON reviews (is_featured) WHERE is_featured = true`);
  } catch {
    // ignore if table missing
  }
  try {
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_reviews_featured ON reviews (is_featured) WHERE is_featured = true`);
  } catch {
    // ignore
  }
}

function isMissingFeaturedColumnError(err: unknown): boolean {
  const anyErr = err as Record<string, unknown>;
  const code = typeof anyErr.code === 'string' ? anyErr.code : '';
  if (code === '42703') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('is_featured') && (msg.includes('does not exist') || msg.includes('column'));
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
    isFeatured: Boolean(row.is_featured ?? false),
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
  if (!isReviewsDbConfigured()) {
    const all = loadFileReviews();
    const now = new Date().toISOString();
    const existingIdx = all.findIndex((r) => r.orderId === input.orderId);
    if (existingIdx >= 0) {
      const existing = all[existingIdx];
      const updated: OrderReview = {
        ...existing,
        customerName: input.customerName ?? existing.customerName,
        customerEmail: input.customerEmail ?? existing.customerEmail,
        rating: input.rating,
        comment: input.comment && input.comment.trim() ? input.comment.slice(0, 2000) : '',
        tags: input.tags ?? [],
        createdAt: now,
      };
      all[existingIdx] = updated;
      saveFileReviews(all);
      return updated;
    }
    const created: OrderReview = {
      id: `review_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      orderId: input.orderId,
      customerName: input.customerName ?? '',
      customerEmail: input.customerEmail ?? null,
      rating: input.rating,
      comment: input.comment && input.comment.trim() ? input.comment.slice(0, 2000) : '',
      tags: input.tags ?? [],
      isFeatured: false,
      createdAt: now,
    };
    all.unshift(created);
    saveFileReviews(all);
    return created;
  }
  const pool = getPool();
  await ensureOrderReviewsTable();
  try {
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
  } catch (err) {
    if (isMissingFeaturedColumnError(err)) {
      await pool.query(`ALTER TABLE order_reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL`).catch(() => {});
      await pool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL`).catch(() => {});
      const retry = await pool.query<{
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
      return rowToReview(retry.rows[0]);
    }
    throw err;
  }
}

export async function listOrderReviews(): Promise<OrderReview[]> {
  if (!isReviewsDbConfigured()) {
    return loadFileReviews().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  const pool = getPool();
  await ensureOrderReviewsTable();
  try {
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
    let reviews = res.rows.map(rowToReview);
    // Merge legacy feedback table entries so RateExperienceModal feedback also appears in dashboard
    try {
      const fb = await pool.query<{
        id: string;
        order_id: string;
        rating: number;
        comment: string | null;
        tags: unknown;
        created_at: string;
      }>(`SELECT id, order_id, rating, comment, tags, created_at FROM feedback ORDER BY created_at DESC`);
      const seen = new Set(reviews.map((r) => r.orderId));
      for (const row of fb.rows) {
        if (seen.has(row.order_id)) continue;
        let parsedTags: string[] = [];
        const rawTags = row.tags as unknown;
        if (Array.isArray(rawTags)) parsedTags = (rawTags as unknown[]).filter((t): t is string => typeof t === 'string');
        else if (typeof rawTags === 'string') {
          try {
            const p = JSON.parse(rawTags);
            if (Array.isArray(p)) parsedTags = (p as unknown[]).filter((t): t is string => typeof t === 'string');
          } catch {}
        }
        reviews.push({
          id: row.id,
          orderId: row.order_id,
          customerName: '',
          customerEmail: null,
          rating: Number(row.rating),
          comment: row.comment ?? '',
          tags: parsedTags,
          isFeatured: false,
          createdAt: row.created_at,
        });
      }
      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      // feedback table may not exist — ignore
    }
    return reviews;
  } catch (err) {
    if (isMissingFeaturedColumnError(err)) {
      await pool.query(`ALTER TABLE order_reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL`).catch(() => {});
      await pool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL`).catch(() => {});
      const retry = await pool.query<{
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
      return retry.rows.map(rowToReview);
    }
    throw err;
  }
}

export async function getReviewByOrder(
  orderId: string,
): Promise<OrderReview | null> {
  if (!isReviewsDbConfigured()) {
    const all = loadFileReviews();
    return all.find((r) => r.orderId === orderId) ?? null;
  }
  const pool = getPool();
  await ensureOrderReviewsTable();
  try {
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
  } catch (err) {
    if (isMissingFeaturedColumnError(err)) {
      await pool.query(`ALTER TABLE order_reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL`).catch(() => {});
      const retry = await pool.query<{
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
      if (retry.rows.length === 0) return null;
      return rowToReview(retry.rows[0]);
    }
    throw err;
  }
}

export async function deleteOrderReview(id: string): Promise<boolean> {
  if (!isReviewsDbConfigured()) {
    const all = loadFileReviews();
    const filtered = all.filter((r) => r.id !== id);
    if (filtered.length === all.length) return false;
    saveFileReviews(filtered);
    return true;
  }
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
  if (!isReviewsDbConfigured()) {
    const all = loadFileReviews();
    const idx = all.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    all[idx] = { ...all[idx], isFeatured: featured };
    saveFileReviews(all);
    return all[idx];
  }
  const pool = getPool();
  await ensureOrderReviewsTable();
  try {
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
  } catch (err) {
    if (isMissingFeaturedColumnError(err)) {
      await pool.query(`ALTER TABLE order_reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL`).catch(() => {});
      await pool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL`).catch(() => {});
      const retry = await pool.query<{
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
      if (retry.rows.length === 0) return null;
      return rowToReview(retry.rows[0]);
    }
    throw err;
  }
}

export async function listFeaturedReviews(): Promise<FeaturedPublicReview[]> {
  if (!isReviewsDbConfigured()) {
    const all = loadFileReviews();
    return all
      .filter((r) => r.isFeatured)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r) => ({
        id: r.id,
        customerName: r.customerName || 'Anonymous',
        rating: r.rating,
        comment: r.comment || '',
        createdAt: r.createdAt,
      }));
  }
  const pool = getPool();
  await ensureOrderReviewsTable();
  try {
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
  } catch (err) {
    if (isMissingFeaturedColumnError(err)) {
      await pool.query(`ALTER TABLE order_reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL`).catch(() => {});
      await pool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL`).catch(() => {});
      const retry = await pool.query<{
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
      return retry.rows.map((row) => ({
        id: row.id,
        customerName: row.customer_name ?? 'Anonymous',
        rating: Number(row.rating),
        comment: row.comment ?? '',
        createdAt: row.created_at,
      }));
    }
    throw err;
  }
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
