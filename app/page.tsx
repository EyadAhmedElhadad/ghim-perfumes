import type { Metadata } from 'next';
import Link from 'next/link';
import { getProducts } from '@/lib/products';
import { formatPrice } from '@/lib/format';
import ProductImage from '@/components/ProductImage';
import Image from 'next/image';
import { BRAND } from '@/lib/mock-data';
import { getCollectionImages } from '@/lib/homepage-collections';
import { getHomepageContent } from '@/lib/content';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import Stardust from '@/components/Stardust';
import AddToCartMini from '@/components/AddToCartMini';
import BestSellersCarousel from '@/components/BestSellersCarousel';
import WhispersOfTheCloud from '@/components/home/WhispersOfTheCloud';
import { listFeaturedReviews } from '@/lib/reviews';

// Cache the storefront home page for 5 minutes (ISR) for fast repeat loads.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'GHIM | High-End Middle Eastern Fragrance House',
  description:
    'Luxury Middle Eastern fragrances composed for the hours between dusk and dawn.',
};

export default async function HomePage() {
  const products = await getProducts();
  const collectionImages = await getCollectionImages();
  const home = await getHomepageContent();
  const featuredReviews = await listFeaturedReviews();

  // Best Sellers: curated ordered list when the admin has configured one,
  // otherwise fall back to showing all products (current behaviour).
  const featuredProducts =
    home.featuredProductIds.length > 0
      ? home.featuredProductIds
          .map(
            (id) =>
              products.find((p) => p.id === id || p.slug === id) ?? null,
          )
          .filter((p): p is (typeof products)[number] => p !== null)
      : products;

  // Signatures: admin-curated grid — if the admin has selected specific products,
  // show only those in the chosen order; otherwise show the full catalog.
  const signatureProducts =
    home.signatureProductIds.length > 0
      ? home.signatureProductIds
          .map(
            (id) =>
              products.find((p) => p.id === id || p.slug === id) ?? null,
          )
          .filter((p): p is (typeof products)[number] => p !== null)
      : products;

  const toCartItem = (p: (typeof products)[number]) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    currency: p.currency,
    image: p.images[0]?.url ?? '',
    size: p.size,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-background">
      <AnnouncementBar />
      <Header />

      <main>
        {/* Hero */}
        <header className="relative flex min-h-[700px] flex-col items-center justify-center overflow-hidden px-margin-mobile pb-20 pt-12 nocturnal-gradient md:px-margin-desktop">
          <div
            className="absolute inset-0 z-0 opacity-40 mix-blend-screen bg-cover bg-center"
            style={{ backgroundImage: `url('${home.heroBackgroundUrl || BRAND.heroBackground}')` }}
          />
          <Stardust />

          <div className="relative z-10 mx-auto flex w-full max-w-container-max flex-col items-center gap-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND.logo}
                alt="GHIM logo"
                className="h-44 object-contain opacity-90 drop-shadow-2xl md:h-48"
              />
            <h1 className="font-display-lg text-display-md-mobile leading-tight text-on-background md:text-display-md">
              {home.heroHeadline || 'Feel the Clouds.'}
              {home.heroSubheadline ? (
                <>
                  <br />
                  <span className="italic gold-text">
                    {home.heroSubheadline}
                  </span>
                </>
              ) : null}
            </h1>

            {home.heroCtaText ? (
              <Link
                href={home.heroCtaUrl || '/products'}
                className="gold-glow gold-gradient rounded px-8 py-3 font-label-caps text-label-caps uppercase tracking-widest transition-all hover:opacity-90"
              >
                {home.heroCtaText}
              </Link>
            ) : null}

            <div className="mt-4 flex w-full flex-col justify-center gap-8 px-4 md:flex-row md:gap-gutter">
              <Link
                href="/products?cat=her"
                className="group relative flex w-full flex-col overflow-hidden rounded-[16px] border border-secondary transition-all duration-500 hover:border-secondary/70 md:w-72"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-[16px] md:h-72">
                  <Image
                    src={collectionImages.her}
                    alt="For Her collection"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 288px"
                    unoptimized={!/^\/|lh3\.googleusercontent\.com/.test(collectionImages.her)}
                    className="object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                  />
                </div>
                <div className="flex flex-col items-center bg-gradient-to-t from-background via-background/95 to-background/80 p-4 text-center rounded-b-[16px]">
                  <span className="mb-2 font-label-caps text-label-caps uppercase tracking-[0.2em] gold-text">
                    Collection
                  </span>
                  <h2 className="font-headline-lg text-on-background">
                    For Her
                  </h2>
                </div>
              </Link>

              <Link
                href="/products?cat=him"
                className="group relative flex w-full flex-col overflow-hidden rounded-[16px] border border-secondary transition-all duration-500 hover:border-secondary/70 md:w-72"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-[16px] md:h-72">
                  <Image
                    src={collectionImages.him}
                    alt="For Him collection"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 288px"
                    unoptimized={!/^\/|lh3\.googleusercontent\.com/.test(collectionImages.him)}
                    className="object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                  />
                </div>
                <div className="flex flex-col items-center bg-gradient-to-t from-background via-background/95 to-background/80 p-4 text-center rounded-b-[16px]">
                  <span className="mb-2 font-label-caps text-label-caps uppercase tracking-[0.2em] gold-text">
                    Collection
                  </span>
                  <h2 className="font-headline-lg text-on-background">
                    For Him
                  </h2>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Promo banner */}
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="relative z-10 mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
            <div className="glass-panel relative flex flex-col items-center overflow-hidden rounded-xl p-8 text-center md:p-16">
              <span className="pointer-events-none absolute -right-8 -top-8 rotate-[-15deg] text-[120px] text-secondary/10">
                🌙
              </span>
              <h3 className="mb-4 font-headline-lg gold-text">
                Every Mood. Every Moment.
              </h3>
              <p className="mb-8 max-w-2xl font-body-lg text-on-surface-variant">
                Discover the layers of the night. Intricate notes crafted for
                those who embrace the mystery of dusk till dawn.
              </p>
              <Link
                href="/products"
                className="gold-glow gold-gradient rounded px-8 py-3 font-label-caps text-label-caps uppercase tracking-widest transition-all hover:opacity-90"
              >
                Shop All Collection
              </Link>
            </div>
          </div>
        </section>

        {/* Signatures — full catalog so admin-created products appear on the home page */}
        <section className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-headline-lg gold-text">Signatures</h2>
            <Link
              href="/products"
              className="border-b border-on-surface-variant pb-1 font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant transition-colors hover:border-secondary hover:text-secondary"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-gutter sm:grid-cols-3 lg:grid-cols-4">
            {signatureProducts.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-outline-variant/30 glass-panel transition-all hover:border-secondary/60"
              >
                <div className="relative aspect-square overflow-hidden bg-surface-container-low">
                  <ProductImage
                    src={p.images[0]?.url}
                    alt={p.images[0]?.alt ?? p.name}
                    className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 p-4">
                  <div>
                    <h3 className="font-headline-md text-on-background">{p.name}</h3>
                    <p className="font-body-md gold-text">
                      {formatPrice(p.price, p.currency)}
                    </p>
                  </div>
                  <AddToCartMini
                    item={toCartItem(p)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-secondary text-secondary opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-secondary hover:text-on-secondary"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <BestSellersCarousel products={featuredProducts} />
        {/* Whispers of the Cloud — luxury carousel fed by is_featured reviews, fallback to curated quotes */}
        <WhispersOfTheCloud reviews={featuredReviews} />
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}