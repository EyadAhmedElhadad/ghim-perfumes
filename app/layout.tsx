import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import DevModeBanner from '@/components/DevModeBanner';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { getSiteSettings } from '@/lib/content';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const brand = s.brandName || 'GHIM.FRAGRANCES';
  const title = s.seoTitle || 'GHIM.FRAGRANCES | Luxury Middle Eastern Fragrances';
  const description =
    s.seoDescription ||
    'Luxury Middle Eastern fragrances composed for the hours between dusk and dawn.';

  return {
    metadataBase: new URL('https://ghim-fragrances.vercel.app'),
    title: {
      default: title,
      template: `%s | ${brand}`,
    },
    description,
    keywords: [
      'luxury perfume',
      'Middle Eastern fragrance',
      'oud perfume',
      'niche fragrance',
      'GHIM',
    ],
    openGraph: {
      type: 'website',
      siteName: brand,
      title,
      description,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: { index: true, follow: true },
    icons: {
      apple: '/icon-512.png',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'GHIM',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#0a0e17',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <DevModeBanner />
        {children}
        <FloatingWhatsApp />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}