import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/db/auth';
import { updateOrderStatus, deleteOrder, OrderValidationError } from '@/lib/orders';
import type { OrderStatus } from '@/lib/types';

export const runtime = 'nodejs';

const ALLOWED: OrderStatus[] = ['pending', 'confirmed', 'delivered'];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = (await req.json()) as { status?: string };
    if (!body.status || !ALLOWED.includes(body.status as OrderStatus)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }
    const order = await updateOrderStatus(id, body.status as OrderStatus);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Failed to update order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
    const deleted = await deleteOrder(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
