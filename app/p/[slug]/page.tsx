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

  const paragraphs = page.body.split('\n\n');

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-background">
      <AnnouncementBar />
      <Header />
      <main className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        {/* Left — Brand image (or graceful placeholder) */}
        <div className="overflow-hidden rounded-2xl border border-amber-400/20 shadow-2xl">
          {page.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.imageUrl}
              alt={page.title}
              className="aspect-[4/5] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center bg-gradient-to-br from-[#111827] to-[#0a0e17] text-6xl text-amber-400/30">
              🌙
            </div>
          )}
        </div>

        {/* Right — Story content */}
        <div>
          {page.subtitle ? (
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-amber-400/80">
              {page.subtitle}
            </p>
          ) : null}
          <h1 className="font-serif text-3xl text-amber-400 lg:text-4xl">
            {page.title}
          </h1>
          <article className="mt-6 space-y-4 text-base leading-relaxed text-slate-300 lg:text-lg">
            {paragraphs.map((block, i) => (
              <p key={i} className="whitespace-pre-line">
                {block}
              </p>
            ))}
          </article>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
