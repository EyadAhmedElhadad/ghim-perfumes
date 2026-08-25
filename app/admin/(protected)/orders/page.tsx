'use client';

import { useEffect, useState } from 'react';
import { Panel } from '@/components/admin/ui';
import { formatPrice } from '@/lib/format';
import type { Order } from '@/lib/types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  fulfilled: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-error-container/60 text-on-error-container border-error/40',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/orders');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to load orders');
        if (active) setOrders(data.orders ?? []);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load orders. Make sure Neon/DATABASE_URL is configured.',
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <Panel title="Orders">
        {error ? (
          <div className="rounded-lg border border-error/40 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
            {error}
          </div>
        ) : orders === null ? (
          <p className="py-10 text-center text-sm text-on-surface-variant">
            Loading orders…
          </p>
        ) : orders.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-4xl">📦</p>
            <p className="mt-3 font-headline-md text-lg font-semibold text-on-surface">
              No orders yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-on-surface-variant">
              Once customers complete checkout, their orders will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((o) => (
              <li
                key={o.id}
                className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-headline-md text-sm font-semibold text-on-surface">
                      {o.address.fullName}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {o.id} ·{' '}
                      {new Date(o.createdAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                        STATUS_STYLES[o.status] ??
                        'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {o.status}
                    </span>
                    <span className="font-headline-md font-semibold text-secondary">
                      {formatPrice(o.total, o.currency)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                      Items
                    </p>
                    <ul className="mt-1 space-y-1">
                      {o.items.map((it) => (
                        <li
                          key={it.id}
                          className="text-sm text-on-surface"
                        >
                          {it.name}{' '}
                          <span className="text-on-surface-variant">
                            × {it.qty}
                          </span>{' '}
                          <span className="text-on-surface-variant/70">
                            ({formatPrice(it.price * it.qty, o.currency)})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                      Shipping address
                    </p>
                    <p className="mt-1 text-sm text-on-surface">
                      {o.address.governorate}
                      {o.address.governorateAr ? (
                        <span className="text-on-surface-variant">
                          {' '}
                          · {o.address.governorateAr}
                        </span>
                      ) : null}
                      {' — '}
                      {o.address.city}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      {o.address.addressLine}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      📞 {o.address.phone}
                    </p>
                    {o.address.notes ? (
                      <p className="mt-1 text-xs italic text-on-surface-variant">
                        “{o.address.notes}”
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Payment: {o.paymentMethod}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
