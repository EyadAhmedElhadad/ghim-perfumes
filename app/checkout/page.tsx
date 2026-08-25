'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart, selectSubtotal } from '@/store/cart';
import { formatPrice } from '@/lib/format';
import { getShippingPolicy } from '@/lib/format';
import { GOVERNORATES, GOVERNORATES_AR, isGovernorate } from '@/lib/governorates';
import type { OrderItem } from '@/lib/types';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

const inputClass =
  'w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 text-sm text-on-background outline-none transition-colors focus:border-secondary placeholder:text-on-surface-variant/50';

const labelClass =
  'mb-1.5 block text-xs font-medium uppercase tracking-wide text-on-surface-variant';

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const subtotal = useCart(selectSubtotal);
  const clear = useCart((s) => s.clear);
  const currency = items[0]?.currency ?? 'EGP';
  const policy = getShippingPolicy();

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    governorate: '',
    city: '',
    addressLine: '',
    postalCode: '',
    notes: '',
    paymentMethod: policy.paymentOptions[0] ?? 'Cash on Delivery',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<{ id: string; total: number } | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  if (placed) {
    return (
      <div className="min-h-screen bg-background text-on-background">
        <AnnouncementBar />
        <Header />
        <main className="mx-auto flex max-w-container-max flex-col items-center px-margin-mobile py-24 text-center md:px-margin-desktop">
          <p className="text-5xl">✅</p>
          <h1 className="mt-4 font-headline-lg text-secondary">Order confirmed</h1>
          <p className="mt-2 font-body-lg text-on-surface-variant">
            Thank you! Your order <span className="text-on-background">{placed.id}</span>{' '}
            has been placed.
          </p>
          <p className="mt-1 font-body-md text-on-surface-variant">
            Total paid: {formatPrice(placed.total, currency)}
          </p>
          <Link
            href="/products"
            className="gold-glow mt-8 rounded bg-secondary px-8 py-3 font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-secondary transition-colors hover:bg-secondary-fixed"
          >
            Continue Shopping
          </Link>
        </main>
        <Footer />
        <CartDrawer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background text-on-background">
        <AnnouncementBar />
        <Header />
        <main className="mx-auto flex max-w-container-max flex-col items-center px-margin-mobile py-24 text-center md:px-margin-desktop">
          <p className="text-5xl">🛍️</p>
          <h1 className="mt-4 font-headline-lg text-on-background">Your bag is empty</h1>
          <Link
            href="/products"
            className="gold-glow mt-8 rounded bg-secondary px-8 py-3 font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-secondary transition-colors hover:bg-secondary-fixed"
          >
            Shop the Collection
          </Link>
        </main>
        <Footer />
        <CartDrawer />
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.governorate || !isGovernorate(form.governorate)) {
      setError('Please select your governorate to continue.');
      return;
    }
    if (!form.fullName.trim() || !form.phone.trim() || !form.city.trim() || !form.addressLine.trim()) {
      setError('Please fill in all required delivery fields.');
      return;
    }

    setBusy(true);
    try {
      const orderItems: OrderItem[] = items.map((i) => ({
        id: i.id,
        slug: i.slug,
        name: i.name,
        price: i.price,
        qty: i.qty,
        size: i.size,
        image: i.image,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          address: {
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
            governorate: form.governorate,
            governorateAr: GOVERNORATES_AR[form.governorate as keyof typeof GOVERNORATES_AR],
            city: form.city.trim(),
            addressLine: form.addressLine.trim(),
            postalCode: form.postalCode.trim() || undefined,
            notes: form.notes.trim() || undefined,
          },
          subtotal,
          shipping: 0,
          total: subtotal,
          currency,
          paymentMethod: form.paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to place order');
      clear();
      setPlaced({ id: data.id, total: data.total });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <AnnouncementBar />
      <Header />
      <CartDrawer />

      <main className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
        <h1 className="mb-8 font-headline-lg text-on-background">Checkout</h1>

        <form onSubmit={submit} className="grid gap-8 lg:grid-cols-5">
          {/* Delivery details */}
          <section className="space-y-5 lg:col-span-3">
            <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-6">
              <h2 className="mb-5 font-headline-md text-lg font-semibold text-on-surface">
                Delivery details
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Full name *</label>
                  <input
                    className={inputClass}
                    value={form.fullName}
                    onChange={(e) => set('fullName', e.target.value)}
                    placeholder="e.g. Yasmin Khaled"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Phone *</label>
                  <input
                    className={inputClass}
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="e.g. 01001234567"
                    inputMode="tel"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Governorate *</label>
                  <select
                    className={inputClass}
                    value={form.governorate}
                    onChange={(e) => set('governorate', e.target.value)}
                  >
                    <option value="" disabled>
                      Select your governorate
                    </option>
                    {GOVERNORATES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>City *</label>
                  <input
                    className={inputClass}
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="e.g. Nasr City"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Address *</label>
                  <input
                    className={inputClass}
                    value={form.addressLine}
                    onChange={(e) => set('addressLine', e.target.value)}
                    placeholder="Street, building, apartment…"
                  />
                </div>

                <div>
                  <label className={labelClass}>Postal code</label>
                  <input
                    className={inputClass}
                    value={form.postalCode}
                    onChange={(e) => set('postalCode', e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Delivery notes</label>
                  <textarea
                    className={`${inputClass} min-h-20 resize-y`}
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-6">
              <h2 className="mb-5 font-headline-md text-lg font-semibold text-on-surface">
                Payment
              </h2>
              <label className={labelClass}>Payment method *</label>
              <select
                className={inputClass}
                value={form.paymentMethod}
                onChange={(e) => set('paymentMethod', e.target.value)}
              >
                {policy.paymentOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Summary */}
          <section className="lg:col-span-2">
            <div className="sticky top-6 space-y-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low p-6">
              <h2 className="font-headline-md text-lg font-semibold text-on-surface">
                Order summary
              </h2>

              <ul className="space-y-3">
                {items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3 text-sm">
                    <span className="text-on-surface-variant">
                      {i.name}{' '}
                      <span className="text-on-surface-variant/70">
                        × {i.qty}
                      </span>
                    </span>
                    <span className="font-medium text-on-background">
                      {formatPrice(i.price * i.qty, currency)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-outline-variant/20 pt-4">
                <div className="flex justify-between text-sm text-on-surface-variant">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal, currency)}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm text-on-surface-variant">
                  <span>Shipping</span>
                  <span>{formatPrice(0, currency)}</span>
                </div>
                <div className="mt-3 flex justify-between font-headline-md text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-secondary">
                    {formatPrice(subtotal, currency)}
                  </span>
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-error/40 bg-error-container/40 px-3 py-2 text-sm text-on-error-container">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="gold-glow w-full rounded bg-secondary py-3.5 font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-secondary transition-colors hover:bg-secondary-fixed disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Placing order…' : 'Place order'}
              </button>
              <p className="text-center text-xs text-on-surface-variant">
                Taxes and shipping calculated at checkout. 2 perfumes = 15% off
                + free shipping.
              </p>
            </div>
          </section>
        </form>
      </main>

      <Footer />
    </div>
  );
}
