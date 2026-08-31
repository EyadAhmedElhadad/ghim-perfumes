'use client';

import { useEffect, useRef, useState } from 'react';
import type { FeaturedPublicReview } from '@/lib/reviews';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';

const STARS = [1, 2, 3, 4, 5] as const;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex tracking-widest text-sm" aria-label={`${rating} out of 5`}>
      {STARS.map((s) => (
        <span key={s} className={s <= rating ? 'text-amber-400' : 'text-white/10'}>
          ★
        </span>
      ))}
    </span>
  );
}

// Elegant curated fallback — never empty, matches reference image luxury quotes
const FALLBACK_REVIEWS: FeaturedPublicReview[] = [
  {
    id: 'fallback-1',
    customerName: 'Fatima A.',
    rating: 5,
    comment: 'An enchanting fragrance that whispers elegance. The cloud-like softness stays with me all day.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'fallback-2',
    customerName: 'Layla M.',
    rating: 5,
    comment: 'GHIM captures the mystery of dusk till dawn. Every note feels composed like a gift.',
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'fallback-3',
    customerName: 'Omar K.',
    rating: 5,
    comment: 'Exceptional longevity and sillage. The 30% bundle made it even more irresistible.',
    createdAt: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'fallback-4',
    customerName: 'Sara H.',
    rating: 5,
    comment: 'A true Middle Eastern heritage in a bottle. Minimalist, luxurious, unforgettable.',
    createdAt: '2026-01-04T00:00:00.000Z',
  },
  {
    id: 'fallback-5',
    customerName: 'Youssef R.',
    rating: 5,
    comment: 'From the first spray to the dry down, it feels like wearing a cloud of confidence.',
    createdAt: '2026-01-05T00:00:00.000Z',
  },
];

const GUTTER = 24;

function usePerView() {
  const [perView, setPerView] = useState(3);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < 640) setPerView(1);
      else if (w < 1024) setPerView(2);
      else setPerView(3);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  return perView;
}

export default function WhispersOfTheCloud({
  reviews,
}: {
  reviews: FeaturedPublicReview[];
}) {
  const source = reviews && reviews.length > 0 ? reviews : FALLBACK_REVIEWS;
  const perView = usePerView();
  const totalPages = Math.max(1, Math.ceil(source.length / perView));
  const [page, setPage] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // Sync page with scroll position (drag, swipe, arrows)
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const pageWidth = el.clientWidth;
        if (pageWidth <= 0) return;
        const p = Math.round(el.scrollLeft / pageWidth);
        setPage((prev) => (prev === p ? prev : Math.min(Math.max(p, 0), totalPages - 1)));
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [totalPages]);

  // Drag-to-scroll (mouse) + touch native
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      isDown = true;
      moved = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 8) moved = true;
      el.scrollLeft = startScroll - dx;
    };
    const onUp = () => {
      isDown = false;
    };
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('click', onClickCapture, true);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  const go = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const pageWidth = el.clientWidth;
    const target = Math.min(Math.max(page + dir, 0), totalPages - 1);
    el.scrollTo({ left: target * pageWidth, behavior: 'smooth' });
  };

  const cardStyle: React.CSSProperties = {
    flex: `0 0 calc((100% - ${(perView - 1) * GUTTER}px) / ${perView})`,
  };

  return (
    <section className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop md:py-16">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="text-amber-400 text-lg leading-none" aria-hidden>
          ★
        </span>
        <h2 className="mt-2 font-serif text-slate-100 text-2xl lg:text-3xl text-center">
          Whispers of the Cloud
        </h2>
        <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
      </div>

      {/* Carousel wrapper with arrows */}
      <div className="relative">
        {/* Arrows - desktop, hidden on small touch where swipe is primary, but still accessible */}
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={page === 0}
          aria-label="Previous testimonials"
          className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-700/60 bg-[#131722]/90 p-2.5 text-slate-300 shadow-lg backdrop-blur transition-colors hover:border-amber-400/30 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-30 md:flex md:-left-3 lg:-left-6"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={page === totalPages - 1}
          aria-label="Next testimonials"
          className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-700/60 bg-[#131722]/90 p-2.5 text-slate-300 shadow-lg backdrop-blur transition-colors hover:border-amber-400/30 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-30 md:flex md:-right-3 lg:-right-6"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>

        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory select-none gap-gutter overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {source.map((r) => (
            <div key={r.id} className="snap-start" style={cardStyle}>
              <article className="flex h-full min-h-[220px] flex-col rounded-xl border border-slate-800/80 bg-[#1c192b]/80 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-purple-900/30 hover:shadow-[0_8px_32px_rgba(120,80,180,0.15)] md:bg-[#131722]/90">
                <div className="mb-3 text-amber-400 text-sm tracking-widest">
                  <Stars rating={r.rating} />
                </div>
                <p className="flex-1 italic text-slate-200 text-sm lg:text-base leading-relaxed line-clamp-4 min-h-[4.5rem]">
                  “{r.comment}”
                </p>
                <p className="text-slate-400 text-xs tracking-wider uppercase font-medium mt-4">
                  — {r.customerName ? r.customerName.toUpperCase() : 'ANONYMOUS'}
                </p>
              </article>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination — centered page indicator / dots */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <span className="font-label-caps text-label-caps tabular-nums text-on-surface-variant">
          {page + 1} / {totalPages}
        </span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to page ${i + 1}`}
              aria-current={i === page ? 'true' : undefined}
              onClick={() => {
                const el = trackRef.current;
                if (!el) return;
                el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === page ? 'w-6 bg-amber-400' : 'w-1.5 bg-slate-600 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
