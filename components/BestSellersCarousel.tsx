'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import ProductImage from '@/components/ProductImage';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';

function CarouselCard({ product }: { product: Product }) {
  const [hoverFailed, setHoverFailed] = useState(false);
  const defaultUrl = product.images[0]?.url ?? null;
  const hoverUrl = product.hoverImage?.url ?? null;
  const showHover = Boolean(hoverUrl) && !hoverFailed;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`product-card group flex h-full flex-col overflow-hidden rounded-lg border border-outline-variant/30 glass-panel transition-all hover:border-secondary/40${showHover ? ' has-hover' : ''}`}
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
  const safePage = Math.min(page, totalPages - 1);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  if (products.length === 0) return null;

  const go = (dir: -1 | 1) =>
    setPage((p) => Math.min(Math.max(p + dir, 0), totalPages - 1));

  return (
    <section className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="font-headline-lg text-secondary">Best Sellers</h2>

        <div className="flex items-center gap-3">
          <span className="font-label-caps text-label-caps tabular-nums text-on-surface-variant">
            {safePage + 1}/{totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={safePage === 0}
              aria-label="Previous"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/40 text-on-background transition-colors hover:border-secondary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={safePage === totalPages - 1}
              aria-label="Next"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/40 text-on-background transition-colors hover:border-secondary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${safePage * 100}%)` }}
        >
          {Array.from({ length: totalPages }).map((_, pg) => (
            <div
              key={pg}
              className="flex w-full shrink-0 gap-gutter"
              aria-hidden={pg !== safePage}
            >
              {products
                .slice(pg * perView, pg * perView + perView)
                .map((p) => (
                  <div key={p.id} className="min-w-0 flex-1">
                    <CarouselCard product={p} />
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
