import 'server-only';
import crypto from 'crypto';

// Cloudinary config from env — never exposed to client
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export function isCloudinaryConfigured(): boolean {
  return Boolean(cloudName && apiKey && apiSecret);
}

export function getCloudinaryConfig() {
  return { cloudName: cloudName!, apiKey: apiKey!, apiSecret: apiSecret! };
}

/**
 * Create a signed upload signature for Cloudinary.
 * Cloudinary expects: sha1( sorted_params + api_secret )
 * where sorted_params is e.g. "folder=products/123&timestamp=171..."
 */
export function signUploadParams(params: Record<string, string>): string {
  const { apiSecret: secret } = getCloudinaryConfig();
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(toSign + secret).digest('hex');
}
