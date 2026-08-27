import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentAdmin } from '@/lib/db/auth';
import { getPageContent, updatePageContent } from '@/lib/content';

// GET — single page content (admin only).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { slug } = await params;
  const page = await getPageContent(slug);
  if (!page) {
    return NextResponse.json({ error: 'Unknown page' }, { status: 404 });
  }
  return NextResponse.json({ page });
}

// PUT — update a page's title/body (admin only).
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const obj = (body ?? {}) as Record<string, unknown>;
  const patch: { title?: string; body?: string } = {};
  if (obj.title !== undefined) {
    if (typeof obj.title !== 'string')
      return NextResponse.json({ error: 'title must be a string' }, { status: 400 });
    patch.title = obj.title;
  }
  if (obj.body !== undefined) {
    if (typeof obj.body !== 'string')
      return NextResponse.json({ error: 'body must be a string' }, { status: 400 });
    patch.body = obj.body;
  }

  const page = await updatePageContent(slug, patch);
  if (!page) {
    return NextResponse.json({ error: 'Unknown page' }, { status: 404 });
  }
  revalidatePath('/', 'layout');
  revalidatePath(`/p/${slug}`);
  return NextResponse.json({ page });
}
