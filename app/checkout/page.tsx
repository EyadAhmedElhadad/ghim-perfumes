'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart, selectSubtotal, selectCount } from '@/store/cart';
import { formatPrice } from '@/lib/format';
import { GOVERNORATES, GOVERNORATES_AR, isGovernorate } from '@/lib/governorates';
import type { OrderItem } from '@/lib/types';
import { whatsappLink, formatOrderMessage, WHATSAPP_NUMBER } from '@/lib/contact';
import CartDrawer from '@/components/CartDrawer';
import ProductImage from '@/components/ProductImage';
import { BagIcon, InfoIcon, LockIcon, TruckIcon } from '@/components/icons';

const inputClass =
  'w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-colors focus:border-primary';

const labelClass =
  'mb-1.5 block text-xs font-medium uppercase tracking-wide text-on-surface-variant';

const paymentMethod = 'Cash on Delivery';

function BrandHeader() {
  const open = useCart((s) => s.open);
  const count = useCart(selectCount);
  return (
    <header className="border-b border-outline-variant/60 bg-surface">
      <div className="mx-auto flex max-w-container-max items-center justify-between px-margin-mobile py-4 md:px-margin-desktop">
        <Link href="/" className="font-headline-md text-2xl text-secondary">
          GHIM
        </Link>
        <button
          type="button"
          onClick={open}
          aria-label="Open cart"
          className="rounded-full p-2 text-on-surface transition-colors hover:bg-surface-container-high"
        >
          <BagIcon className="h-6 w-6" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-semibold text-on-secondary">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

type FormState = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  addressLine: string;
  apartment: string;
  city: string;
  governorate: string;
  postalCode: string;
  notes: string;
  saveInfo: boolean;
  emailOffers: boolean;
};

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const subtotal = useCart(selectSubtotal);
  const clear = useCart((s) => s.clear);
  const cartNoteInitial = useCart((s) => s.cartNote);
  const currency = items[0]?.currency ?? 'EGP';

  const [form, setForm] = useState<FormState>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    country: 'Egypt',
    addressLine: '',
    apartment: '',
    city: '',
    governorate: '',
    postalCode: '',
    notes: cartNoteInitial,
    saveInfo: false,
    emailOffers: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountMsg, setDiscountMsg] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{
    id: string;
    total: number;
    whatsappUrl?: string;
  } | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    if (placed?.whatsappUrl) {
      window.open(placed.whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  }, [placed?.whatsappUrl]);

  if (placed) {
    return (
      <div className="min-h-screen bg-surface text-on-surface">
        <BrandHeader />
        <main className="mx-auto flex max-w-container-max flex-col items-center px-margin-mobile py-24 text-center md:px-margin-desktop">
          <p className="text-5xl">✅</p>
          <h1 className="mt-4 font-headline-lg text-on-surface">Order confirmed</h1>
          <p className="mt-2 font-body-lg text-on-surface-variant">
            Thank you! Your order <span className="text-on-surface">{placed.id}</span> has
            been placed.
          </p>
          <p className="mt-1 font-body-md text-on-surface-variant">
            Total due on delivery: {formatPrice(placed.total, currency)}
          </p>
          <p className="mt-3 max-w-md font-body-md text-on-surface-variant">
            We&apos;ll contact you to confirm the delivery details.
          </p>

          {placed.whatsappUrl ? (
            <a
              href={placed.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="gold-glow mt-6 rounded bg-secondary px-8 py-3 font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-secondary transition-colors hover:bg-secondary-fixed"
            >
              Open WhatsApp order message
            </a>
          ) : (
            <p className="mt-6 rounded-lg border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
              WhatsApp number is not configured yet. Please set
              <code className="mx-1 rounded bg-surface-container-high px-1.5 py-0.5 text-xs">
                NEXT_PUBLIC_WHATSAPP_NUMBER
              </code>
              to enable the handoff.
            </p>
          )}

          <Link
            href="/products"
            className="gold-glow mt-8 rounded bg-secondary px-8 py-3 font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-secondary transition-colors hover:bg-secondary-fixed"
          >
            Continue Shopping
          </Link>
        </main>
        <CartDrawer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-surface text-on-surface">
        <BrandHeader />
        <main className="mx-auto flex max-w-container-max flex-col items-center px-margin-mobile py-24 text-center md:px-margin-desktop">
          <p className="text-5xl">🛍️</p>
          <h1 className="mt-4 font-headline-lg text-on-surface">Your bag is empty</h1>
          <Link
            href="/products"
            className="gold-glow mt-8 rounded bg-secondary px-8 py-3 font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-secondary transition-colors hover:bg-secondary-fixed"
          >
            Shop the Collection
          </Link>
        </main>
        <CartDrawer />
      </div>
    );
  }

  function applyDiscount() {
    if (!discountCode.trim()) {
      setDiscountMsg('Enter a code to apply.');
      return;
    }
    setDiscountMsg('Discount codes are not active for this store yet.');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return setError('Please enter a valid email address.');
    }
    if (!form.firstName.trim()) return setError('Please enter your first name.');
    if (!form.lastName.trim()) return setError('Please enter your last name.');
    if (!form.phone.trim()) return setError('Please enter your phone number.');
    if (!form.governorate || !isGovernorate(form.governorate)) {
      return setError('Please select your governorate to continue.');
    }
    if (!form.addressLine.trim()) return setError('Please enter your detailed address.');

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

      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

      const payload = {
        items: orderItems,
        address: {
          fullName,
          email: form.email.trim() || undefined,
          phone: form.phone.trim(),
          country: form.country,
          governorate: form.governorate,
          governorateAr: GOVERNORATES_AR[form.governorate as keyof typeof GOVERNORATES_AR],
          addressLine: form.addressLine.trim(),
          detailedAddress:
            [form.apartment.trim(), form.city.trim()].filter(Boolean).join(', ') ||
            undefined,
          postalCode: form.postalCode.trim() || undefined,
          notes: form.notes.trim() || undefined,
        },
        subtotal,
        shipping: 0,
        total: subtotal,
        currency,
        paymentMethod,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to place order');

      const message = formatOrderMessage({
        id: data.id,
        customerName: fullName,
        phone: form.phone.trim(),
        governorate: form.governorate,
        addressLine: `${form.addressLine.trim()}${
          form.apartment.trim() ? `, ${form.apartment.trim()}` : ''
        }${form.city.trim() ? `, ${form.city.trim()}` : ''}`,
        items: orderItems,
        subtotal,
        currency,
      });

      clear();
      setPlaced({
        id: data.id,
        total: data.total,
        whatsappUrl: WHATSAPP_NUMBER ? whatsappLink(message) : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <BrandHeader />
      <CartDrawer />

      <main className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop">
        <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          {/* Left column — form fields */}
          <section className="space-y-10">
            {/* Contact */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-headline-md text-lg font-semibold text-on-surface">
                  Contact
                </h2>
                <button
                  type="button"
                  className="font-body-md text-sm text-secondary hover:underline"
                >
                  Sign in
                </button>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <label className={labelClass} htmlFor="email">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="e.g. yasmin@example.com"
                  />
                </div>
                <label className="flex items-center gap-2 font-body-md text-sm text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={form.emailOffers}
                    onChange={(e) => set('emailOffers', e.target.checked)}
                    className="h-4 w-4 rounded border-outline-variant text-secondary focus:ring-secondary"
                  />
                  Email me with news and offers
                </label>
              </div>
            </div>

            {/* Delivery */}
            <div className="border-t border-outline-variant/60 pt-8">
              <h2 className="font-headline-md text-lg font-semibold text-on-surface">
                Delivery
              </h2>
              <div className="mt-4 grid gap-4">
                <div>
                  <label className={labelClass} htmlFor="country">
                    Country/Region
                  </label>
                  <select
                    id="country"
                    className={inputClass}
                    value={form.country}
                    onChange={(e) => set('country', e.target.value)}
                  >
                    <option value="Egypt">Egypt</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="firstName">
                      First name *
                    </label>
                    <input
                      id="firstName"
                      className={inputClass}
                      value={form.firstName}
                      onChange={(e) => set('firstName', e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="lastName">
                      Last name *
                    </label>
                    <input
                      id="lastName"
                      className={inputClass}
                      value={form.lastName}
                      onChange={(e) => set('lastName', e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="addressLine">
                    Address *
                  </label>
                  <input
                    id="addressLine"
                    className={inputClass}
                    value={form.addressLine}
                    onChange={(e) => set('addressLine', e.target.value)}
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="apartment">
                    Apartment, suite, etc. (optional)
                  </label>
                  <input
                    id="apartment"
                    className={inputClass}
                    value={form.apartment}
                    onChange={(e) => set('apartment', e.target.value)}
                    placeholder="Apartment, suite, floor, landmark…"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <label className={labelClass} htmlFor="city">
                      City
                    </label>
                    <input
                      id="city"
                      className={inputClass}
                      value={form.city}
                      onChange={(e) => set('city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className={labelClass} htmlFor="governorate">
                      Governorate *
                    </label>
                    <select
                      id="governorate"
                      className={inputClass}
                      value={form.governorate}
                      onChange={(e) => set('governorate', e.target.value)}
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {GOVERNORATES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <label className={labelClass} htmlFor="postalCode">
                      Postal code
                    </label>
                    <input
                      id="postalCode"
                      className={inputClass}
                      value={form.postalCode}
                      onChange={(e) => set('postalCode', e.target.value)}
                      placeholder="Postal code"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="phone">
                    Phone number *
                  </label>
                  <div className="relative">
                    <input
                      id="phone"
                      className={inputClass}
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      placeholder="e.g. 01001234567"
                      inputMode="tel"
                    />
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                      title="We'll use this to coordinate delivery."
                    >
                      <InfoIcon className="h-4 w-4" />
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-2 font-body-md text-sm text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={form.saveInfo}
                    onChange={(e) => set('saveInfo', e.target.checked)}
                    className="h-4 w-4 rounded border-outline-variant text-secondary focus:ring-secondary"
                  />
                  Save this information for next time
                </label>
              </div>
            </div>

            {/* Shipping method */}
            <div className="border-t border-outline-variant/60 pt-8">
              <h2 className="font-headline-md text-lg font-semibold text-on-surface">
                Shipping method
              </h2>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-secondary bg-secondary/5 p-4">
                <div className="flex items-center gap-3">
                  <TruckIcon className="h-5 w-5 text-secondary" />
                  <span className="font-body-md text-sm font-medium text-on-surface">
                    Default
                  </span>
                </div>
                <span className="font-body-md text-sm font-medium text-on-surface-variant">
                  Free
                </span>
              </div>
              <p className="mt-2 font-body-md text-xs text-on-surface-variant">
                Free shipping on every order. Cash on Delivery available.
              </p>
            </div>
          </section>

          {/* Right column — order summary */}
          <section>
            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-6 lg:sticky lg:top-6">
              <h2 className="mb-5 font-headline-md text-lg font-semibold text-on-surface">
                Order summary
              </h2>

              <ul className="space-y-4">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-container-lowest">
                      <ProductImage
                        src={i.image}
                        alt={i.name}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-semibold text-on-secondary">
                        {i.qty}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body-md text-sm font-medium text-on-surface">
                        {i.name}
                      </p>
                      <p className="font-body-md text-xs text-on-surface-variant">{i.size}</p>
                    </div>
                    <span className="font-body-md text-sm font-medium text-on-surface">
                      {formatPrice(i.price * i.qty, i.currency)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Discount code */}
              <div className="mt-5 flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-colors focus:border-primary"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Discount code"
                />
                <button
                  type="button"
                  onClick={applyDiscount}
                  className="rounded-lg border border-outline-variant px-4 py-2.5 font-body-md text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  Apply
                </button>
              </div>
              {discountMsg && (
                <p className="mt-2 font-body-md text-xs text-on-surface-variant">{discountMsg}</p>
              )}

              <div className="mt-5 space-y-2 border-t border-outline-variant/60 pt-4">
                <div className="flex justify-between font-body-md text-sm text-on-surface-variant">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal, currency)}</span>
                </div>
                <div className="flex items-center justify-between font-body-md text-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    Shipping
                    <span
                      className="text-on-surface-variant"
                      title="Free shipping on every order."
                    >
                      <InfoIcon className="h-3.5 w-3.5" />
                    </span>
                  </span>
                  <span>Free</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-outline-variant/60 pt-3 font-headline-md text-lg font-semibold text-on-surface">
                  <span>Total</span>
                  <span className="text-secondary">{formatPrice(subtotal, currency)}</span>
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-lg bg-error-container/60 px-3 py-2 text-sm text-on-error-container">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="gold-glow mt-4 w-full rounded bg-secondary py-3.5 font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-secondary transition-colors hover:bg-secondary-fixed disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Placing order…' : 'Place order'}
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-on-surface-variant">
                <LockIcon className="h-3.5 w-3.5" />
                Secured checkout · Pay with {paymentMethod} on delivery
              </p>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}
