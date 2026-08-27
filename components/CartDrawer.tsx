'use client';

import { useState } from 'react';
import { useCart, selectCount, selectSubtotal } from '@/store/cart';
import { formatPrice } from '@/lib/format';
import ProductImage from '@/components/ProductImage';
import {
  CloseIcon,
  GiftIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon,
} from './icons';
import Link from 'next/link';

const PROMO_THRESHOLD = 2;

export default function CartDrawer() {
  const items = useCart((s) => s.items);
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const giftNote = useCart((s) => s.giftNote);
  const setGiftNote = useCart((s) => s.setGiftNote);
  const cartNote = useCart((s) => s.cartNote);
  const setCartNote = useCart((s) => s.setCartNote);
  const count = useCart(selectCount);
  const subtotal = useCart(selectSubtotal);
  const currency = items[0]?.currency ?? 'EGP';

  const [noteOpen, setNoteOpen] = useState(false);

  const remaining = Math.max(0, PROMO_THRESHOLD - count);
  const progress = Math.min(1, count / PROMO_THRESHOLD);
  const promoCopy =
    remaining > 0
      ? `Add ${remaining} more perfume${remaining > 1 ? 's' : ''} to get 30% OFF + Free Shipping`
      : "You've unlocked 30% OFF + Free Shipping!";

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={close}
        aria-hidden
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-surface-container-low shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Shopping bag"
      >
        <div className="flex items-center justify-between border-b border-outline-variant/60 px-5 py-4">
          <h2 className="font-headline-md text-on-surface">Cart</h2>
          <button
            onClick={close}
            aria-label="Close cart"
            className="rounded-full p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-secondary"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="font-headline-lg text-on-surface">Your bag is empty.</p>
            <p className="font-body-md text-sm text-on-surface-variant">
              Add a fragrance to get 30% off + free shipping.
            </p>
            <button
              onClick={close}
              className="gold-glow mt-2 rounded bg-secondary px-8 py-3 font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-secondary transition-colors hover:bg-secondary-fixed"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Free shipping / discount progress */}
            <div className="border-b border-outline-variant/60 px-5 py-4">
              <div className="flex items-center gap-2">
                <TruckIcon className="h-4 w-4 shrink-0 text-secondary" />
                <p className="font-body-md text-xs text-on-surface-variant">
                  {promoCopy}
                </p>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full bg-secondary transition-all duration-500"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>

            <div className="hide-scrollbar flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-body-md text-sm font-semibold text-on-surface">
                            {item.name}
                          </p>
                          <p className="font-body-md text-xs text-on-surface-variant">
                            {item.size}
                          </p>
                        </div>
                        <button
                          onClick={() => remove(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-error"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-outline-variant bg-surface-container-low">
                          <button
                            onClick={() => setQty(item.id, item.qty - 1)}
                            aria-label="Decrease quantity"
                            className="p-1.5 text-on-surface hover:text-secondary"
                          >
                            <MinusIcon className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-7 text-center font-body-md text-sm">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => setQty(item.id, item.qty + 1)}
                            aria-label="Increase quantity"
                            className="p-1.5 text-on-surface hover:text-secondary"
                          >
                            <PlusIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="font-body-md text-sm font-semibold text-secondary">
                          {formatPrice(item.price * item.qty, item.currency)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Make it a Gift upsell */}
              {!giftNote.enabled && (
                <button
                  type="button"
                  onClick={() => setGiftNote({ enabled: true })}
                  className="mt-5 flex w-full items-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-low p-3 text-left transition-colors hover:border-secondary/50"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
                    <GiftIcon className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-body-md text-sm font-semibold text-on-surface">
                      Gift note
                    </span>
                    <span className="block font-body-md text-xs text-on-surface-variant">
                      +{formatPrice(50, currency)}
                    </span>
                  </span>
                  <span className="rounded-full border border-secondary/50 px-3 py-1 font-label-caps text-xs uppercase tracking-[0.14em] text-secondary">
                    + Add
                  </span>
                </button>
              )}

              {giftNote.enabled && (
                <div className="mt-5 rounded-xl border border-secondary/30 bg-secondary/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 font-label-caps text-xs uppercase tracking-[0.14em] text-secondary">
                      <GiftIcon className="h-4 w-4" />
                      Gift Note
                    </p>
                    <button
                      type="button"
                      onClick={() => setGiftNote({ enabled: false })}
                      className="font-body-md text-xs text-on-surface-variant underline underline-offset-2 hover:text-error"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="mt-2 font-body-md text-sm italic leading-6 text-on-surface-variant">
                    “{giftNote.message.trim() || 'Your message will appear here…'}”
                  </p>
                  <textarea
                    value={giftNote.message}
                    onChange={(e) => setGiftNote({ message: e.target.value })}
                    maxLength={200}
                    rows={2}
                    placeholder="Write your gift message…"
                    className="mt-2 w-full resize-none rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-sm text-on-surface outline-none transition-colors focus:border-primary placeholder:text-on-surface-variant/50"
                  />
                </div>
              )}

              {/* Note accordion */}
              <div className="mt-5 rounded-xl border border-outline-variant/60 bg-surface-container-low">
                <button
                  type="button"
                  onClick={() => setNoteOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-3 font-body-md text-sm text-on-surface"
                >
                  <span>Add note</span>
                  <span
                    className={`text-on-surface-variant transition-transform ${
                      noteOpen ? 'rotate-180' : ''
                    }`}
                  >
                    ⌄
                  </span>
                </button>
                {noteOpen && (
                  <div className="px-4 pb-4">
                    <textarea
                      value={cartNote}
                      onChange={(e) => setCartNote(e.target.value)}
                      maxLength={300}
                      rows={3}
                      placeholder="Add a note for your order (optional)…"
                      className="w-full resize-none rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-sm text-on-surface outline-none transition-colors focus:border-primary placeholder:text-on-surface-variant/50"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-outline-variant/60 px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-body-md text-sm text-on-surface-variant">
                  Estimated total
                </span>
                <span className="font-headline-md text-lg font-semibold text-on-surface">
                  {formatPrice(subtotal, currency)}
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={close}
                className="gold-glow block w-full rounded bg-secondary py-4 text-center font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-secondary transition-colors hover:bg-secondary-fixed"
              >
                checkout
              </Link>
              <button
                type="button"
                onClick={close}
                className="mt-2 block w-full rounded border border-outline-variant py-3 text-center font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
