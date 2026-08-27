'use client';

import { useEffect, useState } from 'react';

export type PublicSiteSettings = {
  brandName: string;
  instagramUrl: string;
  whatsappNumber: string;
  contactEmail: string;
  contactPhone: string;
  footerText: string;
  copyrightText: string;
  seoTitle: string;
  seoDescription: string;
  defaultShippingFee: number;
  shippingFees: Record<string, number>;
};

export const DEFAULT_PUBLIC_SITE_SETTINGS: PublicSiteSettings = {
  brandName: 'GHIM.FRAGRANCES',
  instagramUrl: 'https://www.instagram.com/ghim.fragrances.eg/',
  whatsappNumber: '201004692513',
  contactEmail: 'hello@ghimperfumes.com',
  contactPhone: '',
  footerText:
    'Minimalist elegance rooted in Middle Eastern heritage. Feel the clouds.',
  copyrightText: `© ${new Date().getFullYear()} GHIM.FRAGRANCES. All rights reserved.`,
  seoTitle: 'GHIM | High-End Middle Eastern Fragrance House',
  seoDescription:
    'Luxury Middle Eastern fragrances composed for the hours between dusk and dawn.',
  defaultShippingFee: 0,
  shippingFees: {},
};

type PublicContent = {
  siteSettings: PublicSiteSettings;
  announcementText: string;
};

const DEFAULT_ANNOUNCEMENT = 'Pick any 2 perfumes. Get 30% off + free shipping';

let cache: PublicContent | null = null;
let inflight: Promise<PublicContent> | null = null;

async function load(): Promise<PublicContent> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch('/api/public/content', { cache: 'no-store' })
    .then((r) => r.json())
    .then((d) => {
      cache = {
        siteSettings: {
          ...DEFAULT_PUBLIC_SITE_SETTINGS,
          ...(d?.siteSettings ?? {}),
        },
        announcementText:
          typeof d?.announcementText === 'string' && d.announcementText.trim()
            ? d.announcementText
            : DEFAULT_ANNOUNCEMENT,
      };
      inflight = null;
      return cache;
    })
    .catch(() => {
      inflight = null;
      return {
        siteSettings: DEFAULT_PUBLIC_SITE_SETTINGS,
        announcementText: DEFAULT_ANNOUNCEMENT,
      };
    });
  return inflight;
}

export function usePublicContent(): PublicContent {
  const [data, setData] = useState<PublicContent>(
    cache ?? {
      siteSettings: DEFAULT_PUBLIC_SITE_SETTINGS,
      announcementText: DEFAULT_ANNOUNCEMENT,
    },
  );

  useEffect(() => {
    let active = true;
    load().then((d) => {
      if (active) setData(d);
    });
    return () => {
      active = false;
    };
  }, []);

  return data;
}
