import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentAdmin } from '@/lib/db/auth';
import {
  getHomepageContent,
  updateHomepageContent,
  type HomepageContent,
} from '@/lib/content';

const STRING_FIELDS = [
  'heroHeadline',
  'heroSubheadline',
  'heroBackgroundUrl',
  'heroCtaText',
  'heroCtaUrl',
  'announcementText',
] as const;

// GET — current homepage content (admin only).
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const content = await getHomepageContent();
  return NextResponse.json({ content });
}

// PUT — update homepage content (admin only).
export async function PUT(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const obj = (body ?? {}) as Record<string, unknown>;
  const patch: Partial<HomepageContent> = {};

  for (const field of STRING_FIELDS) {
    if (obj[field] === undefined) continue;
    if (typeof obj[field] !== 'string') {
      return NextResponse.json(
        { error: `Field "${field}" must be a string` },
        { status: 400 },
      );
    }
    patch[field] = obj[field] as string;
  }

  if (obj.featuredProductIds !== undefined) {
    if (
      !Array.isArray(obj.featuredProductIds) ||
      !obj.featuredProductIds.every((x) => typeof x === 'string')
    ) {
      return NextResponse.json(
        { error: 'featuredProductIds must be an array of strings' },
        { status: 400 },
      );
    }
    patch.featuredProductIds = obj.featuredProductIds as string[];
  }
  if (obj.signatureProductIds !== undefined) {
    if (
      !Array.isArray(obj.signatureProductIds) ||
      !obj.signatureProductIds.every((x) => typeof x === 'string')
    ) {
      return NextResponse.json(
        { error: 'signatureProductIds must be an array of strings' },
        { status: 400 },
      );
    }
    patch.signatureProductIds = obj.signatureProductIds as string[];
  }

  const content = await updateHomepageContent(patch);
  revalidatePath('/', 'layout');
  return NextResponse.json({ content });
}
