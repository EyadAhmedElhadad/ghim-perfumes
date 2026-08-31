import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/db/auth';
import { deleteOrderReview, setReviewFeatured } from '@/lib/reviews';

export const runtime = 'nodejs';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const raw =
      body.isFeatured ?? body.is_featured ?? body.featured ?? body.isFeaturedOnHome;
    if (typeof raw !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid isFeatured boolean' },
        { status: 400 },
      );
    }
    const updated = await setReviewFeatured(id, raw);
    if (!updated) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    return NextResponse.json({ review: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return PATCH(req, ctx);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const deleted = await deleteOrderReview(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
