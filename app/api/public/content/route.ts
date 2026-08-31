import { NextResponse } from 'next/server';
import { getSiteSettings, getHomepageContent } from '@/lib/content';
import { listFeaturedReviews } from '@/lib/reviews';

// Public, unauthenticated endpoint returning storefront-safe content
// (brand, social, contact, footer, copyright, announcement). No secrets.
// Also returns safe featured reviews (customer_name, rating, comment, created_at only).
export async function GET() {
  const [siteSettings, homepage, featuredReviews] = await Promise.all([
    getSiteSettings(),
    getHomepageContent(),
    listFeaturedReviews().catch(() => []),
  ]);
  return NextResponse.json(
    {
      siteSettings,
      announcementText: homepage.announcementText,
      featuredReviews,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
