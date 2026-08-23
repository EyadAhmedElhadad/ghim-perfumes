import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts } from '@/lib/products';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductGallery from '@/components/ProductGallery';
import ProductInfo from '@/components/ProductInfo';
import ProductAccordions from '@/components/ProductAccordions';
import PerfumeNotes from '@/components/PerfumeNotes';
import SocialProof from '@/components/SocialProof';

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: product.name,
    description: product.tagline,
    openGraph: {
      title: product.name,
      description: product.tagline,
      images: [product.images[0]?.url ?? ''],
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <div className="mx-auto grid max-w-container-max grid-cols-1 gap-10 px-margin-mobile py-8 md:px-margin-desktop md:grid-cols-2 md:gap-14 md:py-12">
          <ProductGallery images={product.images} name={product.name} />
          <ProductInfo product={product} />
        </div>
        <div className="mx-auto max-w-container-max px-margin-mobile sm:px-margin-desktop">
          <ProductAccordions product={product} />
        </div>
        <PerfumeNotes product={product} />
        <SocialProof />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}