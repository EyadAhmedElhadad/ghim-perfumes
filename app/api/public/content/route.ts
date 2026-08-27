import { NextResponse } from 'next/server';
import { getSiteSettings, getHomepageContent } from '@/lib/content';

// Public, unauthenticated endpoint returning storefront-safe content
// (brand, social, contact, footer, copyright, announcement). No secrets.
export async function GET() {
  const [siteSettings, homepage] = await Promise.all([
    getSiteSettings(),
    getHomepageContent(),
  ]);
  return NextResponse.json(
    {
      siteSettings,
      announcementText: homepage.announcementText,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
