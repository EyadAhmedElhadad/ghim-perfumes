'use client';

import { useCallback, useRef, useState } from 'react';
import type { ProductMedia } from '@/lib/types';
import ProductImageBox from './ProductImage';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
} from './icons';

type Props = {
  images: ProductMedia[];
  name: string;
};

export default function ProductGallery({ images, name }: Props) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + images.length) % images.length);
    },
    [images.length],
  );

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
  };

  const active = images[index] ?? images[0];

  return (
    <div className="w-full">
      <div
        className="relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-low glass-panel"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={() => setLightbox(true)}
        role="button"
        aria-label={`Open ${active?.alt ?? name} fullscreen`}
      >
        <ProductImageBox
          src={active?.url ?? null}
          alt={active?.alt ?? name}
          priority
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
        />
        {active ? (
          <div className="pointer-events-none absolute bottom-3 right-3 rounded bg-surface-container-lowest/80 px-2.5 py-1 font-body-md text-[11px] text-on-surface-variant backdrop-blur">
            {index + 1} / {images.length}
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-3">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Show ${img.alt}`}
            className={`aspect-[4/5] overflow-hidden rounded-lg bg-surface-container-low ring-2 transition-all ${
              i === index
                ? 'ring-secondary'
                : 'ring-transparent hover:ring-outline-variant'
            }`}
          >
            <ProductImageBox
              src={img.url}
              alt={img.alt}
              loading="lazy"
              className="h-full w-full object-cover opacity-80"
            />
          </button>
        ))}
      </div>

      {lightbox && (
        <Lightbox
          images={images}
          index={index}
          go={go}
          name={name}
          onClose={() => setLightbox(false)}
        />
      )}
    </div>
  );
}

function Lightbox({
  images,
  index,
  go,
  name,
  onClose,
}: {
  images: ProductMedia[];
  index: number;
  go: (d: 1 | -1) => void;
  name: string;
  onClose: () => void;
}) {
  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
    >
      <button
        aria-label="Close lightbox"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"
      >
        <CloseIcon className="h-6 w-6" />
      </button>

      <button
        aria-label="Previous image"
        onClick={(e) => {
          e.stopPropagation();
          go(-1);
        }}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"
      >
        <ChevronLeftIcon className="h-6 w-6" />
      </button>

      <figure
        className="flex h-full max-h-[88vh] w-full max-w-3xl flex-col items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <ProductImageBox
          src={images[index].url}
          alt={images[index].alt}
          className="max-h-[78vh] w-auto rounded-lg object-contain shadow-2xl"
        />
        <figcaption className="mt-4 text-center">
          <p className="font-body-md text-sm text-white/80">
            {name} — {index + 1} / of {images.length}
          </p>
        </figcaption>
      </figure>

      <button
        aria-label="Next image"
        onClick={(e) => {
          e.stopPropagation();
          go(1);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"
      >
        <ChevronRightIcon className="h-6 w-6" />
      </button>
    </div>
  );
}