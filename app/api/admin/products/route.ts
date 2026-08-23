import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentAdmin } from '@/lib/db/auth';
import {
  listProducts,
  createProduct,
  type ProductListQuery,
} from '@/lib/db/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const q: ProductListQuery = {
    search: url.searchParams.get('search') ?? undefined,
    category: (url.searchParams.get('category') as ProductListQuery['category']) ?? 'all',
    stock: (url.searchParams.get('stock') as ProductListQuery['stock']) ?? 'all',
    sort: (url.searchParams.get('sort') as ProductListQuery['sort']) ?? 'date',
    dir: (url.searchParams.get('dir') as ProductListQuery['dir']) ?? 'desc',
    cursor: url.searchParams.get('cursor') ?? undefined,
    limit: url.searchParams.has('limit')
      ? Number(url.searchParams.get('limit'))
      : 10,
  };
  const result = await listProducts(q);
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const product = await createProduct(body);
    revalidatePath('/');
    revalidatePath('/products');
    revalidatePath(`/products/${product.slug}`);
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create product' },
      { status: 400 },
    );
  }
}