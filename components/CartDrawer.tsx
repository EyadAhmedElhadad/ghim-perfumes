'use client';

import { useCart, selectCount, selectSubtotal } from '@/store/cart';
import { formatPrice } from '@/lib/format';
import ProductImage from '@/components/ProductImage';
import { CloseIcon, GiftIcon, MinusIcon, PlusIcon } from './icons';
import Link from 'next/link';

export default function CartDrawer() {
  const items = useCart((s) => s.items);
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const giftNote = useCart((s) => s.giftNote);
  const setGiftNote = useCart((s) => s.setGiftNote);
  const count = useCart(selectCount);
  const subtotal = useCart(selectSubtotal);
  const currency = items[0]?.currency ?? 'EGP';

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
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
          <h2 className="font-headline-md text-on-background">
            Your Bag{' '}
            <span className="font-body-md text-sm font-normal text-on-surface-variant">
              ({count})
            </span>
          </h2>
          <button
            onClick={close}
            aria-label="Close bag"
            className="text-on-surface-variant hover:text-secondary"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="font-headline-lg">Your bag is empty.</p>
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
            <div className="hide-scrollbar flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest">
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-body-md text-sm font-semibold text-on-background">
                            {item.name}
                          </p>
                          <p className="font-body-md text-xs text-on-surface-variant">
                            {item.size}
                          </p>
                        </div>
                        <button
                          onClick={() => remove(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="font-body-md text-xs text-on-surface-variant underline underline-offset-2 hover:text-error"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-outline-variant/40 bg-surface-container-lowest">
                          <button
                            onClick={() => setQty(item.id, item.qty - 1)}
                            aria-label="Decrease quantity"
                            className="p-1.5 text-on-background hover:text-secondary"
                          >
                            <MinusIcon className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-7 text-center font-body-md text-sm">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => setQty(item.id, item.qty + 1)}
                            aria-label="Increase quantity"
                            className="p-1.5 text-on-background hover:text-secondary"
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

              {giftNote.enabled && (
                <div className="mt-5 rounded-lg border border-secondary/30 bg-secondary/10 p-4">
                  <p className="flex items-center gap-2 font-label-caps text-xs uppercase tracking-[0.14em] text-secondary">
                    <GiftIcon className="h-4 w-4" />
                    Gift Note
                  </p>
                  <p className="mt-2 font-body-md text-sm italic leading-6 text-on-surface-variant">
                    “{giftNote.message.trim() || 'Your message will appear here…'}”
                  </p>
                  <textarea
                    value={giftNote.message}
                    onChange={(e) => setGiftNote({ message: e.target.value })}
                    maxLength={200}
                    rows={2}
                    placeholder="Write your gift message…"
                    className="mt-2 w-full resize-none rounded border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 font-body-md text-sm text-on-background outline-none focus:border-secondary"
                  />
                </div>
              )}
            </div>

            <div className="border-t border-outline-variant/20 px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-body-md text-sm text-on-surface-variant">
                  Subtotal
                </span>
                <span className="font-headline-md font-semibold">
                  {formatPrice(subtotal, currency)}
                </span>
              </div>
              <p className="mb-3 text-center font-body-md text-[11px] text-on-surface-variant">
                Taxes and shipping calculated at checkout. 2 perfumes = 30% off
                + free shipping.
              </p>
              <Link
                href="/checkout"
                onClick={close}
                className="gold-glow block w-full rounded bg-secondary py-4 text-center font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-secondary transition-colors hover:bg-secondary-fixed"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}