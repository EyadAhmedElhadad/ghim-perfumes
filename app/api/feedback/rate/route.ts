import { NextResponse } from 'next/server';
import { getOrderReviewContext } from '@/lib/orders';
import {
  upsertOrderReview,
  getReviewByOrder,
} from '@/lib/reviews';

export const runtime = 'nodejs';

// GET /api/feedback/rate?token=... — public, resolves token to order context
// and whether a review already exists (for idempotency on the client).
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }
  const ctx = await getOrderReviewContext(token);
  if (!ctx) {
    return NextResponse.json({ error: 'Invalid review link' }, { status: 404 });
  }
  const existing = await getReviewByOrder(ctx.orderId);
  return NextResponse.json({
    orderId: ctx.orderId,
    customerName: ctx.customerName,
    reviewed: existing !== null,
  });
}

// POST /api/feedback/rate — public, submits/updates a review for the order
// tied to the token. Idempotent per order (upsert).
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const token =
      typeof body.token === 'string' ? body.token.trim() : '';
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }
    const ctx = await getOrderReviewContext(token);
    if (!ctx) {
      return NextResponse.json({ error: 'Invalid review link' }, { status: 404 });
    }

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    const comment = typeof body.comment === 'string' ? body.comment : '';
    const customerName =
      typeof body.customerName === 'string' ? body.customerName.slice(0, 200) : '';
    const tags = Array.isArray(body.tags)
      ? body.tags
          .filter((t: unknown): t is string => typeof t === 'string')
          .slice(0, 10)
      : [];

    await upsertOrderReview({
      orderId: ctx.orderId,
      customerName,
      rating,
      comment,
      tags,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
