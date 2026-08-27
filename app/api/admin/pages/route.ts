import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/db/auth';
import { listPages } from '@/lib/content';

// GET — list all managed static pages (admin only).
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const pages = await listPages();
  return NextResponse.json({ pages });
}
