import { NextResponse } from 'next/server';
import { listFeaturedReviews } from '@/lib/reviews';

export const runtime = 'nodejs';

// Public endpoint — returns only safe fields for featured reviews
// { id, customerName, rating, comment, createdAt }
export async function GET() {
  try {
    const reviews = await listFeaturedReviews();
    return NextResponse.json(
      { reviews },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return NextResponse.json(
      { reviews: [] },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
