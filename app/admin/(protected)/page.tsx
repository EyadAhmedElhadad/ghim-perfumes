import Link from 'next/link';
import { getStats, listProducts } from '@/lib/db/db';
import { StatusBadge } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [stats, recent] = await Promise.all([
    getStats(),
    listProducts({ limit: 5, sort: 'date', dir: 'desc' }),
  ]);

  const cards = [
    { label: 'Total products', value: stats.total },
    { label: 'In stock', value: stats.in },
    { label: 'Low stock', value: stats.low },
    { label: 'Out of stock', value: stats.out },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5"
          >
            <p className="text-xs tracking-wide text-on-surface-variant uppercase">
              {c.label}
            </p>
            <p className="mt-2 font-headline-md text-3xl font-bold text-on-surface">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5 lg:col-span-2">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="font-headline-md text-lg font-semibold">
              Recently updated
            </h2>
            <Link
              href="/admin/products"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </header>
          <ul className="divide-y divide-outline-variant/40">
            {recent.items.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {p.images[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images[0].url}
                      alt=""
                      className="size-10 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="size-10 shrink-0 rounded-lg bg-surface-container-high" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-on-surface">
                      {p.name}
                    </p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {p.category} · {p.concentration}
                    </p>
                  </div>
                </div>
                <StatusBadge status={p.stockStatus} />
                <span className="w-24 text-right text-sm font-medium text-secondary">
                  {p.price.toLocaleString()} {p.currency}
                </span>
              </li>
            ))}
            {recent.items.length === 0 && (
              <li className="py-6 text-center text-sm text-on-surface-variant">
                No products yet. Add your first product.
              </li>
            )}
          </ul>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5">
            <h2 className="font-headline-md text-lg font-semibold">Quick actions</h2>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/admin/products/new"
                className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-on-primary transition-colors hover:bg-primary-fixed-dim"
              >
                + Add product
              </Link>
              <Link
                href="/admin/collections"
                className="rounded-lg border border-outline-variant px-4 py-2 text-center text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
              >
                Manage collections
              </Link>
              <Link
                href="/admin/orders"
                className="rounded-lg border border-outline-variant px-4 py-2 text-center text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
              >
                View orders
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}