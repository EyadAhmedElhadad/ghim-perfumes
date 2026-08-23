'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, GiftNote } from '@/lib/types';

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  giftNote: GiftNote;
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  setGiftNote: (note: Partial<GiftNote>) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      giftNote: { enabled: false, message: '' },

      add: (item: Omit<CartItem, 'qty'>, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          const items = existing
            ? state.items.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + qty } : i,
              )
            : [...state.items, { ...item, qty }];
          return { items, isOpen: true };
        }),

      remove: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      setQty: (id, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),

      clear: () => set({ items: [] }),

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      setGiftNote: (note) =>
        set((state) => ({ giftNote: { ...state.giftNote, ...note } })),
    }),
    { name: 'ghim-cart' },
  ),
);

export const selectCount = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.qty, 0);

export const selectSubtotal = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.price * i.qty, 0);