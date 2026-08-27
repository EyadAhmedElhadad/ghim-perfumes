'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import ProductImage from '@/components/ProductImage';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';

const GUTTER = 24; // matches --spacing-gutter

function CarouselCard({ product }: { product: Product }) {
  const [hoverFailed, setHoverFailed] = useState(false);
  const defaultUrl = product.images[0]?.url ?? null;
  const hoverUrl = product.hoverImage?.url ?? null;
  const showHover = Boolean(hoverUrl) && !hoverFailed;

  return (
    <Link
      href={`/products/${product.slug}`}
      draggable={false}
      className={`product-card group flex flex-col overflow-hidden rounded-lg border border-outline-variant/30 glass-panel transition-all hover:border-secondary/40${showHover ? ' has-hover' : ''}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-container-low">
        <ProductImage
          src={defaultUrl}
          alt={product.images[0]?.alt ?? product.name}
          className="swap-default !absolute inset-0 h-full w-full object-cover"
        />
        {showHover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hoverUrl as string}
            alt={`${product.name} — plain studio shot`}
            draggable={false}
            onError={() => setHoverFailed(true)}
            className="swap-hover !absolute inset-0 h-full w-full object-cover opacity-0"
          />
        )}
        {product.compareAtPrice != null && (
          <span className="absolute left-3 top-3 z-10 rounded bg-secondary px-2.5 py-1 font-label-caps text-[10px] font-semibold text-on-secondary">
            SALE
          </span>
        )}
      </div>
      <div className="p-4">
        <h2 className="font-headline-md text-on-background">{product.name}</h2>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-body-md font-semibold text-secondary">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.compareAtPrice != null && (
            <span className="font-body-md text-sm text-on-surface-variant line-through">
              {formatPrice(product.compareAtPrice, product.currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function usePerView() {
  const [perView, setPerView] = useState(4);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < 640) setPerView(1);
      else if (w < 768) setPerView(2);
      else if (w < 1024) setPerView(3);
      else setPerView(4);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  return perView;
}

export default function BestSellersCarousel({ products }: { products: Product[] }) {
  const perView = usePerView();
  const totalPages = Math.max(1, Math.ceil(products.length / perView));
  const [page, setPage] = useState(0);

  const trackRef = useRef<HTMLDivElement>(null);

  // Keep the page counter / arrows in sync with scroll position (drag, swipe, or arrows).
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
        setPage((prev) =>
          prev === p ? prev : Math.min(Math.max(p, 0), totalPages - 1),
        );
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [totalPages]);

  // Drag-to-scroll (mouse). Touch uses native scrolling.
  // A click/tap that moves less than the threshold still navigates normally;
  // only a real drag (past the threshold) suppresses the click.
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

  if (products.length === 0) return null;

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
    <section className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="font-headline-lg text-secondary">Best Sellers</h2>

        <div className="flex items-center gap-3">
          <span className="font-label-caps text-label-caps tabular-nums text-on-surface-variant">
            {page + 1}/{totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={page === 0}
              aria-label="Previous"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/40 text-on-background transition-colors hover:border-secondary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={page === totalPages - 1}
              aria-label="Next"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/40 text-on-background transition-colors hover:border-secondary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory select-none items-start gap-gutter cursor-grab overflow-x-auto pb-2 active:cursor-grabbing [&_img]:[-webkit-user-drag:none] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {products.map((p) => (
          <div key={p.id} className="snap-start" style={cardStyle}>
            <CarouselCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
