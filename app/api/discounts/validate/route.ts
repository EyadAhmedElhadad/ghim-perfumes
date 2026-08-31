import { NextResponse } from 'next/server';
import { validateDiscountForSubtotal } from '@/lib/discounts';

export const runtime = 'nodejs';

// Public validation — no auth required
// Accepts { code, subtotal }
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const code = typeof body.code === 'string' ? body.code : '';
    const subtotal = body.subtotal != null ? Number(body.subtotal) : 0;

    if (!code || !code.trim()) {
      return NextResponse.json({ valid: false, error: 'Please enter a discount code' }, { status: 400 });
    }
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json({ valid: false, error: 'Invalid subtotal' }, { status: 400 });
    }

    const result = await validateDiscountForSubtotal(code, subtotal);
    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: result.discount.code,
      type: result.discount.type,
      value: result.discount.value,
      discountAmount: result.discountAmount,
      minOrderAmount: result.discount.minOrderAmount,
    });
  } catch (err) {
    return NextResponse.json(
      { valid: false, error: err instanceof Error ? err.message : 'Failed to validate code' },
      { status: 500 },
    );
  }
}
