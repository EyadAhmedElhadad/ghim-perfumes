'use client';

import * as React from 'react';
import Link from 'next/link';
import type { AdminProduct } from '@/lib/types';
import {
  Panel,
  Field,
  Input,
  Textarea,
  Button,
  Spinner,
  useToast,
} from '@/components/admin/ui';

type HomepageContent = {
  heroHeadline: string;
  heroSubheadline: string;
  heroBackgroundUrl: string;
  heroCtaText: string;
  heroCtaUrl: string;
  announcementText: string;
  featuredProductIds: string[];
};

export default function HomepageEditor() {
  const { toast } = useToast();
  const [home, setHome] = React.useState<HomepageContent | null>(null);
  const [products, setProducts] = React.useState<AdminProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<null | string>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const [hRes, pRes] = await Promise.all([
          fetch('/api/admin/homepage', { cache: 'no-store' }),
          fetch('/api/admin/products?limit=50', { cache: 'no-store' }),
        ]);
        const hData = await hRes.json();
        const pData = await pRes.json();
        if (hData.content) setHome(hData.content);
        if (pData.items) setProducts(pData.items);
      } catch {
        toast('Failed to load homepage content', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  function patch(p: Partial<HomepageContent>) {
    setHome((prev) => (prev ? { ...prev, ...p } : prev));
  }

  async function save(section: string, body: Partial<HomepageContent>) {
    if (!home) return;
    setSaving(section);
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.content)
        throw new Error(data.error || 'Failed to save');
      setHome(data.content);
      toast(`${section} saved`, 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save', 'error');
    } finally {
      setSaving(null);
    }
  }

  async function uploadHero(file: File) {
    setSaving('hero');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('productId', 'homepage-hero');
      const up = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const upData = await up.json();
      if (!up.ok || !upData.url)
        throw new Error(upData?.error || 'Upload failed');
      patch({ heroBackgroundUrl: upData.url });
      toast('Image uploaded — save to apply', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'error');
    } finally {
      setSaving(null);
    }
  }

  if (loading || !home) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-primary" />
      </div>
    );
  }

  const featured = home.featuredProductIds;
  const productById = (id: string) =>
    products.find((p) => p.id === id || p.slug === id);

  function move(idx: number, dir: -1 | 1) {
    const next = [...featured];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    patch({ featuredProductIds: next });
  }
  function remove(idx: number) {
    patch({ featuredProductIds: featured.filter((_, i) => i !== idx) });
  }
  function add(id: string) {
    if (!id || featured.includes(id)) return;
    patch({ featuredProductIds: [...featured, id] });
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Panel
        title="Hero section"
        action={
          <Button
            onClick={() => save('Hero', { heroBackgroundUrl: home.heroBackgroundUrl })}
            disabled={saving === 'hero'}
          >
            {saving === 'hero' ? <Spinner /> : null}
            Save hero
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Headline (line 1)">
            <Input
              value={home.heroHeadline}
              onChange={(e) => patch({ heroHeadline: e.target.value })}
            />
          </Field>
          <Field label="Headline (line 2, gold italic)">
            <Input
              value={home.heroSubheadline}
              onChange={(e) => patch({ heroSubheadline: e.target.value })}
            />
          </Field>
          <Field label="CTA button text">
            <Input
              value={home.heroCtaText}
              onChange={(e) => patch({ heroCtaText: e.target.value })}
            />
          </Field>
          <Field label="CTA button link" hint="e.g. /products or https://...">
            <Input
              value={home.heroCtaUrl}
              onChange={(e) => patch({ heroCtaUrl: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-4 rounded-xl border border-outline-variant/40 bg-surface-container p-4">
          <p className="mb-2 text-sm font-medium text-on-surface">
            Background image
          </p>
          <div className="relative mb-3 aspect-[16/7] w-full overflow-hidden rounded-lg bg-surface-container-high">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={home.heroBackgroundUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <label className="mb-2 block">
            <span className="sr-only">Upload hero background</span>
            <input
              type="file"
              accept="image/*"
              disabled={saving === 'hero'}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadHero(f);
                e.target.value = '';
              }}
              className="block w-full text-xs text-on-surface-variant file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-on-primary"
            />
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem(
                'url',
              ) as HTMLInputElement;
              const v = input.value.trim();
              if (v) {
                patch({ heroBackgroundUrl: v });
                toast('URL set — save to apply', 'success');
              }
            }}
            className="flex gap-2"
          >
            <Input name="url" placeholder="Or paste image URL" defaultValue={home.heroBackgroundUrl} />
            <Button type="submit" variant="secondary" disabled={saving === 'hero'}>
              Set
            </Button>
          </form>
        </div>
      </Panel>

      {/* Announcement */}
      <Panel
        title="Announcement bar"
        action={
          <Button
            onClick={() => save('Announcement', { announcementText: home.announcementText })}
            disabled={saving === 'announcement'}
          >
            {saving === 'announcement' ? <Spinner /> : null}
            Save
          </Button>
        }
      >
        <Field label="Scrolling banner message">
          <Textarea
            value={home.announcementText}
            onChange={(e) => patch({ announcementText: e.target.value })}
          />
        </Field>
      </Panel>

      {/* Best Sellers */}
      <Panel
        title="Best Sellers carousel"
        action={
          <Button
            onClick={() => save('Best Sellers', { featuredProductIds: home.featuredProductIds })}
            disabled={saving === 'bestsellers'}
          >
            {saving === 'bestsellers' ? <Spinner /> : null}
            Save order
          </Button>
        }
      >
        <p className="mb-3 text-sm text-on-surface-variant">
          Choose which products appear and drag/use the arrows to set the order.
          Leave empty to show all products (default).
        </p>

        <ul className="mb-4 space-y-2">
          {featured.length === 0 ? (
            <li className="rounded-lg border border-dashed border-outline-variant/50 py-6 text-center text-sm text-on-surface-variant">
              No featured products — the carousel currently shows all products.
            </li>
          ) : (
            featured.map((id, idx) => {
              const p = productById(id);
              return (
                <li
                  key={id}
                  className="flex items-center gap-3 rounded-lg border border-outline-variant/40 bg-surface-container p-3"
                >
                  <span className="w-6 text-center text-sm text-on-surface-variant">
                    {idx + 1}
                  </span>
                  {p?.images?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images[0].url}
                      alt=""
                      className="size-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="size-10 rounded-lg bg-surface-container-high" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-on-surface">
                    {p?.name ?? id}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      aria-label="Move up"
                    >
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => move(idx, 1)}
                      disabled={idx === featured.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => remove(idx)}
                      aria-label="Remove"
                    >
                      ✕
                    </Button>
                  </div>
                </li>
              );
            })
          )}
        </ul>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const sel = e.currentTarget.elements.namedItem(
              'add',
            ) as HTMLSelectElement;
            add(sel.value);
            sel.value = '';
          }}
          className="flex gap-2"
        >
          <select
            name="add"
            defaultValue=""
            className="min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface"
          >
            <option value="" disabled>
              Add a product to feature…
            </option>
            {products
              .filter((p) => !featured.includes(p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
          <Button type="submit" variant="secondary">
            Add
          </Button>
        </form>
      </Panel>
    </div>
  );
}
