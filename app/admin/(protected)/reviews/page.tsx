'use client';

import { useEffect, useMemo, useState } from 'react';
import { Panel, useToast } from '@/components/admin/ui';
import { TrashIcon, StarIcon, SparkleIcon } from '@/components/icons';

type Review = {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string | null;
  rating: number;
  comment: string;
  tags: string[];
  isFeatured: boolean;
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
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/reviews', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to load reviews');
        // Normalize: handle both isFeatured (camel) and is_featured (snake) for backward compat
        const raw = data as Stats & { reviews: Array<Review & { is_featured?: boolean; isFeatured?: boolean }> };
        const normalized: Stats = {
          ...raw,
          reviews: raw.reviews.map((r) => ({
            ...r,
            isFeatured: Boolean((r as unknown as Record<string, unknown>).isFeatured ?? (r as unknown as Record<string, unknown>).is_featured ?? false),
          })),
        };
        setStats(normalized);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggleFeatured(id: string, nextFeatured: boolean) {
    setTogglingId(id);
    // optimistic update
    setStats((curr) =>
      curr
        ? {
            ...curr,
            reviews: curr.reviews.map((r) =>
              r.id === id ? { ...r, isFeatured: nextFeatured } : r,
            ),
          }
        : curr,
    );
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: nextFeatured }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Failed to update featured status');
      // sync from server truth
      const serverFeatured = Boolean(
        (data.review as Review)?.isFeatured ??
          (data.review as Record<string, unknown>)?.is_featured ??
          nextFeatured,
      );
      setStats((curr) =>
        curr
          ? {
              ...curr,
              reviews: curr.reviews.map((r) =>
                r.id === id ? { ...r, isFeatured: serverFeatured } : r,
              ),
            }
          : curr,
      );
      toast(
        serverFeatured ? 'Review featured on homepage' : 'Review removed from homepage',
        'success',
      );
    } catch (err) {
      // revert optimistic on error
      setStats((curr) =>
        curr
          ? {
              ...curr,
              reviews: curr.reviews.map((r) =>
                r.id === id ? { ...r, isFeatured: !nextFeatured } : r,
              ),
            }
          : curr,
      );
      toast(err instanceof Error ? err.message : 'Failed to update featured status', 'error');
    } finally {
      setTogglingId(null);
    }
  }

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
                  className={`rounded-xl border p-4 transition-colors ${
                    r.isFeatured
                      ? 'border-amber-400/40 bg-amber-500/[0.06] shadow-[0_0_0_1px_rgba(251,191,36,0.12)]'
                      : 'border-outline-variant/40 bg-surface-container-lowest'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-headline-md text-sm font-semibold text-on-surface">
                        {r.customerName || 'Anonymous'}
                      </span>
                      <Stars rating={r.rating} />
                      {r.isFeatured ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-300">
                          <StarIcon className="h-3 w-3 text-amber-300" />
                          Featured on Home
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={r.isFeatured ? 'Remove from homepage' : 'Feature on homepage'}
                        title={r.isFeatured ? 'Remove from homepage' : 'Feature on homepage'}
                        disabled={togglingId === r.id}
                        onClick={() => void toggleFeatured(r.id, !r.isFeatured)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          r.isFeatured
                            ? 'border-amber-400/50 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                            : 'border-outline-variant/40 bg-surface-container-high text-on-surface-variant hover:border-amber-400/30 hover:text-amber-300'
                        }`}
                      >
                        <SparkleIcon className={`h-3.5 w-3.5 ${r.isFeatured ? 'text-amber-300' : ''}`} />
                        <span className="hidden sm:inline">
                          {togglingId === r.id
                            ? 'Saving…'
                            : r.isFeatured
                              ? 'Featured'
                              : 'Feature'}
                        </span>
                      </button>
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
