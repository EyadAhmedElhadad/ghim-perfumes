import 'server-only';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'ghim_admin_session';
export const DEMO_COOKIE = 'ghim_demo_admin';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type AdminSession = { uid: string; email: string; demo: boolean };

// Simple demo admin gate — Firebase removed. Set ADMIN_PASSWORD in .env.local
// to require a password on the demo login, otherwise demo mode is open.
export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const store = await cookies();
  if (store.get(DEMO_COOKIE)?.value === '1') {
    return { uid: 'demo', email: 'demo@ghim.local', demo: true };
  }
  if (store.get(SESSION_COOKIE)?.value) {
    return { uid: 'admin', email: 'admin@ghim.local', demo: false };
  }
  return null;
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export { SESSION_MAX_AGE };
