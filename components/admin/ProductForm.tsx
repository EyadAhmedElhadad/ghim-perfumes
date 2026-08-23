'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminProduct, StockStatus, ProductMedia } from '@/lib/types';
import { uploadProductImage } from '@/lib/upload';
import { Button, Field, Input, Select, Textarea, useToast } from './ui';

function splitList(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const DEFAULT_STOCK: Record<StockStatus, number> = { in: 100, low: 5, out: 0 };

export default function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const { toast } = useToast();
  const editing = Boolean(product);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [uploadKey, setUploadKey] = useState(0);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const productId = product?.id || form.slug || 'new';
      const results = await Promise.all(
        Array.from(files).map((file) =>
          uploadProductImage(file, productId, (pct) =>
            setProgress((p) => ({ ...p, [file.name]: pct })),
          ).then((m) => ({ m, file })),
        ),
      );
      setForm((f) => {
        const start = f.images.length;
        const added: ProductMedia[] = results.map(({ m, file }, i) => ({
          url: m.url,
          path: m.path,
          alt: `${form.name || 'Product'} photo ${start + i + 1}`,
          order: start + i,
        }));
        return { ...f, images: [...f.images, ...added] };
      });
      toast(
        results.length === 1 ? 'Photo uploaded' : `${results.length} photos uploaded`,
      );
    } catch (err) {
      const code = (err as Error & { code?: string }).code;
      toast(
        code ? `Upload failed (${code})` : err instanceof Error ? err.message : 'Upload failed',
        'error',
      );
    } finally {
      setUploading(false);
      setProgress({});
      setUploadKey((k) => k + 1);
    }
  }

  const [form, setForm] = useState({
    name: product?.name ?? '',
    tagline: product?.tagline ?? '',
    description: product?.description ?? '',
    slug: product?.slug ?? '',
    category: product?.category ?? 'unisex',
    price: product?.price ?? 0,
    compareAtPrice: product?.compareAtPrice ?? null,
    currency: product?.currency ?? 'EGP',
    stock: product?.stock ?? 100,
    stockStatus: product?.stockStatus ?? 'in',
    concentration: product?.concentration ?? '',
    size: product?.size ?? '',
    tag: product?.tag ?? '',
    inspiredBy: product?.inspiredBy ?? '',
    inspiredByRetail: product?.inspiredByRetail ?? null,
    images: (product?.images ?? []) as ProductMedia[],
    notesTop: product?.notes.top.join(', ') ?? '',
    notesMiddle: product?.notes.middle.join(', ') ?? '',
    notesBase: product?.notes.base.join(', ') ?? '',
    vibe: product?.vibe ?? '',
    performance: product?.performance ?? '',
    bestFor: product?.bestFor ?? '',
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (uploading) {
      toast('Please wait for image uploads to finish', 'error');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        slug: form.slug || slugify(form.name),
        category: form.category,
        price: Number(form.price) || 0,
        compareAtPrice:
          form.compareAtPrice === null ? null : Number(form.compareAtPrice),
        currency: form.currency,
        stock: Number(form.stock) || 0,
        stockStatus: form.stockStatus,
        concentration: form.concentration,
        size: form.size,
        tag: form.tag,
        inspiredBy: form.inspiredBy || null,
        inspiredByRetail:
          form.inspiredByRetail === null ? null : Number(form.inspiredByRetail),
        images: form.images.map((m) => ({
          url: m.url,
          path: m.path ?? '',
          alt: m.alt || `${form.name} photo`,
          order: typeof m.order === 'number' ? m.order : 0,
        })),
        notes: {
          top: splitList(form.notesTop),
          middle: splitList(form.notesMiddle),
          base: splitList(form.notesBase),
        },
        vibe: form.vibe,
        performance: form.performance,
        bestFor: form.bestFor,
      };

      if (form.stockStatus !== 'in' && Number(form.stock) > 0) {
        payload.stock = DEFAULT_STOCK[form.stockStatus as StockStatus];
      }

      const res = editing
        ? await fetch(`/api/admin/products/${product!.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to save');
      }
      const saved = (await res.json().catch(() => ({}))) as { id?: string };
      toast(editing ? 'Product updated' : 'Product created');
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="space-y-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5 lg:col-span-2">
          <h2 className="font-headline-md text-lg font-semibold">Essentials</h2>
          <Field label="Name" hint="Slug auto-fills from the name">
            <Input
              required
              value={form.name}
              onChange={(e) =>
                set(
                  'name',
                  e.target.value,
                )
              }
              placeholder="Oud Noir"
            />
          </Field>
          <Field label="Slug">
            <Input
              value={form.slug}
              onChange={(e) => set('slug', slugify(e.target.value))}
              placeholder="oud-noir"
            />
          </Field>
          <Field label="Tagline">
            <Input
              value={form.tagline}
              onChange={(e) => set('tagline', e.target.value)}
              placeholder="Smells like a midnight walk in the desert."
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Long-form description shown on the product page."
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5">
          <h2 className="font-headline-md text-lg font-semibold">Pricing & stock</h2>
          <Field label="Collection">
            <Select
              value={form.category}
              onChange={(e) => set('category', e.target.value as typeof form.category)}
            >
              <option value="her">For Her</option>
              <option value="him">For Him</option>
              <option value="unisex">Unisex</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price">
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => set('price', Number(e.target.value))}
              />
            </Field>
            <Field label="Compare at">
              <Input
                type="number"
                min={0}
                value={form.compareAtPrice ?? ''}
                onChange={(e) => set('compareAtPrice', e.target.value === '' ? null : Number(e.target.value))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency">
              <Input
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
              />
            </Field>
            <Field label="Stock">
              <Input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => set('stock', Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Status">
            <Select
              value={form.stockStatus}
              onChange={(e) => set('stockStatus', e.target.value as StockStatus)}
            >
              <option value="in">In stock</option>
              <option value="low">Low</option>
              <option value="out">Out of stock</option>
            </Select>
          </Field>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="space-y-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5">
          <h2 className="font-headline-md text-lg font-semibold">Fragrance</h2>
          <Field label="Concentration">
            <Input
              value={form.concentration}
              onChange={(e) => set('concentration', e.target.value)}
              placeholder="Extrait de Parfum"
            />
          </Field>
          <Field label="Size">
            <Input
              value={form.size}
              onChange={(e) => set('size', e.target.value)}
              placeholder="50 ml / 1.7 FL.OZ."
            />
          </Field>
          <Field label="Vibe">
            <Input
              value={form.vibe}
              onChange={(e) => set('vibe', e.target.value)}
              placeholder="Warm, spicy, bold"
            />
          </Field>
          <Field label="Performance">
            <Input
              value={form.performance}
              onChange={(e) => set('performance', e.target.value)}
              placeholder="10+ hours on skin"
            />
          </Field>
          <Field label="Best for">
            <Input
              value={form.bestFor}
              onChange={(e) => set('bestFor', e.target.value)}
              placeholder="Evenings, cold weather"
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5">
          <h2 className="font-headline-md text-lg font-semibold">Inspiration</h2>
          <Field label="Inspired by">
            <Input
              value={form.inspiredBy}
              onChange={(e) => set('inspiredBy', e.target.value)}
              placeholder="Boujee Marshmallow 81"
            />
          </Field>
          <Field label="Retail price (original)">
            <Input
              type="number"
              min={0}
              value={form.inspiredByRetail ?? ''}
              onChange={(e) =>
                set('inspiredByRetail', e.target.value === '' ? null : Number(e.target.value))
              }
            />
          </Field>
          <Field label="Tag" hint="e.g. BESTSELLER, NEW">
            <Input
              value={form.tag}
              onChange={(e) => set('tag', e.target.value.toUpperCase())}
              placeholder="BESTSELLER"
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5">
          <h2 className="font-headline-md text-lg font-semibold">Notes</h2>
          <Field label="Top notes" hint="Comma-separated">
            <Input
              value={form.notesTop}
              onChange={(e) => set('notesTop', e.target.value)}
              placeholder="Candied Pear, Coconut"
            />
          </Field>
          <Field label="Middle notes" hint="Comma-separated">
            <Input
              value={form.notesMiddle}
              onChange={(e) => set('notesMiddle', e.target.value)}
              placeholder="Whipped Marshmallow, Cashmere"
            />
          </Field>
          <Field label="Base notes" hint="Comma-separated">
            <Input
              value={form.notesBase}
              onChange={(e) => set('notesBase', e.target.value)}
              placeholder="Amber, Musk, Sandalwood"
            />
          </Field>
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5">
        <h2 className="font-headline-md text-lg font-semibold">Images</h2>

        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 py-4 text-center">
            <input
              key={uploadKey}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files)}
              disabled={uploading}
            />
            <span className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary-fixed-dim">
              {uploading ? 'Uploading…' : '+ Upload photos'}
            </span>
            <span className="text-xs text-on-surface-variant">
              Drag &amp; drop or click. JPG, PNG, WEBP, GIF or AVIF · up to 5 MB
              each. Uploaded to Cloudinary
              (<code>ghm/products/{"{id}"}/…</code>).
            </span>
          </label>
        </div>

        {uploading && (
          <div className="space-y-2">
            {Object.entries(progress).map(([name, pct]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-32 truncate text-xs text-on-surface-variant">
                  {name}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs tabular-nums text-on-surface-variant">
                  {pct}%
                </span>
              </div>
            ))}
          </div>
        )}

        {form.images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.images.map((m, i) => (
              <div
                key={`${m.url}-${i}`}
                className="relative size-16 overflow-hidden rounded-lg border border-outline-variant"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt={m.alt}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      images: f.images.filter((_, idx) => idx !== i),
                    }))
                  }
                  aria-label="Remove image"
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 px-1.5 text-[10px] leading-4 text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={busy || uploading}>
          {busy ? 'Saving…' : uploading ? 'Uploading…' : editing ? 'Save changes' : 'Create product'}
        </Button>
      </div>
    </form>
  );
}