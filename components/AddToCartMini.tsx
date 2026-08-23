'use client';

import { useCart } from '@/store/cart';
import type { CartItem } from '@/lib/types';

type Props = {
  item: Omit<CartItem, 'qty'>;
  className?: string;
};

export default function AddToCartMini({ item, className = '' }: Props) {
  const add = useCart((s) => s.add);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        add(item, 1);
      }}
      aria-label={`Add ${item.name} to bag`}
      title="Add to bag"
      className={className}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M6 8h12l1 13H5z" />
        <path d="M9 10V6a3 3 0 0 1 6 0v4" />
      </svg>
    </button>
  );
}