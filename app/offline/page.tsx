import Link from 'next/link';

export const metadata = {
  title: 'Offline | GHIM',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center text-on-surface">
      <p className="font-headline-lg text-3xl text-secondary">GHIM</p>
      <h1 className="mt-6 font-headline-md text-2xl">You&apos;re offline</h1>
      <p className="mt-3 max-w-sm font-body-md text-on-surface-variant">
        It looks like you&apos;ve lost your connection. Check your network and try
        again — your cart is safe.
      </p>
      <Link
        href="/"
        className="gold-glow mt-8 rounded bg-secondary px-8 py-3 font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-secondary transition-colors hover:bg-secondary-fixed"
      >
        Back to store
      </Link>
    </main>
  );
}
