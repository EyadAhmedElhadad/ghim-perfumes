'use client';

import { useMemo, useState } from 'react';
import { useCart, selectCount } from '@/store/cart';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';
import PaymentIcons from './PaymentIcons';
import {
  BagIcon,
  CheckIcon,
  MinusIcon,
  PlusIcon,
  ShieldIcon,
} from './icons';

type Props = { product: Product };

export default function ProductInfo({ product }: Props) {
  const add = useCart((s) => s.add);
  const inCart = useCart((s) =>
    s.items.find((i) => i.id === product.id)?.qty ?? 0,
  );

  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 10;

  const discountPct = useMemo(() => {
    if (!onSale || !product.compareAtPrice) return 0;
    return Math.round((1 - product.price / product.compareAtPrice) * 100);
  }, [onSale, product.compareAtPrice, product.price]);

  const handleAdd = () => {
    if (outOfStock) return;
    setLoading(true);
    setTimeout(() => {
      add(
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          currency: product.currency,
          image: product.images[0]?.url ?? '',
          size: product.size,
        },
        qty,
      );
      setLoading(false);
    }, 650);
  };

  const stockBadge = outOfStock
    ? { text: 'Sold Out', cls: 'bg-surface-container-high text-on-surface-variant' }
    : lowStock
      ? { text: 'Low stock', cls: 'bg-error-container text-on-error-container' }
      : { text: 'In stock', cls: 'bg-secondary/20 text-secondary' };

  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <h1 className="font-headline-lg text-on-background">{product.name}</h1>

        {product.inspiredBy && product.inspiredByRetail && (
          <p className="mt-1.5 font-body-md text-[13px] text-on-surface-variant">
            {product.inspiredBy}             <span className="mx-1">·</span> Retail Price:{' '}
            <span className="font-medium gold-text">
              {formatPrice(product.inspiredByRetail, product.currency)}
            </span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label-caps text-[11px] uppercase tracking-wider ${stockBadge.cls}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          {stockBadge.text}
        </span>
        {lowStock && (
          <span className="font-body-md text-xs text-error">
            Only {product.stock} left
          </span>
        )}
      </div>

      <p className="font-body-md text-sm text-on-surface-variant">
        {product.concentration}. Size: {product.size}.
      </p>

      <div className="flex items-center gap-3">
        <span
          className={`font-display-lg font-semibold ${onSale ? 'text-error' : 'text-on-background'}`}
        >
          {formatPrice(product.price, product.currency)}
        </span>
        {onSale && product.compareAtPrice && (
          <>
            <span className="font-display-lg text-lg text-on-surface-variant line-through">
              {formatPrice(product.compareAtPrice, product.currency)}
            </span>
              <span className="rounded-full bg-error-container px-2.5 py-1 font-display-lg text-xs font-semibold text-on-error-container">
              SAVE {discountPct}%
            </span>
          </>
        )}
      </div>

      <p className="border-l-2 border-secondary pl-3 font-body-lg italic leading-6 text-on-surface-variant">
        {product.tagline}
      </p>

      <div className="flex items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="font-label-caps text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">
            Quantity
          </span>
          <div className="flex items-center rounded-full border border-outline-variant/40 bg-surface-container-lowest">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Decrease quantity"
              className="p-3 text-on-background transition-colors hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-10 text-center font-display-lg text-base font-semibold">
              {qty}
            </span>
            <button
              onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
              disabled={qty >= product.stock}
              aria-label="Increase quantity"
              className="p-3 text-on-background transition-colors hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {inCart > 0 && (
          <span className="mb-2 flex items-center gap-1 font-body-md text-sm text-on-surface-variant">
            <CheckIcon className="h-4 w-4 text-secondary" />
            {inCart} in cart
          </span>
        )}
      </div>

      <button
        onClick={handleAdd}
        disabled={outOfStock || loading}
        className="gold-glow gold-gradient flex w-full items-center justify-center gap-2 rounded py-4 font-label-caps text-label-caps uppercase tracking-[0.14em] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {outOfStock ? (
          'Sold Out'
        ) : loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-secondary/40 border-t-on-secondary" />
            Adding…
          </>
        ) : (
          <>
            <BagIcon className="h-4 w-4" />
            Add to Cart
          </>
        )}
      </button>

      <div className="glass-panel rounded-lg px-4 py-3">
        <p className="flex items-center justify-center gap-2 font-body-md text-xs font-medium text-on-surface-variant">
          <ShieldIcon className="h-4 w-4 text-secondary" />
          Guaranteed Safe &amp; Secure Checkout
        </p>
        <div className="mt-3 flex items-center justify-center">
          <PaymentIcons />
        </div>
      </div>
    </div>
  );
}