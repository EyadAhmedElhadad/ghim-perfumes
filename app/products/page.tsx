import type { Metadata } from 'next';
import Link from 'next/link';
import { getProducts } from '@/lib/products';
import { formatPrice } from '@/lib/format';
import ProductImage from '@/components/ProductImage';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import AddToCartMini from '@/components/AddToCartMini';

export const metadata: Metadata = {
  title: 'Shop All',
  description: 'Shop the full GHIM fragrance collection.',
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'her', label: 'For Her' },
  { key: 'him', label: 'For Him' },
];

type Props = { searchParams: Promise<{ cat?: string; search?: string }> };

export default async function ShopAllPage({ searchParams }: Props) {
  const { cat, search } = await searchParams;
  const all = await getProducts();

  const categoryFilter = cat && cat !== 'all' ? cat : null;

  // Filter by the product's own category attribute. Unisex products are shown
  // in both the For Her and For Him collections.
  let products = all.filter((p) => {
    if (!categoryFilter) return true;
    if (p.category === categoryFilter) return true;
    if (
      p.category === 'unisex' &&
      (categoryFilter === 'her' || categoryFilter === 'him')
    )
      return true;
    return false;
  });

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    products = products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.inspiredBy ?? '').toLowerCase().includes(q) ||
      Object.values(p.notes).flat().some((n) => n.toLowerCase().includes(q)),
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop">
          <div className="mb-8 text-center">
            <h1 className="font-headline-lg text-on-background">
              Shop the Collection
            </h1>
            <p className="mt-2 font-body-md text-on-surface-variant">
              Every bottle composed in small batches.
            </p>
          </div>

          <div className="mb-8 flex items-center justify-center gap-2">
            {FILTERS.map((f) => {
              const active = (cat ?? 'all') === f.key || (!cat && f.key === 'all');
              const href = f.key === 'all' ? '/products' : `/products?cat=${f.key}`;
              return (
                <Link
                  key={f.key}
                  href={href}
                  className={`rounded-full px-5 py-2 font-label-caps text-label-caps transition-colors ${
                    active
                      ? 'gold-gradient'
                      : 'bg-primary-container/40 text-on-surface-variant hover:text-secondary'
                  }`}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>

          {search ? (
            <div className="mb-8 text-center">
              <p className="font-body-md text-on-surface-variant">
                {products.length} result{products.length === 1 ? '' : 's'} for &ldquo;{search}&rdquo;
              </p>
              <Link
                href="/products"
                className="font-body-md text-xs gold-text underline underline-offset-2 hover:opacity-80"
              >
                Clear search
              </Link>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="group overflow-hidden rounded-lg border border-outline-variant/30 glass-panel transition-all hover:border-secondary/40"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-surface-container-low">
                  <ProductImage
                    src={p.images[0]?.url}
                    alt={p.images[0]?.alt ?? p.name}
                    priority={i === 0}
                    className="h-full w-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-105"
                  />
                  {p.compareAtPrice != null && (
                    <span className="absolute left-3 top-3 rounded gold-gradient px-2.5 py-1 font-label-caps text-[10px] font-semibold">
                      SALE
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-headline-md text-on-background">
                    {p.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-body-md font-semibold gold-text">
                      {formatPrice(p.price, p.currency)}
                    </span>
                    {p.compareAtPrice != null && (
                      <span className="font-body-md text-sm text-on-surface-variant line-through">
                        {formatPrice(p.compareAtPrice, p.currency)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}