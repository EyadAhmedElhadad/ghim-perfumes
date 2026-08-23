'use client';

import { useState } from 'react';
import { useCart } from '@/store/cart';
import { getShippingPolicy } from '@/lib/format';
import type { Product } from '@/lib/types';
import {
  CheckIcon,
  ChevronDownIcon,
  GiftIcon,
  ShieldIcon,
  TruckIcon,
} from './icons';

type Props = { product: Product };

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-outline-variant/20">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="font-headline-md text-on-background">{title}</span>
        <ChevronDownIcon
          className={`h-5 w-5 text-on-surface-variant transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
        <CheckIcon className="h-3 w-3" strokeWidth={2.5} />
      </span>
      <p className="font-body-md text-sm leading-6 text-on-surface-variant">
        <span className="font-semibold text-on-background">{label}:</span>{' '}
        {value}
      </p>
    </li>
  );
}

export default function ProductAccordions({ product }: Props) {
  const policy = getShippingPolicy();
  const giftNote = useCart((s) => s.giftNote);
  const setGiftNote = useCart((s) => s.setGiftNote);

  return (
    <div className="border-t border-outline-variant/20">
      <Section title="Why You'll Love It">
        <p className="mb-5 font-body-md text-sm leading-7 text-on-surface-variant">
          {product.description}
        </p>
        <ul className="space-y-3">
          <ChecklistItem label="Vibe" value={product.vibe} />
          <ChecklistItem label="Concentration" value={product.concentration} />
          <ChecklistItem label="Performance" value={product.performance} />
          <ChecklistItem label="Best For" value={product.bestFor} />
        </ul>
      </Section>

      <Section title="Shipping & Delivery">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <TruckIcon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
            <div>
              <p className="font-body-md text-sm font-semibold text-on-background">
                Bundle Offer
              </p>
              <p className="mt-0.5 font-body-md text-sm leading-6 text-on-surface-variant">
                {policy.bundleOffer}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
            <div>
              <p className="font-body-md text-sm font-semibold text-on-background">
                Delivery &amp; Payment
              </p>
              <p className="mt-0.5 font-body-md text-sm leading-6 text-on-surface-variant">
                {policy.deliveryTime} We accept{' '}
                {policy.paymentOptions.join(', ')}.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
            <div>
              <p className="font-body-md text-sm font-semibold text-on-background">
                Damage Guarantee
              </p>
              <p className="mt-0.5 font-body-md text-sm leading-6 text-on-surface-variant">
                {policy.damageGuarantee}
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Make it a Gift">
        <div className="flex items-start gap-3">
          <GiftIcon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
          <div className="flex-1">
            <p className="font-body-md text-sm leading-6 text-on-surface-variant">
              Add a handwritten gift note and we'll tuck it inside the box for
              free.
            </p>
            <label className="mt-4 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={giftNote.enabled}
                onChange={(e) => setGiftNote({ enabled: e.target.checked })}
                className="h-4 w-4 accent-secondary"
              />
              <span className="font-body-md text-sm font-medium text-on-background">
                Add a gift note
              </span>
            </label>
            {giftNote.enabled && (
              <textarea
                value={giftNote.message}
                onChange={(e) => setGiftNote({ message: e.target.value })}
                placeholder="Write your message…"
                maxLength={200}
                rows={3}
                className="mt-3 w-full resize-none rounded border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 font-body-md text-sm text-on-background outline-none transition-colors focus:border-secondary"
              />
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}