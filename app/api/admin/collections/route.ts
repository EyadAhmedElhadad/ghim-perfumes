import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentAdmin } from '@/lib/db/auth';
import {
  getCollectionImages,
  updateCollectionImage,
  type CollectionKey,
} from '@/lib/homepage-collections';

// GET — current "For Her" / "For Him" collection card images.
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const images = await getCollectionImages();
  return NextResponse.json({ images });
}

// PUT — update a single collection card image.
// Body: { key: 'her' | 'him', imageUrl: string }
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

  const { key, imageUrl } = (body ?? {}) as {
    key?: string;
    imageUrl?: string;
  };

  if (key !== 'her' && key !== 'him') {
    return NextResponse.json(
      { error: 'key must be "her" or "him"' },
      { status: 400 },
    );
  }
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return NextResponse.json(
      { error: 'imageUrl is required' },
      { status: 400 },
    );
  }

  const images = await updateCollectionImage(
    key as CollectionKey,
    imageUrl.trim(),
  );

  revalidatePath('/');

  return NextResponse.json({ images });
}
