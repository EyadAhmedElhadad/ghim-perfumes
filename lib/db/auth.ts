import 'server-only';
import crypto from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { cookies } from 'next/headers';
import { getNeon, isDbConfigured } from './neon';

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

// ----------------------------------------------------------------------------
// Admin password — stored hashed in Neon (or a local file in demo mode) and
// changeable from the dashboard, with a fallback to the ADMIN_PASSWORD env var.
// ----------------------------------------------------------------------------

const AUTH_DEMO_FILE = path.join(process.cwd(), 'data', 'admin-auth.json');

function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(pw: string, stored: string): boolean {
  if (!stored || !stored.startsWith('scrypt$')) return false;
  const [, salt, hash] = stored.split('$');
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(pw, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(derived, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function loadStoredHash(): Promise<string | null> {
  if (isDbConfigured()) {
    try {
      const sql = getNeon();
      await sql`
        CREATE TABLE IF NOT EXISTS admin_auth (
          id TEXT PRIMARY KEY,
          password_hash TEXT NOT NULL DEFAULT ''
        );
      `;
      const rows = (await sql`SELECT password_hash FROM admin_auth WHERE id = 'global' LIMIT 1`) as unknown[];
      const row = rows[0] as { password_hash?: string } | undefined;
      return row?.password_hash || null;
    } catch {
      /* fall through to file */
    }
  }
  try {
    const raw = readFileSync(AUTH_DEMO_FILE, 'utf8');
    return (JSON.parse(raw) as { hash?: string }).hash || null;
  } catch {
    return null;
  }
}

// Accepts the dashboard-set (DB/file) password, and also the ADMIN_PASSWORD
// env var as an always-available recovery key (so an admin can never be
// locked out by forgetting the dashboard password).
export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (!password) return false;
  const stored = await loadStoredHash();
  if (stored && verifyPassword(password, stored)) return true;
  const env = process.env.ADMIN_PASSWORD;
  if (env && password === env) return true;
  return false;
}

export async function setAdminPassword(password: string): Promise<void> {
  const hash = hashPassword(password);
  if (isDbConfigured()) {
    try {
      const sql = getNeon();
      await sql`
        CREATE TABLE IF NOT EXISTS admin_auth (
          id TEXT PRIMARY KEY,
          password_hash TEXT NOT NULL DEFAULT ''
        );
      `;
      await sql`
        INSERT INTO admin_auth (id, password_hash)
        VALUES ('global', ${hash})
        ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash
      `;
      return;
    } catch {
      /* fall through to file */
    }
  }
  try {
    mkdirSync(path.dirname(AUTH_DEMO_FILE), { recursive: true });
    writeFileSync(AUTH_DEMO_FILE, JSON.stringify({ hash }), 'utf8');
  } catch {
    /* ignore */
  }
}
