'use client';

import { useEffect, useMemo, useState } from 'react';
import { Panel, useToast } from '@/components/admin/ui';
import { TrashIcon } from '@/components/icons';

type Review = {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string | null;
  rating: number;
  comment: string;
  tags: string[];
  createdAt: string;
};

type Stats = {
  reviews: Review[];
  total: number;
  average: number;
  counts: Record<number, number>;
};

const STARS = [1, 2, 3, 4, 5] as const;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" aria-label={`${rating} out of 5`}>
      {STARS.map((s) => (
        <span
          key={s}
          className={s <= rating ? 'text-amber-400' : 'text-slate-600'}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/reviews', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to load reviews');
        setStats(data as Stats);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function deleteReview(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to delete review');
      }
      toast('Review deleted', 'success');
      setStats((curr) =>
        curr
          ? {
              ...curr,
              reviews: curr.reviews.filter((r) => r.id !== id),
              total: Math.max(0, curr.total - 1),
              average:
                curr.reviews.length > 1
                  ? Math.round(
                      ((curr.average * curr.reviews.length -
                        (curr.reviews.find((r) => r.id === id)?.rating ?? 0)) /
                        (curr.reviews.length - 1)) *
                        10,
                    ) / 10
                  : 0,
              counts: (() => {
                const r = curr.reviews.find((x) => x.id === id);
                const counts = { ...curr.counts };
                if (r && counts[r.rating] !== undefined) {
                  counts[r.rating] = Math.max(0, counts[r.rating] - 1);
                }
                return counts;
              })(),
            }
          : curr,
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete review', 'error');
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  const visible = useMemo(() => {
    if (!stats) return [];
    if (filter === 'all') return stats.reviews;
    return stats.reviews.filter((r) => r.rating === filter);
  }, [stats, filter]);

  return (
    <div className="space-y-5">
      <Panel title="Reviews & Feedback">
        {error ? (
          <div className="rounded-lg border border-error/40 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
            {error}
          </div>
        ) : loading || !stats ? (
          <p className="py-10 text-center text-sm text-on-surface-variant">
            Loading reviews…
          </p>
        ) : stats.total === 0 ? (
          <div className="py-10 text-center">
            <p className="text-4xl">💬</p>
            <p className="mt-3 font-headline-md text-lg font-semibold text-on-surface">
              No reviews yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-on-surface-variant">
              When an admin confirms an order, a review link can be shared with the
              customer. Submitted ratings appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-headline-md text-4xl font-semibold text-amber-300">
                    {stats.average.toFixed(1)}
                  </p>
                  <p className="text-xs text-on-surface-variant">out of 5.0</p>
                </div>
                <Stars rating={Math.round(stats.average)} />
                <p className="pb-1 text-sm text-on-surface-variant">
                  {stats.total} review{stats.total === 1 ? '' : 's'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="All"
                  active={filter === 'all'}
                  onClick={() => setFilter('all')}
                />
                {[5, 4, 3, 2, 1].map((n) => (
                  <FilterChip
                    key={n}
                    label={`${n} ★`}
                    count={stats.counts[n] ?? 0}
                    active={filter === n}
                    onClick={() => setFilter(n)}
                  />
                ))}
              </div>
            </div>

            <ul className="space-y-3">
              {visible.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-headline-md text-sm font-semibold text-on-surface">
                        {r.customerName || 'Anonymous'}
                      </span>
                      <Stars rating={r.rating} />
                    </div>
                    <div className="flex items-center gap-2">
                      {confirmingId === r.id ? (
                        <>
                          <button
                            type="button"
                            disabled={deletingId === r.id}
                            onClick={() => void deleteReview(r.id)}
                            className="rounded-full border border-error/50 bg-error-container/30 px-2.5 py-1 text-xs font-medium text-error transition-colors hover:bg-error-container/50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === r.id ? 'Deleting…' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === r.id}
                            onClick={() => setConfirmingId(null)}
                            className="rounded-full border border-outline-variant/40 bg-surface-container-high px-2.5 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          aria-label="Delete review"
                          disabled={deletingId === r.id}
                          onClick={() => setConfirmingId(r.id)}
                          className="rounded-full border border-outline-variant/40 bg-surface-container-high p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                      <span className="text-xs text-on-surface-variant">
                        {new Date(r.createdAt).toLocaleDateString('en-US', {
                          dateStyle: 'medium',
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Order{' '}
                    <code className="rounded bg-surface-container-high px-1.5 py-0.5 text-[11px] text-on-surface">
                      {r.orderId}
                    </code>
                  </p>
                  {r.comment ? (
                    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                      {r.comment}
                    </p>
                  ) : null}
                  {r.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 text-[11px] text-secondary"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'border-secondary bg-secondary/15 text-secondary'
          : 'border-outline-variant/40 bg-surface-container-high text-on-surface-variant hover:bg-surface-container'
      }`}
    >
      {label}
      {count !== undefined ? ` (${count})` : ''}
    </button>
  );
}
