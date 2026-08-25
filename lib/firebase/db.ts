import 'server-only';
import type { Query } from 'firebase-admin/firestore';
import { adminFirestore, isAdminConfigured } from './admin';
import { MOCK_PRODUCTS } from '../mock-data';
import type { AdminProduct, StockStatus } from '../types';

const COLLECTION = 'products';

export function stockStatusFor(stock: number): StockStatus {
  if (stock <= 0) return 'out';
  if (stock <= 10) return 'low';
  return 'in';
}

export type ProductListQuery = {
  search?: string;
  category?: 'all' | 'her' | 'him' | 'unisex';
  stock?: 'all' | StockStatus;
  sort?: 'name' | 'price' | 'date' | 'stock';
  dir?: 'asc' | 'desc';
  cursor?: string;
  limit?: number;
};

export type ProductListResult = {
  items: AdminProduct[];
  nextCursor: string | null;
  prevCursor: string | null;
  total: number;
};

export type ProductInput = Omit<
  AdminProduct,
  'id' | 'createdAt' | 'updatedAt' | 'stockStatus'
>;

// ============================================================
// DEMO (in-memory) store — used while Firebase is unconfigured
// ============================================================
const STORE_CATEGORY_MAP: Record<string, AdminProduct['category']> = {
  'luna-aurea': 'her',
  'cloud-marshmallow': 'her',
  'desert-rose': 'her',
  'oud-noir': 'him',
};

const seed: AdminProduct[] = MOCK_PRODUCTS.map((p, i) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  tagline: p.tagline,
  description: p.description,
  price: p.price,
  compareAtPrice: p.compareAtPrice,
  currency: p.currency,
  stock: p.stock,
  stockStatus: stockStatusFor(p.stock),
  concentration: p.concentration,
  size: p.size,
  category: STORE_CATEGORY_MAP[p.slug] ?? 'unisex',
  tag: '',
  inspiredBy: p.inspiredBy,
  inspiredByRetail: p.inspiredByRetail,
  images: (p.images as unknown as { src: string; alt: string }[]).map(
    (im, i) => ({
      url: im.src,
      path: '',
      alt: im.alt,
      order: i,
    }),
  ),
  notes: p.notes,
  vibe: p.vibe,
  performance: p.performance,
  bestFor: p.bestFor,
  createdAt: Date.now() - (20 - i) * 86_400_000,
  updatedAt: Date.now() - i * 3_600_000,
}));

let demoStore: AdminProduct[] = [...seed];

function matches(p: AdminProduct, q: ProductListQuery): boolean {
  const search = (q.search ?? '').trim().toLowerCase();
  const category = q.category ?? 'all';
  const stock = q.stock ?? 'all';
  if (category !== 'all' && p.category !== category) return false;
  if (stock !== 'all' && p.stockStatus !== stock) return false;
  if (search) {
    const hay = [
      p.name,
      p.slug,
      p.tagline,
      p.description,
      p.inspiredBy ?? '',
      ...Object.values(p.notes).flat(),
    ]
      .join(' ')
      .toLowerCase();
    if (!hay.includes(search)) return false;
  }
  return true;
}

