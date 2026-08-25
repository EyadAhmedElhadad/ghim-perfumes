import { NextResponse } from 'next/server';
import { createOrder, OrderValidationError } from '@/lib/orders';
import type { NewOrderInput } from '@/lib/orders';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<NewOrderInput>;
    const order = await createOrder({
      items: body.items ?? [],
      address: body.address ?? ({} as NewOrderInput['address']),
      subtotal: Number(body.subtotal) || 0,
      shipping: Number(body.shipping) || 0,
      total: Number(body.total) || 0,
      currency: body.currency,
      paymentMethod: body.paymentMethod ?? '',
    });
    return NextResponse.json(
      { id: order.id, total: order.total, status: order.status },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message =
      err instanceof Error ? err.message : 'Failed to create order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
