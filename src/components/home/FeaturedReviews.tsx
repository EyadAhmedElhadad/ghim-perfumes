'use client';

import type { FeaturedPublicReview } from '@/lib/reviews';

const STARS = [1, 2, 3, 4, 5] as const;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5`}>
      {STARS.map((s) => (
        <span
          key={s}
          className={s <= rating ? 'text-amber-400' : 'text-white/15'}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function FeaturedReviews({
  reviews,
}: {
  reviews: FeaturedPublicReview[];
}) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop md:py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <p className="font-label-caps text-label-caps uppercase tracking-[0.2em] text-amber-300/70">
          Testimonials
        </p>
        <h2 className="mt-2 font-display-lg text-display-md-mobile leading-tight md:text-headline-lg gold-text">
          Words of Appreciation
        </h2>
        <p className="mx-auto mt-3 max-w-2xl font-body-lg text-sm leading-relaxed text-on-surface-variant md:text-base">
          Read authentic feedback from our fragrance connoisseurs.
        </p>
        <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
      </div>

      {/* Grid: 1 col mobile, 2 cols tablet, 3 cols desktop. Carousel effect via scroll snap on small screens is progressive: grid wraps, but on very small viewports cards overflow isn't needed — grid handles it cleanly. */}
      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <article
            key={r.id}
            className="group relative flex flex-col rounded-xl border border-amber-400/20 bg-[#111827]/70 p-6 backdrop-blur-md transition-all duration-300 hover:border-amber-400/40 hover:bg-[#111827]/85 hover:shadow-[0_8px_32px_rgba(212,175,55,0.12)]"
          >
            {/* subtle gold sheen top border */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent opacity-60" />

            {/* Quote mark */}
            <span className="pointer-events-none absolute right-5 top-4 font-serif text-5xl leading-none text-amber-400/10">
              “
            </span>

            <div className="flex items-center justify-between">
              <Stars rating={r.rating} />
              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 font-label-caps text-[10px] tracking-widest text-amber-300">
                {r.rating}.0
              </span>
            </div>

            {r.comment ? (
              <p className="mt-4 flex-1 font-body-md text-[15px] leading-relaxed text-slate-200/90">
                “{r.comment}”
              </p>
            ) : (
              <p className="mt-4 flex-1 font-body-md text-[15px] leading-relaxed text-slate-200/90">
                A wonderful fragrance experience.
              </p>
            )}

            <div className="mt-6 flex items-center gap-3 border-t border-white/5 pt-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-400/20 bg-amber-500/10 font-display-lg text-sm text-amber-300">
                {(r.customerName?.[0] ?? 'A').toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-headline-md text-sm font-semibold text-on-surface">
                  {r.customerName || 'Anonymous'}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {new Date(r.createdAt).toLocaleDateString('en-US', {
                    dateStyle: 'medium',
                  })}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
