import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, DEMO_COOKIE } from '@/lib/db/auth';

export const runtime = 'nodejs';

export async function POST() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(DEMO_COOKIE);
  return NextResponse.json({ ok: true });
}