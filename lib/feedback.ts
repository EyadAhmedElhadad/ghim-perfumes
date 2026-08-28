import 'server-only';
import { getPool } from './neon';

const FEEDBACK_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    tags JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS feedback_order_id_idx ON feedback (order_id);
  CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback (created_at DESC);
`;

export type FeedbackInput = {
  orderId: string;
  rating: number;
  comment?: string;
  tags?: string[];
  createdAt?: string;
};

export async function ensureFeedbackTable(): Promise<void> {
  const pool = getPool();
  await pool.query(FEEDBACK_TABLE_SQL);
}

export async function insertFeedback(input: FeedbackInput): Promise<void> {
  const pool = getPool();
  await ensureFeedbackTable();
  await pool.query(
    `INSERT INTO feedback (order_id, rating, comment, tags, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      input.orderId,
      input.rating,
      input.comment && input.comment.trim() ? input.comment.slice(0, 2000) : null,
      JSON.stringify(input.tags ?? []),
      input.createdAt ?? new Date().toISOString(),
    ],
  );
}
