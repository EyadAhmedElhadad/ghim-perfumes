import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPageContent } from '@/lib/content';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageContent(slug);
  if (!page) return { title: 'Page not found' };
  const description = page.body.replace(/\s+/g, ' ').slice(0, 160).trim();
  return { title: page.title, description };
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPageContent(slug);
  if (!page) notFound();

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-background">
      <AnnouncementBar />
      <Header />
      <main className="mx-auto max-w-3xl px-margin-mobile py-16 md:px-margin-desktop">
        <h1 className="mb-8 font-headline-lg text-4xl gold-text">{page.title}</h1>
        <article className="space-y-4 font-body-lg leading-relaxed text-on-surface-variant">
          {page.body.split('\n\n').map((block, i) => (
            <p key={i} className="whitespace-pre-line">
              {block}
            </p>
          ))}
        </article>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
