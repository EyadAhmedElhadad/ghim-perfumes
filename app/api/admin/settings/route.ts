import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentAdmin } from '@/lib/db/auth';
import {
  getSiteSettings,
  updateSiteSettings,
  type SiteSettings,
} from '@/lib/content';

const STRING_FIELDS = [
  'brandName',
  'instagramUrl',
  'whatsappNumber',
  'contactEmail',
  'contactPhone',
  'footerText',
  'copyrightText',
  'seoTitle',
  'seoDescription',
] as const;

// GET — current site-wide settings (admin only).
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

// PUT — update one or more site-wide settings (admin only).
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
  const patch: Partial<SiteSettings> = {};
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

  // Shipping configuration — structured (number + governorate fee map).
  if (obj.defaultShippingFee !== undefined) {
    const n = Number(obj.defaultShippingFee);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json(
        { error: 'Default shipping fee must be a non-negative number' },
        { status: 400 },
      );
    }
    patch.defaultShippingFee = n;
  }
  if (obj.shippingFees !== undefined) {
    if (
      typeof obj.shippingFees !== 'object' ||
      obj.shippingFees === null ||
      Array.isArray(obj.shippingFees)
    ) {
      return NextResponse.json(
        { error: 'shippingFees must be an object' },
        { status: 400 },
      );
    }
    const fees: Record<string, number> = {};
    for (const [k, v] of Object.entries(
      obj.shippingFees as Record<string, unknown>,
    )) {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) fees[k] = n;
    }
    patch.shippingFees = fees;
  }

  const settings = await updateSiteSettings(patch);
  revalidatePath('/', 'layout');
  return NextResponse.json({ settings });
}
