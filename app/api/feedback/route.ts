import { NextResponse } from 'next/server';
import { insertFeedback } from '@/lib/feedback';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    const orderId =
      typeof body.orderId === 'string' ? body.orderId.trim() : '';
    const rating = Number(body.rating);
    const comment = typeof body.comment === 'string' ? body.comment : '';
    const tags = Array.isArray(body.tags)
      ? body.tags
          .filter((t: unknown): t is string => typeof t === 'string')
          .slice(0, 10)
      : [];
    const createdAt = typeof body.createdAt === 'string' ? body.createdAt : undefined;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    await insertFeedback({ orderId, rating, comment, tags, createdAt });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save feedback';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
