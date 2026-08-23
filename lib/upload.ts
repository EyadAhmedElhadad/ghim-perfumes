'use client';

export type UploadedMedia = { url: string; path: string };

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif', 'image/bmp'];
// Allow by extension too — some files (e.g. iPhone HEIC, renamed) report an
// empty/non-standard MIME type in the browser.
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'heic', 'heif', 'bmp'];
const MAX_BYTES = 10 * 1024 * 1024;

function extOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

/**
 * Uploads a single product image to Cloudinary via the server route
 * `POST /api/admin/upload` (signed with CLOUDINARY_API_SECRET on the server).
 * `onProgress` is called with 0-100. Returns the Cloudinary `secure_url`
 * and `public_id` (stored as `path`). Firebase Storage is no longer used.
 */
export function uploadProductImage(
  file: File,
  productId: string,
  onProgress?: (pct: number) => void,
): Promise<UploadedMedia> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED.includes(file.type) && !ALLOWED_EXT.includes(extOf(file.name))) {
      const e = new Error('Unsupported file type. Use JPG, PNG, WEBP, GIF, AVIF or HEIC.') as Error & { code?: string };
      e.code = 'storage/invalid-file-type';
      reject(e);
      return;
    }
    if (file.size > MAX_BYTES) {
      const e = new Error('File too large (max 10 MB).') as Error & { code?: string };
      e.code = 'storage/max-size-exceeded';
      reject(e);
      return;
    }

    onProgress?.(10);

    const form = new FormData();
    form.append('file', file);
    form.append('productId', productId);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/upload');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress?.(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { url: string; path: string };
          if (!data.url) throw new Error('No URL returned');
          console.log('[upload] Cloudinary URL:', data.url);
          console.log('[upload] public_id:', data.path);
          onProgress?.(100);
          resolve({ url: data.url, path: data.path });
        } catch (err) {
          reject(err as Error);
        }
      } else {
        let body: unknown = xhr.responseText;
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          // keep raw
        }
        const msg =
          (body as { error?: string })?.error || `Upload failed (${xhr.status})`;
        const code = (body as { code?: string })?.code || 'cloudinary/upload-failed';
        const e = new Error(msg) as Error & { code?: string };
        e.code = code;
        reject(e);
      }
    };

    xhr.onerror = () => {
      const e = new Error('Network error during upload') as Error & { code?: string };
      e.code = 'cloudinary/network-error';
      reject(e);
    };

    xhr.send(form);
  });
}

/** Reads a product document back from Neon after a write (admin API). */
export async function readProductDoc(id: string) {
  try {
    const res = await fetch(`/api/admin/products/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
