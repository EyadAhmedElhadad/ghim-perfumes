import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import nodePath from 'node:path';
import { getCurrentAdmin } from '@/lib/db/auth';
import { getCloudinaryConfig, signUploadParams, isCloudinaryConfigured } from '@/lib/cloudinary';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif', 'image/bmp'];
// Some browsers/files report an empty or non-standard MIME type, so also
// allow by file extension (e.g. iPhone HEIC, renamed files).
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'heic', 'heif', 'bmp'];
const MAX_BYTES = 10 * 1024 * 1024;

function extOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

export async function POST(req: NextRequest) {
  // Auth — only admin can upload
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const productId = (formData.get('productId') as string | null) || 'new';

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED.includes(file.type) && !ALLOWED_EXT.includes(extOf(file.name))) {
    return NextResponse.json(
      { error: 'Unsupported file type. Use JPG, PNG, WEBP, GIF, AVIF or HEIC.', code: 'storage/invalid-file-type' },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'File too large (max 10 MB).', code: 'storage/max-size-exceeded' },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();

  // Local fallback storage when Cloudinary isn't configured (demo / local dev).
  // Mirrors the product-list mock fallback so the uploader works without external services.
  if (!isCloudinaryConfigured()) {
    const safeName =
      file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_') || 'image';
    const dir = nodePath.join(process.cwd(), 'public', 'uploads', productId);
    await mkdir(dir, { recursive: true });
    const fileName = `${Date.now()}_${safeName}`;
    await writeFile(nodePath.join(dir, fileName), Buffer.from(arrayBuffer));
    const url = `/uploads/${productId}/${fileName}`;
    return NextResponse.json({ url, path: url });
  }

  const { cloudName, apiKey } = getCloudinaryConfig();

  // Safe filename
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_') || 'image';
  const folder = `ghm/products/${productId}`;
  const timestamp = String(Math.floor(Date.now() / 1000));

  // Cloudinary signed upload: params must be sorted alphabetically before signing
  const paramsToSign: Record<string, string> = {
    folder,
    timestamp,
  };
  const signature = signUploadParams(paramsToSign);

  // Build multipart request to Cloudinary
  const blob = new Blob([arrayBuffer], { type: file.type });

  const cloudForm = new FormData();
  cloudForm.append('file', blob, safeName);
  cloudForm.append('api_key', apiKey);
  cloudForm.append('timestamp', timestamp);
  cloudForm.append('folder', folder);
  cloudForm.append('signature', signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const cloudRes = await fetch(uploadUrl, {
    method: 'POST',
    body: cloudForm,
  });

  if (!cloudRes.ok) {
    const errText = await cloudRes.text().catch(() => '');
    let errJson: unknown = null;
    try {
      errJson = JSON.parse(errText);
    } catch {
      // not json
    }
    console.error('[cloudinary] upload failed', cloudRes.status, errText);
    return NextResponse.json(
      {
        error: 'Cloudinary upload failed',
        code: 'cloudinary/upload-failed',
        detail: errJson ?? errText,
      },
      { status: 502 },
    );
  }

  const data = (await cloudRes.json()) as {
    secure_url: string;
    public_id: string;
    url: string;
  };

  let url = data.secure_url || data.url;
  // Normalize delivery URL so Cloudinary auto-selects the best supported
  // format (e.g. HEIC -> JPG in browsers) and quality.
  url = url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
  const path = data.public_id; // store public_id for future delete/transform

  return NextResponse.json({ url, path });
}