function sortDemo(list: AdminProduct[], q: ProductListQuery): AdminProduct[] {
  const dir = q.dir === 'asc' ? 1 : -1;
  const field = q.sort ?? 'date';
  return [...list].sort((a, b) => {
    let av: number | string;
    let bv: number | string;
    if (field === 'name') {
      av = a.name.toLowerCase();
      bv = b.name.toLowerCase();
    } else if (field === 'price') {
      av = a.price;
      bv = b.price;
    } else if (field === 'stock') {
      av = a.stock;
      bv = b.stock;
    } else {
      av = a.createdAt;
      bv = b.createdAt;
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

function listDemo(q: ProductListQuery): ProductListResult {
  const limit = Math.min(50, q.limit ?? 10);
  const filtered = sortDemo(demoStore.filter((p) => matches(p, q)), q);
  const total = filtered.length;
  const start = Math.max(0, parseInt(q.cursor ?? '0', 10) || 0);
  const items = filtered.slice(start, start + limit);
  const nextCursor =
    start + items.length < total ? String(start + limit) : null;
  const prevCursor = start - limit >= 0 ? String(Math.max(0, start - limit)) : null;
  return { items, nextCursor, prevCursor, total };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getDemoStore(): AdminProduct[] {
  return demoStore;
}

// ============================================================
// FIRESTORE — used once Firebase Admin is configured
// ============================================================
function toDoc(p: AdminProduct): Record<string, unknown> {
  const { id: _id, ...rest } = p;
  return rest;
}

function fromDoc(id: string, data: Record<string, unknown>): AdminProduct {
  return {
    id,
    name: String(data.name ?? ''),
    slug: String(data.slug ?? id),
    tagline: String(data.tagline ?? ''),
    description: String(data.description ?? ''),
    price: Number(data.price ?? 0),
    compareAtPrice:
      data.compareAtPrice != null ? Number(data.compareAtPrice) : null,
    currency: String(data.currency ?? 'EGP'),
    stock: Number(data.stock ?? 0),
    stockStatus: (data.stockStatus as StockStatus) ?? stockStatusFor(Number(data.stock ?? 0)),
    concentration: String(data.concentration ?? ''),
    size: String(data.size ?? ''),
    category: (data.category as AdminProduct['category']) ?? 'unisex',
    tag: String(data.tag ?? ''),
    inspiredBy: data.inspiredBy ? String(data.inspiredBy) : null,
    inspiredByRetail:
      data.inspiredByRetail != null ? Number(data.inspiredByRetail) : null,
    images: Array.isArray(data.images)
      ? (data.images as unknown[]).map((im, i) =>
          typeof im === 'string'
            ? { url: im, path: '', alt: '', order: i }
            : {
                url: String((im as { url?: unknown }).url ?? ''),
                path: String((im as { path?: unknown }).path ?? ''),
                alt: String((im as { alt?: unknown }).alt ?? ''),
                order: Number((im as { order?: unknown }).order ?? i),
              },
        )
      : [],
    hoverImage:
      data.hoverImage && typeof data.hoverImage === 'object'
        ? {
            url: String((data.hoverImage as { url?: unknown }).url ?? ''),
            path: String((data.hoverImage as { path?: unknown }).path ?? ''),
            alt: String((data.hoverImage as { alt?: unknown }).alt ?? ''),
            order: Number((data.hoverImage as { order?: unknown }).order ?? 0),
          }
        : undefined,
    notes: {
      top: Array.isArray((data.notes as any)?.top) ? (data.notes as any).top : [],
      middle: Array.isArray((data.notes as any)?.middle) ? (data.notes as any).middle : [],
      base: Array.isArray((data.notes as any)?.base) ? (data.notes as any).base : [],
    },
    vibe: String(data.vibe ?? ''),
    performance: String(data.performance ?? ''),
    bestFor: String(data.bestFor ?? ''),
    createdAt: Number(data.createdAt ?? 0),
    updatedAt: Number(data.updatedAt ?? 0),
  };
}

const FIREBASE_SORT_FIELD: Record<string, string> = {
  name: 'name',
  price: 'price',
  date: 'createdAt',
  stock: 'stock',
};

function encodeCursor(value: unknown, id: string): string {
  return Buffer.from(JSON.stringify([value, id])).toString('base64url');
}
function decodeCursor(cursor: string): [unknown, string] {
  try {
    const [v, id] = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    );
    return [v, id];
  } catch {
    return [null, ''];
  }
}

async function listFirestore(q: ProductListQuery): Promise<ProductListResult> {
  const db = adminFirestore();
  const limit = Math.min(50, q.limit ?? 10);
  const dir = q.dir === 'asc' ? 'asc' : 'desc';
  const sortField = FIREBASE_SORT_FIELD[q.sort ?? 'date'] ?? 'createdAt';

  let query: Query = db.collection(COLLECTION);
  const category = q.category ?? 'all';
  const stock = q.stock ?? 'all';
  if (category !== 'all') query = query.where('category', '==', category);
  if (stock !== 'all') query = query.where('stockStatus', '==', stock);
  query = query.orderBy(sortField, dir).orderBy('id', dir);
  if (q.cursor) {
    const [value, id] = decodeCursor(q.cursor);
    query = query.startAfter([value, id]);
  }

  const snap = await query.limit(limit + 1).get();
  let items = snap.docs.slice(0, limit).map((d) =>
    fromDoc(d.id, d.data() as Record<string, unknown>),
  );

  // Firestore has no contains-search; apply prefix/name matching in memory.
  const search = (q.search ?? '').trim().toLowerCase();
  if (search) {
    items = items.filter((p) =>
      [p.name, p.slug, p.tagline, p.description]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }

  const hasMore = snap.docs.length > limit;
  const last = snap.docs[Math.min(limit, snap.docs.length) - 1];
  const nextCursor = hasMore && last
    ? encodeCursor(last.get(sortField), last.id)
    : null;

  const countSnap = await db.collection(COLLECTION).count().get();
  const total = countSnap.data().count ?? items.length;

  return { items, nextCursor, prevCursor: null, total };
}

// ============================================================
// PUBLIC SERVICE API
// ============================================================
export async function listProducts(
  q: ProductListQuery = {},
): Promise<ProductListResult> {
  if (isAdminConfigured()) return listFirestore(q);
  return listDemo(q);
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  if (isAdminConfigured()) {
    const snap = await adminFirestore().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    return fromDoc(snap.id, snap.data() as Record<string, unknown>);
  }
  return demoStore.find((p) => p.id === id || p.slug === id) ?? null;
}

export async function createProduct(
  input: ProductInput,
): Promise<AdminProduct> {
  const id = input.slug || slugify(input.name) || 'product';
  const product: AdminProduct = {
    ...input,
    id,
    stockStatus: stockStatusFor(input.stock),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  if (isAdminConfigured()) {
    await adminFirestore()
      .collection(COLLECTION)
      .doc(id)
      .set(toDoc(product));
  } else {
    demoStore = [product, ...demoStore];
  }
  return product;
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<AdminProduct | null> {
  if (isAdminConfigured()) {
    const ref = adminFirestore().collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const existing = fromDoc(id, snap.data() as Record<string, unknown>);
    const next: AdminProduct = {
      ...existing,
      ...patch,
      stockStatus:
        patch.stock != null ? stockStatusFor(patch.stock) : existing.stockStatus,
      updatedAt: Date.now(),
    };
    await ref.set(toDoc(next));
    return next;
  }

  const idx = demoStore.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const existing = demoStore[idx];
  const next: AdminProduct = {
    ...existing,
    ...patch,
    stockStatus: patch.stock != null ? stockStatusFor(patch.stock) : existing.stockStatus,
    updatedAt: Date.now(),
  };
  demoStore = demoStore.map((p, i) => (i === idx ? next : p));
  return next;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isAdminConfigured()) {
    await adminFirestore().collection(COLLECTION).doc(id).delete();
    return true;
  }
  const before = demoStore.length;
  demoStore = demoStore.filter((p) => p.id !== id);
  return demoStore.length !== before;
}

export async function getStats() {
  if (isAdminConfigured()) {
    const db = adminFirestore();
    const [total, out, low] = await Promise.all([
      db.collection(COLLECTION).count().get(),
      db.collection(COLLECTION).where('stockStatus', '==', 'out').count().get(),
      db.collection(COLLECTION).where('stockStatus', '==', 'low').count().get(),
    ]);
    return {
      total: total.data().count,
      out: out.data().count,
      low: low.data().count,
      in: total.data().count - out.data().count - low.data().count,
    };
  }
  const statuses = demoStore.map((p) => p.stockStatus);
  return {
    total: statuses.length,
    out: statuses.filter((s) => s === 'out').length,
    low: statuses.filter((s) => s === 'low').length,
    in: statuses.filter((s) => s === 'in').length,
  };
}