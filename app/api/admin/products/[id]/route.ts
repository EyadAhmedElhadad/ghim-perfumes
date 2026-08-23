import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentAdmin } from '@/lib/db/auth';
import { updateProduct, deleteProduct } from '@/lib/db/db';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json();
  const product = await updateProduct(id, body);
  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  revalidatePath('/');
  revalidatePath('/products');
  revalidatePath(`/products/${product.slug}`);
  return NextResponse.json(product);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const ok = await deleteProduct(id);
  if (!ok) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  revalidatePath('/');
  revalidatePath('/products');
  revalidatePath(`/products/${id}`);
  return NextResponse.json({ ok: true });
}