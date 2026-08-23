import 'server-only';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { getNeon, isDbConfigured } from './neon';
import { MOCK_PRODUCTS } from '../mock-data';
import type { AdminProduct, StockStatus } from '../types';

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
// DEMO (in-memory) store — used only while Neon is unconfigured
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
  images: (p.images as unknown as { src: string; alt: string }[]).map((im, idx) => ({
    url: im.src,
    path: '',
    alt: im.alt,
    order: idx,
  })),
  notes: p.notes,
  vibe: p.vibe,
  performance: p.performance,
  bestFor: p.bestFor,
  createdAt: Date.now() - (20 - i) * 86_400_000,
  updatedAt: Date.now() - i * 3_600_000,
}));

// File-backed store so admin-created products persist across restarts and are
// shared with the storefront (demo / local-dev mode, i.e. Neon unconfigured).
const DEMO_DATA_DIR = path.join(process.cwd(), 'data');
const DEMO_DATA_FILE = path.join(DEMO_DATA_DIR, 'products.json');

let demoStore: AdminProduct[] | null = null;
let demoLoaded = false;

function loadDemoStore(): AdminProduct[] {
  if (demoLoaded && demoStore) return demoStore;
  try {
    const raw = readFileSync(DEMO_DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as AdminProduct[];
    if (Array.isArray(parsed) && parsed.length) {
      demoStore = parsed;
      demoLoaded = true;
      return demoStore;
    }
  } catch {
    // no file yet — fall through to seed
  }
  demoStore = seed;
  demoLoaded = true;
  persistDemoStore(demoStore);
  return demoStore;
}

function persistDemoStore(items: AdminProduct[]): void {
  demoStore = items;
  try {
    mkdirSync(DEMO_DATA_DIR, { recursive: true });
    writeFileSync(DEMO_DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
  } catch (e) {
    console.warn('[demo-store] failed to persist products:', e);
  }
}

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
  const filtered = sortDemo(loadDemoStore().filter((p) => matches(p, q)), q);
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
  return loadDemoStore();
}

// ============================================================
// NEON POSTGRES — used once DATABASE_URL is configured
// ============================================================
const TABLE = 'products';
const NEON_SORT_FIELD: Record<string, string> = {
  name: 'name',
  price: 'price',
  date: 'created_at',
  stock: 'stock',
};

function fromRow(row: Record<string, unknown>): AdminProduct {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    slug: String(row.slug ?? row.id ?? ''),
    tagline: String(row.tagline ?? ''),
    description: String(row.description ?? ''),
    price: Number(row.price ?? 0),
    compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : null,
    currency: String(row.currency ?? 'EGP'),
    stock: Number(row.stock ?? 0),
    stockStatus: (row.stock_status as StockStatus) ?? stockStatusFor(Number(row.stock ?? 0)),
    concentration: String(row.concentration ?? ''),
    size: String(row.size ?? ''),
    category: (row.category as AdminProduct['category']) ?? 'unisex',
    tag: String(row.tag ?? ''),
    inspiredBy: row.inspired_by != null ? String(row.inspired_by) : null,
    inspiredByRetail: row.inspired_by_retail != null ? Number(row.inspired_by_retail) : null,
    images: Array.isArray(row.images)
      ? (row.images as unknown[]).map((im, i) =>
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
    notes: {
      top: Array.isArray((row.notes as { top?: unknown })?.top) ? (row.notes as { top: unknown[] }).top as string[] : [],
      middle: Array.isArray((row.notes as { middle?: unknown })?.middle) ? (row.notes as { middle: unknown[] }).middle as string[] : [],
      base: Array.isArray((row.notes as { base?: unknown })?.base) ? (row.notes as { base: unknown[] }).base as string[] : [],
    },
    vibe: String(row.vibe ?? ''),
    performance: String(row.performance ?? ''),
    bestFor: String(row.best_for ?? ''),
    createdAt: Number(row.created_at ?? 0),
    updatedAt: Number(row.updated_at ?? 0),
  };
}

function toRow(p: AdminProduct): Record<string, unknown> {
  return {
    id: p.id,
    name: p.name || '',
    slug: p.slug || p.id || '',
    tagline: p.tagline ?? '',
    description: p.description ?? '',
    price: p.price ?? 0,
    compare_at_price: p.compareAtPrice ?? null,
    currency: p.currency || 'EGP',
    stock: p.stock ?? 0,
    stock_status: p.stockStatus || 'in',
    concentration: p.concentration ?? '',
    size: p.size ?? '',
    category: p.category ?? 'unisex',
    tag: p.tag ?? '',
    inspired_by: p.inspiredBy ?? null,
    inspired_by_retail: p.inspiredByRetail ?? null,
    images: p.images ?? [], // jsonb — Cloudinary secure_url + public_id
    notes: p.notes ?? { top: [], middle: [], base: [] },
    vibe: p.vibe ?? '',
    performance: p.performance ?? '',
    best_for: p.bestFor ?? '',
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

// jsonb columns must be passed as JSON text + ::jsonb cast (Neon double-serializes objects)
const JSONB_COLS = new Set(['images', 'notes']);

// Parameterized INSERT.
async function insertRow(row: Record<string, unknown>): Promise<void> {
  const sql = getNeon();
  const cols = Object.keys(row);
  const vals = cols.map((c) =>
    JSONB_COLS.has(c) ? JSON.stringify(row[c]) : row[c],
  );
  const placeholders = cols
    .map((c, i) => (JSONB_COLS.has(c) ? `$${i + 1}::jsonb` : `$${i + 1}`))
    .join(', ');
  await sql(
    `INSERT INTO products (${cols.join(', ')}) VALUES (${placeholders})`,
    vals,
  );
}

// Parameterized UPDATE by id.
async function updateRowById(
  id: string,
  row: Record<string, unknown>,
): Promise<void> {
  const sql = getNeon();
  const cols = Object.keys(row);
  const sets = cols
    .map((c, i) => (JSONB_COLS.has(c) ? `${c} = $${i + 1}::jsonb` : `${c} = $${i + 1}`))
    .join(', ');
  const params = [
    ...cols.map((c) => (JSONB_COLS.has(c) ? JSON.stringify(row[c]) : row[c])),
    id,
  ];
  await sql(
    `UPDATE products SET ${sets} WHERE id = $${params.length}`,
    params,
  );
}

let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getNeon();
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          tagline TEXT NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '',
          price NUMERIC NOT NULL DEFAULT 0,
          compare_at_price NUMERIC,
          currency TEXT NOT NULL DEFAULT 'EGP',
          stock INTEGER NOT NULL DEFAULT 0,
          stock_status TEXT NOT NULL DEFAULT 'in',
          concentration TEXT NOT NULL DEFAULT '',
          size TEXT NOT NULL DEFAULT '',
          category TEXT NOT NULL DEFAULT 'unisex',
          tag TEXT NOT NULL DEFAULT '',
          inspired_by TEXT,
          inspired_by_retail NUMERIC,
          images JSONB NOT NULL DEFAULT '[]'::jsonb,
          notes JSONB NOT NULL DEFAULT '{"top":[],"middle":[],"base":[]}'::jsonb,
          vibe TEXT NOT NULL DEFAULT '',
          performance TEXT NOT NULL DEFAULT '',
          best_for TEXT NOT NULL DEFAULT '',
          created_at BIGINT NOT NULL DEFAULT 0,
          updated_at BIGINT NOT NULL DEFAULT 0
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE,
          name TEXT,
          phone TEXT,
          created_at BIGINT NOT NULL DEFAULT 0
        );
      `;
      // Seed from mock data on first run so the storefront isn't empty
      const countRows = (await sql`SELECT COUNT(*)::int AS c FROM products`) as unknown[];
      if (Number((countRows[0] as { c: number })?.c ?? 0) === 0) {
        for (const p of seed) {
          await insertRow(toRow(p));
        }
      }
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

async function listNeon(q: ProductListQuery): Promise<ProductListResult> {
  await ensureSchema();
  const sql = getNeon();
  const limit = Math.min(50, q.limit ?? 10);
  const offset = Math.max(0, parseInt(q.cursor ?? '0', 10) || 0);
  const dir = q.dir === 'asc' ? 'ASC' : 'DESC';
  const sortField = NEON_SORT_FIELD[q.sort ?? 'date'] ?? 'created_at';

  const where: string[] = [];
  const params: unknown[] = [];
  if (q.category && q.category !== 'all') {
    where.push(`category = $${params.length + 1}`);
    params.push(q.category);
  }
  if (q.stock && q.stock !== 'all') {
    where.push(`stock_status = $${params.length + 1}`);
    params.push(q.stock);
  }
  if (q.search?.trim()) {
    where.push(
      `(name ILIKE $${params.length + 1} OR slug ILIKE $${params.length + 1} OR tagline ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`,
    );
    params.push(`%${q.search.trim()}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const totalRows = (await sql(
    `SELECT COUNT(*)::int AS c FROM products ${whereSql}`,
    params,
  )) as unknown[];
  const total = Number((totalRows[0] as { c: number })?.c ?? 0);

  const rows = (await sql(
    `SELECT * FROM products ${whereSql} ORDER BY ${sortField} ${dir}, id ${dir} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  )) as unknown[];

  const items = rows.map((r) => fromRow(r as Record<string, unknown>));
  const nextCursor = offset + items.length < total ? String(offset + limit) : null;
  const prevCursor = offset - limit >= 0 ? String(Math.max(0, offset - limit)) : null;
  return { items, nextCursor, prevCursor, total };
}

async function getNeonProduct(id: string): Promise<AdminProduct | null> {
  await ensureSchema();
  const sql = getNeon();
  let rows = (await sql`SELECT * FROM products WHERE id = ${id} LIMIT 1`) as unknown[];
  if (rows.length === 0) {
    rows = (await sql`SELECT * FROM products WHERE slug = ${id} LIMIT 1`) as unknown[];
  }
  return rows.length ? fromRow(rows[0] as Record<string, unknown>) : null;
}

// ============================================================
// PUBLIC SERVICE API (same shape as before)
// ============================================================
export async function listProducts(
  q: ProductListQuery = {},
): Promise<ProductListResult> {
  if (isDbConfigured()) return listNeon(q);
  return listDemo(q);
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  if (isDbConfigured()) return getNeonProduct(id);
  return loadDemoStore().find((p) => p.id === id || p.slug === id) ?? null;
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
  if (isDbConfigured()) {
    await ensureSchema();
    const sql = getNeon();
    const existing = (await sql`SELECT id FROM products WHERE id = ${id} LIMIT 1`) as unknown[];
    if (existing.length) {
      throw new Error(`Product with slug "${id}" already exists`);
    }
    await insertRow(toRow(product));
  } else {
    persistDemoStore([product, ...loadDemoStore()]);
  }
  return product;
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<AdminProduct | null> {
  if (isDbConfigured()) {
    await ensureSchema();
    const sql = getNeon();
    const existing = await getNeonProduct(id);
    if (!existing) return null;
    const next: AdminProduct = {
      ...existing,
      ...patch,
      stockStatus:
        patch.stock != null ? stockStatusFor(patch.stock) : existing.stockStatus,
      updatedAt: Date.now(),
    };
    await updateRowById(id, toRow(next));
    return next;
  }

  const store = loadDemoStore();
  const idx = store.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const existing = store[idx];
  const next: AdminProduct = {
    ...existing,
    ...patch,
    stockStatus: patch.stock != null ? stockStatusFor(patch.stock) : existing.stockStatus,
    updatedAt: Date.now(),
  };
  persistDemoStore(store.map((p, i) => (i === idx ? next : p)));
  return next;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isDbConfigured()) {
    await ensureSchema();
    const sql = getNeon();
    const res = (await sql`DELETE FROM products WHERE id = ${id}`) as unknown;
    const count = (res as { count?: number }).count;
    return count != null ? count > 0 : true;
  }
  const store = loadDemoStore();
  const before = store.length;
  const next = store.filter((p) => p.id !== id);
  persistDemoStore(next);
  return next.length !== before;
}

export async function getStats() {
  if (isDbConfigured()) {
    await ensureSchema();
    const sql = getNeon();
    const [t] = (await sql`SELECT COUNT(*)::int AS c FROM products`) as unknown[];
    const [o] = (await sql`SELECT COUNT(*)::int AS c FROM products WHERE stock_status = 'out'`) as unknown[];
    const [l] = (await sql`SELECT COUNT(*)::int AS c FROM products WHERE stock_status = 'low'`) as unknown[];
    const total = Number((t as { c: number }).c ?? 0);
    const out = Number((o as { c: number }).c ?? 0);
    const low = Number((l as { c: number }).c ?? 0);
    return { total, out, low, in: total - out - low };
  }
  const statuses = loadDemoStore().map((p) => p.stockStatus);
  return {
    total: statuses.length,
    out: statuses.filter((s) => s === 'out').length,
    low: statuses.filter((s) => s === 'low').length,
    in: statuses.filter((s) => s === 'in').length,
  };
}

// ------- Customers (prices / customers data) -------
export type Customer = {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  createdAt: number;
};

export async function listCustomers(limit = 50): Promise<Customer[]> {
  if (!isDbConfigured()) return [];
  await ensureSchema();
  const sql = getNeon();
  const rows = (await sql`
    SELECT * FROM customers ORDER BY created_at DESC LIMIT ${limit}
  `) as unknown[];
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: String(row.id),
      email: String(row.email ?? ''),
      name: row.name ? String(row.name) : null,
      phone: row.phone ? String(row.phone) : null,
      createdAt: Number(row.created_at ?? 0),
    };
  });
}
