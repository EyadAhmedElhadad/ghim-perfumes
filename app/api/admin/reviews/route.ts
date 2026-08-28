import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/db/auth';
import { getOrderReviewStats } from '@/lib/reviews';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const stats = await getOrderReviewStats();
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load reviews';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
