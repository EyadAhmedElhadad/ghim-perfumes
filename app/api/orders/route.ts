import { NextResponse } from 'next/server';
import { createOrder, OrderValidationError } from '@/lib/orders';
import type { NewOrderInput } from '@/lib/orders';
import { getSiteSettings } from '@/lib/content';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<NewOrderInput>;

    // Shipping fee is authoritative from admin-controlled settings, keyed by
    // the order's governorate (falling back to the default fee). This prevents
    // clients from tampering with delivery charges.
    const settings = await getSiteSettings();
    const gov = (body.address?.governorate as string) ?? '';
    const fees = settings.shippingFees ?? {};
    const defaultFee =
      typeof settings.defaultShippingFee === 'number'
        ? settings.defaultShippingFee
        : 0;
    const shipping =
      gov && fees[gov] != null && Number.isFinite(Number(fees[gov]))
        ? Number(fees[gov])
        : defaultFee;
    const subtotal = Number(body.subtotal) || 0;
    const total = subtotal + shipping;

    const order = await createOrder({
      items: body.items ?? [],
      address: body.address ?? ({} as NewOrderInput['address']),
      subtotal,
      shipping,
      total,
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
