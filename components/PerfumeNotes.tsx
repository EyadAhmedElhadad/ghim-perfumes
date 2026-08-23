import { NOTES_PYRAMID_IMAGE } from '@/lib/mock-data';
import type { Product } from '@/lib/types';

type Props = { product: Product };

export default function PerfumeNotes({ product }: Props) {
  const groups = [
    { label: 'Top Notes', items: product.notes.top },
    { label: 'Heart Notes', items: product.notes.middle },
    { label: 'Base Notes', items: product.notes.base },
  ];

  return (
    <section className="mx-auto max-w-container-max px-margin-mobile py-14 md:px-margin-desktop">
      <div className="text-center">
        <h2 className="font-headline-lg text-on-background">Perfume Notes</h2>
        <p className="mt-2 font-body-md text-sm text-on-surface-variant">
          The scent pyramid behind {product.name}
        </p>
      </div>

      {/* Single wide image */}
      <div className="mt-8 overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-low">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={NOTES_PYRAMID_IMAGE.src}
          alt={NOTES_PYRAMID_IMAGE.alt}
          loading="lazy"
          className="h-40 w-full object-cover opacity-80 sm:h-56"
        />
      </div>

      {/* Pyramid graphic */}
      <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center">
        <div className="w-full rounded-t-3xl border border-secondary/30 bg-secondary/10 px-6 py-6 text-center">
          <p className="font-label-caps text-[11px] uppercase tracking-[0.18em] gold-text">
            Top Notes
          </p>
          <p className="mt-1.5 font-display-lg text-lg">
            {groups[0].items.join(' · ')}
          </p>
        </div>
        <div className="w-[86%] rounded-t-2xl border border-secondary/25 bg-secondary/15 px-6 py-5 text-center">
          <p className="font-label-caps text-[11px] uppercase tracking-[0.18em] gold-text">
            Heart Notes
          </p>
          <p className="mt-1.5 font-display-lg text-lg">
            {groups[1].items.join(' · ')}
          </p>
        </div>
        <div className="w-[70%] rounded-t-xl border border-secondary/20 bg-secondary/20 px-6 py-4 text-center">
          <p className="font-label-caps text-[11px] uppercase tracking-[0.18em] gold-text">
            Base Notes
          </p>
          <p className="mt-1.5 font-display-lg text-lg">
            {groups[2].items.join(' · ')}
          </p>
        </div>
      </div>
    </section>
  );
}