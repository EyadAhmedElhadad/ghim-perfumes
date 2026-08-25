import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/firebase/auth';
import { listOrders } from '@/lib/orders';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const orders = await listOrders();
    return NextResponse.json({ orders });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to load orders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
