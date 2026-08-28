'use client';

import { useEffect, useState, useTransition } from 'react';
import { Panel, useToast } from '@/components/admin/ui';
import { TrashIcon } from '@/components/icons';
import { formatPrice } from '@/lib/format';
import type { Order } from '@/lib/types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  confirmed: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

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

  async function changeStatus(id: string, status: Order['status']) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update order');
      startTransition(() => {
        setOrders((curr) => curr?.map((o) => (o.id === id ? data.order : o)) ?? curr);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteOrder(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to delete order');
      }
      toast('Order deleted', 'success');
      startTransition(() => {
        setOrders((curr) => curr?.filter((o) => o.id !== id) ?? curr);
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete order', 'error');
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

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
                    {confirmingId === o.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={deletingId === o.id}
                          onClick={() => void deleteOrder(o.id)}
                          className="rounded-full border border-error/50 bg-error-container/30 px-2.5 py-1 text-xs font-medium text-error transition-colors hover:bg-error-container/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === o.id ? 'Deleting…' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === o.id}
                          onClick={() => setConfirmingId(null)}
                          className="rounded-full border border-outline-variant/40 bg-surface-container-high px-2.5 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        aria-label="Delete order"
                        onClick={() => setConfirmingId(o.id)}
                        className="rounded-full border border-outline-variant/40 bg-surface-container-high p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
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
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      {o.address.addressLine}
                    </p>
                    {o.address.detailedAddress ? (
                      <p className="text-sm text-on-surface-variant">
                        {o.address.detailedAddress}
                      </p>
                    ) : null}
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(['pending', 'confirmed', 'delivered'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={isPending || updatingId === o.id || o.status === status}
                          onClick={() => void changeStatus(o.id, status)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                            o.status === status
                              ? 'border-secondary bg-secondary/15 text-secondary'
                              : 'border-outline-variant/40 bg-surface-container-high text-on-surface-variant hover:bg-surface-container'
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
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
