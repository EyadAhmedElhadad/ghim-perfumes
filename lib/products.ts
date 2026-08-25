import 'server-only';
import { listProducts } from './db/db';
import { MOCK_PRODUCTS } from './mock-data';
import type { AdminProduct, Product } from './types';

function adminToProduct(p: AdminProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    images: Array.isArray(p.images)
      ? p.images.map((m, i) => ({
          url: m.url,
          path: m.path ?? '',
          alt: m.alt || `${p.name} photo ${i + 1}`,
          order: m.order ?? i,
        }))
      : [],
    price: Number(p.price ?? 0),
    compareAtPrice: p.compareAtPrice ?? null,
    hoverImage: p.hoverImage
      ? {
          url: p.hoverImage.url,
          path: p.hoverImage.path ?? '',
          alt: p.hoverImage.alt || `${p.name} photo (hover)`,
          order: p.hoverImage.order ?? 0,
        }
      : undefined,
    currency: p.currency || 'EGP',
    stock: Number(p.stock ?? 0),
    concentration: p.concentration || 'Eau de Parfum',
    size: p.size || '',
    inspiredBy: p.inspiredBy ?? null,
    inspiredByRetail: p.inspiredByRetail ?? null,
    notes: {
      top: p.notes?.top ?? [],
      middle: p.notes?.middle ?? [],
      base: p.notes?.base ?? [],
    },
    vibe: p.vibe || '',
    performance: p.performance || '',
    bestFor: p.bestFor || '',
    featured: false,
  };
}

export async function getProducts(): Promise<Product[]> {
  // Read from the same store the admin dashboard writes to (lib/db/db.ts),
  // whether that's Neon Postgres or the file-backed demo store. This keeps
  // admin-created products connected to the storefront.
  try {
    const { items } = await listProducts({
      limit: 200,
      sort: 'date',
      dir: 'asc',
    });
    if (items && items.length > 0) return items.map(adminToProduct);
  } catch (err) {
    console.warn('[products] store read failed, falling back to mock:', err);
  }

  // Mock fallback — only reached if the store is empty or unreachable.
  return MOCK_PRODUCTS.map((p) => ({
    ...p,
    images: (p.images as unknown as { src: string; alt: string }[]).map(
      (im, i) => ({
        url: im.src,
        path: '',
        alt: im.alt,
        order: i,
      }),
    ),
  }));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const list = await getProducts();
  return list.find((p) => p.slug === slug) ?? null;
}
