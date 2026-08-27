import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  SESSION_MAX_AGE,
} from '@/lib/db/auth';

export const runtime = 'nodejs';

// Real, password-protected admin login. Sets the non-demo admin session cookie
// (ghim_admin_session) so the dashboard reflects a genuine admin state instead
// of "DEMO". Only available when ADMIN_PASSWORD is configured.
export async function POST(req: Request) {
  const required = process.env.ADMIN_PASSWORD;
  if (!required) {
    return NextResponse.json(
      { error: 'Admin password is not configured on this environment.' },
      { status: 401 },
    );
  }

  let sent: string | undefined;
  try {
    const body = await req.json();
    sent = body?.password;
  } catch {
    /* no body — treat as missing password */
  }

  if (sent !== required) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, '1', sessionCookieOptions(SESSION_MAX_AGE));
  return NextResponse.json({ ok: true, demo: false });
}
