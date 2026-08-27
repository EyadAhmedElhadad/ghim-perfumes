import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  SESSION_MAX_AGE,
  verifyAdminPassword,
} from '@/lib/db/auth';

export const runtime = 'nodejs';

// Real, password-protected admin login. Verifies against the dashboard-set
// password (stored hashed in Neon / local file) or the ADMIN_PASSWORD env
// fallback, then sets the non-demo admin session cookie so the dashboard
// reflects a genuine admin state (LIVE) instead of "DEMO".
export async function POST(req: Request) {
  let sent: string | undefined;
  try {
    const body = await req.json();
    sent = body?.password;
  } catch {
    /* no body — treat as missing password */
  }

  const ok = await verifyAdminPassword(sent ?? '');
  if (!ok) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, '1', sessionCookieOptions(SESSION_MAX_AGE));
  return NextResponse.json({ ok: true, demo: false });
}
