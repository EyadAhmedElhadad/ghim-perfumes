'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { REVIEWS } from '@/lib/mock-data';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from './icons';

export default function SocialProof() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const total = REVIEWS.length;

  const updateIndex = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-slide]');
    if (!card) return;
    const cardW = card.offsetWidth + 16;
    const i = Math.round(el.scrollLeft / cardW);
    setIndex(Math.max(0, Math.min(total - 1, i)));
  }, [total]);

  useEffect(() => {
    updateIndex();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateIndex, { passive: true });
    window.addEventListener('resize', updateIndex);
    return () => {
      el.removeEventListener('scroll', updateIndex);
      window.removeEventListener('resize', updateIndex);
    };
  }, [updateIndex]);

  const scrollTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-slide]');
    if (!card) return;
    el.scrollTo({ left: i * (card.offsetWidth + 16), behavior: 'smooth' });
  };

  return (
    <section className="relative bg-surface-container-low py-16 md:py-24">
      <div className="mx-auto mb-8 max-w-container-max px-margin-mobile text-center md:px-margin-desktop">
        <span className="mb-2 inline-block text-secondary">
          <StarIcon className="h-5 w-5" />
        </span>
        <h2 className="font-headline-lg text-on-background">
          Whispers of the Cloud
        </h2>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-margin-mobile pb-8 md:px-margin-desktop"
        >
          {REVIEWS.map((r, i) => (
            <div
              key={i}
              data-slide
              className="glass-panel flex w-[280px] shrink-0 snap-center flex-col rounded-lg p-6 md:w-[350px]"
            >
              <div className="mb-4 flex gap-1 text-secondary">
                {Array.from({ length: 5 }).map((_, s) => (
                  <StarIcon key={s} className="h-4 w-4" />
                ))}
              </div>
              <p className="mb-6 flex-grow font-body-md italic text-on-background">
                {r.text}
              </p>
              <p className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant">
                — {r.author}
              </p>
            </div>
          ))}
        </div>

        <button
          aria-label="Previous reviews"
          onClick={() => scrollTo(Math.max(0, index - 1))}
          className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-surface-container-high p-2.5 text-secondary shadow-lg transition-colors hover:bg-surface-container-highest sm:block"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          aria-label="Next reviews"
          onClick={() => scrollTo(Math.min(total - 1, index + 1))}
          className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-surface-container-high p-2.5 text-secondary shadow-lg transition-colors hover:bg-surface-container-highest sm:block"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <p className="text-center font-body-md text-sm text-on-surface-variant">
        {index + 1} / {total}
      </p>
    </section>
  );
}