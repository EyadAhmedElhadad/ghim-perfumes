import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/db/auth';
import { setAdminPassword } from '@/lib/db/auth';

export const runtime = 'nodejs';

// Change the admin password from the dashboard. Requires an authenticated
// admin session (demo or real). The new password is stored hashed in Neon
// (or a local file in demo mode) and immediately becomes the active credential.
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const password = (body as { password?: unknown })?.password;
  if (typeof password !== 'string' || password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 },
    );
  }

  await setAdminPassword(password);
  return NextResponse.json({ ok: true });
}
