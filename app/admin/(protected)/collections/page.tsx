'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { AdminProduct } from '@/lib/types';
import { BRAND } from '@/lib/mock-data';
import { Select, Spinner, StatusBadge, useToast } from '@/components/admin/ui';

const COLLECTIONS = [
  { id: 'all', label: 'Shop All' },
  { id: 'her', label: 'For Her' },
  { id: 'him', label: 'For Him' },
] as const;

type Category = 'her' | 'him' | 'unisex';

export default function CollectionsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Collection card hero images ("For Her" / "For Him" homepage cards)
  const [coll, setColl] = useState<{ her: string; him: string }>({
    her: BRAND.herImage,
    him: BRAND.himImage,
  });
  const [saving, setSaving] = useState<'her' | 'him' | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/collections', { cache: 'no-store' });
        const data = await res.json();
        if (data.images) setColl(data.images);
      } catch {
        toast('Failed to load collection images', 'error');
      }
    })();
  }, []);

  async function setImage(key: 'her' | 'him', imageUrl: string) {
    setSaving(key);
    try {
      const res = await fetch('/api/admin/collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setColl(data.images);
      toast('Collection image updated', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save', 'error');
    } finally {
      setSaving(null);
    }
  }

  async function onFile(key: 'her' | 'him', file: File) {
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('productId', 'collections');
      const up = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const upData = await up.json();
      if (!up.ok || !upData.url) {
        throw new Error(upData?.error || 'Upload failed');
      }
      await setImage(key, upData.url);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'error');
      setSaving(null);
    }
  }

  async function load() {
    try {
      const res = await fetch('/api/admin/products?limit=50', {
        cache: 'no-store',
      });
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      toast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function moveTo(p: AdminProduct, category: Category) {
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      if (!res.ok) throw new Error('Failed');
      toast(`${p.name} moved to ${category}`);
      setItems((list) =>
        list.map((x) => (x.id === p.id ? { ...x, category } : x)),
      );
    } catch {
      toast('Failed to move product', 'error');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5">
          <header className="mb-4">
            <h2 className="font-headline-md text-lg font-semibold">
              Collection Card Images
            </h2>
            <p className="text-sm text-on-surface-variant">
              Homepage hero images for the &ldquo;For Her&rdquo; / &ldquo;For
              Him&rdquo; cards.
            </p>
          </header>
          <div className="grid gap-4 sm:grid-cols-2">
            {(['her', 'him'] as const).map((key) => (
              <div
                key={key}
                className="rounded-xl border border-outline-variant/40 bg-surface-container p-4"
              >
                <p className="mb-2 text-sm font-medium capitalize text-on-surface">
                  {key === 'her' ? 'For Her' : 'For Him'}
                </p>
                <div className="relative mb-3 aspect-[4/5] w-full overflow-hidden rounded-lg bg-surface-container-high">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coll?.[key] ?? ''}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <label className="mb-2 block">
                  <span className="sr-only">Upload {key} image</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={saving === key}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onFile(key, f);
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
                    if (v) setImage(key, v);
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="url"
                    placeholder="Or paste image URL"
                    defaultValue={coll?.[key] ?? ''}
                    className="min-w-0 flex-1 rounded-md border border-outline-variant/60 bg-surface-container-high px-2 py-1.5 text-xs text-on-surface"
                  />
                  <button
                    type="submit"
                    disabled={saving === key}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-on-primary disabled:opacity-60"
                  >
                    {saving === key ? 'Saving…' : 'Save'}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      {COLLECTIONS.map((col) => {
        const group = items.filter((p) =>
          col.id === 'all' ? true : p.category === col.id,
        );
        return (
          <section
            key={col.id}
            className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5"
          >
            <header className="mb-4 flex items-center justify-between">
              <h2 className="font-headline-md text-lg font-semibold">
                {col.label}
                <span className="ml-2 text-sm font-normal text-on-surface-variant">
                  {group.length}
                </span>
              </h2>
              <Link
                href={`/#collection-${col.id === 'all' ? 'all' : col.id}`}
                className="text-sm text-primary hover:underline"
              >
                View on store
              </Link>
            </header>
            {group.length === 0 ? (
              <p className="py-6 text-center text-sm text-on-surface-variant">
                No products here yet.
              </p>
            ) : (
              <ul className="divide-y divide-outline-variant/40">
                {group.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-3 py-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {p.images[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images[0].url}
                          alt=""
                          className="size-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="size-10 rounded-lg bg-surface-container-high" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-on-surface">
                          {p.name}
                        </p>
                        <p className="text-xs text-on-surface-variant capitalize">
                          {p.category}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={p.stockStatus} />
                    <Select
                      value={p.category}
                      disabled={busyId === p.id}
                      onChange={(e) =>
                        moveTo(p, e.target.value as Category)
                      }
                      className="w-36 py-1.5 text-xs"
                    >
                      <option value="her">For Her</option>
                      <option value="him">For Him</option>
                      <option value="unisex">Unisex</option>
                    </Select>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}