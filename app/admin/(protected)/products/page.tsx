'use client';

import * as React from 'react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { AdminProduct, StockStatus } from '@/lib/types';
import {
  Button,
  ConfirmDialog,
  Field,
  Input,
  Select,
  Spinner,
  StatusBadge,
  useToast,
} from '@/components/admin/ui';

type Category = 'all' | 'her' | 'him' | 'unisex';

const STOCK_MAP: Record<StockStatus, number> = { in: 100, low: 5, out: 0 };

type ListResponse = {
  items: AdminProduct[];
  nextCursor: string | null;
  prevCursor: string | null;
  total: number;
};

export default function ProductsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [stock, setStock] = useState<'all' | StockStatus>('all');
  const [sort, setSort] = useState<'date' | 'name' | 'price' | 'stock'>('date');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setCursor(undefined);
  }, [debouncedSearch, category, stock, sort, dir]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({
      search: debouncedSearch,
      category,
      stock,
      sort,
      dir,
      limit: '10',
    });
    if (cursor) params.set('cursor', cursor);
    try {
      const res = await fetch(`/api/admin/products?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to load');
      const data: ListResponse = await res.json();
      setItems(data.items);
      setTotal(data.total);
      setNextCursor(data.nextCursor);
      setPrevCursor(data.prevCursor);
    } catch {
      toast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, stock, sort, dir, cursor, reloadKey]);

  async function changeStatus(p: AdminProduct, status: StockStatus) {
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: STOCK_MAP[status], stockStatus: status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast(`${p.name} → ${status}`);
      setReloadKey((k) => k + 1);
    } catch {
      toast('Failed to update stock', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      setReloadKey((k) => k + 1);
    } catch {
      toast('Failed to delete product', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-on-surface-variant">
          {loading ? 'Loading…' : `${total} product${total === 1 ? '' : 's'}`}
        </p>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary-fixed-dim"
        >
          + Add product
        </Link>
      </div>

      <div className="grid gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Search">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, notes, inspired by…"
          />
        </Field>
        <Field label="Collection">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            <option value="all">All</option>
            <option value="her">For Her</option>
            <option value="him">For Him</option>
            <option value="unisex">Unisex</option>
          </Select>
        </Field>
        <Field label="Stock">
          <Select
            value={stock}
            onChange={(e) => setStock(e.target.value as 'all' | StockStatus)}
          >
            <option value="all">All</option>
            <option value="in">In stock</option>
            <option value="low">Low</option>
            <option value="out">Out of stock</option>
          </Select>
        </Field>
        <Field label="Sort">
          <div className="flex gap-2">
            <Select
              value={sort}
              onChange={(e) =>
                setSort(e.target.value as 'date' | 'name' | 'price' | 'stock')
              }
            >
              <option value="date">Updated</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="stock">Stock</option>
            </Select>
            <Button
              variant="secondary"
              onClick={() => setDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              title="Toggle order"
            >
              {dir === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </Field>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-outline-variant/60 bg-surface-container-low">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-outline-variant/40 text-xs tracking-wide text-on-surface-variant uppercase">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Collection</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-surface-container-high/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="flex items-center gap-3"
                  >
                    {p.images[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0].url}
                        alt=""
                        className="size-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="size-10 shrink-0 rounded-lg bg-surface-container-high" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-on-surface hover:text-primary">
                        {p.name}
                      </p>
                      <p className="truncate text-xs text-on-surface-variant">
                        {p.tagline}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize text-on-surface-variant">
                  {p.category === 'her' ? 'For Her' : p.category === 'him' ? 'For Him' : 'Unisex'}
                </td>
                <td className="px-4 py-3 text-secondary">
                  {p.price.toLocaleString()} {p.currency}
                </td>
                <td className="px-4 py-3 text-on-surface-variant">{p.stock}</td>
                <td className="px-4 py-3">
                  <Select
                    value={p.stockStatus}
                    disabled={busyId === p.id}
                    onChange={(e) =>
                      changeStatus(p, e.target.value as StockStatus)
                    }
                    className="w-32 py-1.5 text-xs"
                  >
                    <option value="in">In stock</option>
                    <option value="low">Low</option>
                    <option value="out">Out</option>
                  </Select>
                  <span className="mt-1 inline-block">
                    <StatusBadge status={p.stockStatus} />
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="rounded-lg border border-error/40 px-3 py-1.5 text-xs text-error transition-colors hover:bg-error-container/40"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && items.length === 0 && (
          <p className="py-12 text-center text-sm text-on-surface-variant">
            No products match your filters.
          </p>
        )}
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner className="text-primary" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          disabled={!prevCursor}
          onClick={() => setCursor(prevCursor ?? undefined)}
        >
          ← Previous
        </Button>
        <Button
          variant="secondary"
          disabled={!nextCursor}
          onClick={() => setCursor(nextCursor ?? undefined)}
        >
          Next →
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete product?"
        message={`"${deleteTarget?.name ?? ''}" will be permanently removed. This cannot be undone.`}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}