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
  bundleDiscountEnabled: boolean;
  bundleDiscountPercentage: number;
  bundleMinQuantity: number;
  bundleOfferText: string;
  bundleUnlockedText: string;
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
  bundleDiscountEnabled: true,
  bundleDiscountPercentage: 30,
  bundleMinQuantity: 2,
  bundleOfferText: 'اطلب واحدة كمان عشان تفعل العرض',
  bundleUnlockedText: 'تم تفعيل خصم 30% + الشحن المجاني 🎉',
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
      const raw = (d?.siteSettings ?? {}) as Partial<PublicSiteSettings>;
      const merged: PublicSiteSettings = {
        ...DEFAULT_PUBLIC_SITE_SETTINGS,
        ...raw,
      };
      // seamless fallback if DB fields are empty / undefined
      if (typeof merged.bundleOfferText !== 'string' || !merged.bundleOfferText.trim())
        merged.bundleOfferText = DEFAULT_PUBLIC_SITE_SETTINGS.bundleOfferText;
      if (typeof merged.bundleUnlockedText !== 'string' || !merged.bundleUnlockedText.trim())
        merged.bundleUnlockedText = DEFAULT_PUBLIC_SITE_SETTINGS.bundleUnlockedText;
      if (typeof merged.bundleDiscountEnabled !== 'boolean')
        merged.bundleDiscountEnabled = DEFAULT_PUBLIC_SITE_SETTINGS.bundleDiscountEnabled;
      if (!Number.isFinite(merged.bundleDiscountPercentage) || merged.bundleDiscountPercentage < 0 || merged.bundleDiscountPercentage > 100)
        merged.bundleDiscountPercentage = DEFAULT_PUBLIC_SITE_SETTINGS.bundleDiscountPercentage;
      if (!Number.isFinite(merged.bundleMinQuantity) || merged.bundleMinQuantity < 1)
        merged.bundleMinQuantity = DEFAULT_PUBLIC_SITE_SETTINGS.bundleMinQuantity;
      cache = {
        siteSettings: merged,
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
