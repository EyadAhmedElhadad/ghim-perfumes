import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/db/auth';
import {
  getDiscountById,
  updateDiscountCode,
  deleteDiscountCode,
} from '@/lib/discounts';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const found = await getDiscountById(id);
  if (!found) return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
  return NextResponse.json({ discount: found });
}

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

    const patch: Record<string, unknown> = {};
    if (typeof body.code === 'string') patch.code = body.code;
    if (body.type === 'percentage' || body.type === 'fixed') patch.type = body.type;
    if (body.value != null) patch.value = Number(body.value);
    if (body.minOrderAmount != null) patch.minOrderAmount = Number(body.minOrderAmount);
    if (body.min_order_amount != null) patch.minOrderAmount = Number(body.min_order_amount);
    if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;
    if (typeof body.is_active === 'boolean') patch.isActive = body.is_active;
    if (body.usageLimit !== undefined) patch.usageLimit = body.usageLimit === null ? null : Number(body.usageLimit);
    if (body.usage_limit !== undefined) patch.usageLimit = body.usage_limit === null ? null : Number(body.usage_limit);
    if (body.usageCount !== undefined) patch.usageLimit = body.usageCount; // ignore
    // allow toggling via {isActive: boolean}
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await updateDiscountCode(id, patch as never);
    if (!updated) return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    return NextResponse.json({ discount: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update discount';
    const status = message.toLowerCase().includes('unique') || message.toLowerCase().includes('duplicate') ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
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
    const deleted = await deleteDiscountCode(id);
    if (!deleted) return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete discount' },
      { status: 500 },
    );
  }
}
