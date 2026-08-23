import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEMO_COOKIE, sessionCookieOptions } from '@/lib/db/auth';
import { isDbConfigured } from '@/lib/db/neon';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  // Demo login — Firebase removed. If DATABASE_URL is set we still use demo
  // admin cookie so the admin UI works against Neon.
  //
  // SECURITY: set ADMIN_PASSWORD in your production environment to require a
  // password on the demo login. When set, the client must send it in the
  // request body ({ password }). When unset, demo mode is open (local/dev).
  const required = process.env.ADMIN_PASSWORD;
  if (required) {
    let sent: string | undefined;
    try {
      const body = await req.json();
      sent = body?.password;
    } catch {
      // no body — treat as missing password
    }
    if (sent !== required) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
  }
  const store = await cookies();
  store.set(DEMO_COOKIE, '1', sessionCookieOptions(60 * 60 * 24 * 7));
  return NextResponse.json({ ok: true, demo: true, dbConfigured: isDbConfigured() });
}
