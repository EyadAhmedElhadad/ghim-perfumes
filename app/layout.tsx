import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import DevModeBanner from '@/components/DevModeBanner';

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

export const metadata: Metadata = {
  metadataBase: new URL('https://ghim-perfumes.com'),
  title: {
    default: 'GHIM Perfumes | Luxury Middle Eastern Fragrances',
    template: '%s | GHIM Perfumes',
  },
  description:
    'Luxury Middle Eastern fragrances composed for the hours between dusk and dawn.',
  keywords: [
    'luxury perfume',
    'Middle Eastern fragrance',
    'oud perfume',
    'niche fragrance',
    'GHIM',
  ],
  openGraph: {
    type: 'website',
    siteName: 'GHIM Perfumes',
    title: 'GHIM Perfumes | Luxury Middle Eastern Fragrances',
    description:
      'Luxury Middle Eastern fragrances composed for the hours between dusk and dawn.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GHIM Perfumes | Luxury Middle Eastern Fragrances',
    description:
      'Luxury Middle Eastern fragrances composed for the hours between dusk and dawn.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0b0b12',
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
      </body>
    </html>
  );
}