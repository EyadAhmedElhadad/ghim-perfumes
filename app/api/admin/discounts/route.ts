import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/db/auth';
import { listDiscountCodes, createDiscountCode } from '@/lib/discounts';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const codes = await listDiscountCodes();
    return NextResponse.json({ discounts: codes });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load discounts' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const code = typeof body.code === 'string' ? body.code : '';
    const type = body.type as 'percentage' | 'fixed';
    const value = Number(body.value);
    const minOrderAmount =
      body.minOrderAmount != null
        ? Number(body.minOrderAmount)
        : body.min_order_amount != null
          ? Number(body.min_order_amount)
          : 0;
    const isActive =
      typeof body.isActive === 'boolean'
        ? body.isActive
        : typeof body.is_active === 'boolean'
          ? body.is_active
          : true;
    const usageLimit =
      body.usageLimit != null
        ? Number(body.usageLimit)
        : body.usage_limit != null
          ? Number(body.usage_limit)
          : null;

    const created = await createDiscountCode({
      code,
      type,
      value,
      minOrderAmount: Number.isFinite(minOrderAmount) ? minOrderAmount : 0,
      isActive,
      usageLimit: usageLimit != null && Number.isFinite(usageLimit) ? usageLimit : null,
    });
    return NextResponse.json({ discount: created }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create discount';
    // Unique violation -> 409
    const status = message.toLowerCase().includes('unique') || message.toLowerCase().includes('duplicate') ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
