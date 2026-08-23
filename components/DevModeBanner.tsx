import { isDbConfigured } from '@/lib/db/neon';

/**
 * Dev-only banner that warns loudly if the app is NOT connected to a real
 * database (Neon) and is therefore serving mock/demo product data. This
 * prevents the silent fallback that previously made uploaded images
 * "disappear".
 *
 * Server component: reads the real server-side DATABASE_URL (which is NOT
 * exposed to the browser, so a client check would always report false).
 */
export default function DevModeBanner() {
  if (process.env.NODE_ENV !== 'development') return null;
  if (isDbConfigured()) return null;

  return (
    <div className="sticky top-0 z-[100] bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-black">
      DEMO MODE — Neon database not configured. Showing mock product data;
      admin uploads will not appear on the live store. Set{' '}
      <code className="mx-1">DATABASE_URL</code> in{' '}
      <code className="mx-1">.env.local</code>.
    </div>
  );
}
