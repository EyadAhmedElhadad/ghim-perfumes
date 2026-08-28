import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/db/auth';
import { deleteOrderReview } from '@/lib/reviews';

export const runtime = 'nodejs';

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
