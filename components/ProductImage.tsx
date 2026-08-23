'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BottleIcon } from './icons';

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
};

/**
 * Renders a product image via next/image, falling back to a neutral
 * placeholder (grey box + bottle icon) when the URL is missing, empty,
 * or fails to load. The wrapper is a relative box so `fill` works in
 * every context (cards, gallery, cart) without callers adding a parent.
 */
export default function ProductImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  priority = false,
}: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`relative flex items-center justify-center bg-surface-container-lowest text-on-surface-variant ${className}`}
        aria-label={alt}
      >
        <BottleIcon className="h-10 w-10 opacity-30" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        loading={priority ? 'eager' : loading}
        priority={priority}
        sizes="(max-width: 768px) 50vw, 33vw"
        className="object-cover"
        draggable={false}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
