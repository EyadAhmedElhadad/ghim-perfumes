import 'server-only';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { getNeon, isDbConfigured } from './db/neon';
import { BRAND } from './mock-data';

// ----------------------------------------------------------------------------
// Site-wide editable content (brand, social, contact, footer, SEO defaults).
//
// Pattern: file-backed demo store (used when Neon / DATABASE_URL is not
// configured) + Neon Postgres table `site_settings` when configured. Falls back
// to the file store if a Neon read/write fails. Every value has a sensible
// default so the storefront never breaks when a field is unset.
// ----------------------------------------------------------------------------

export type SiteSettings = {
  brandName: string;
  instagramUrl: string;
  whatsappNumber: string;
  contactEmail: string;
  contactPhone: string;
  footerText: string;
  copyrightText: string;
  seoTitle: string;
  seoDescription: string;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
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
};

const DEMO_DIR = path.join(process.cwd(), 'data');
const DEMO_FILE = path.join(DEMO_DIR, 'site-settings.json');

// ---- file-backed (demo / local-dev) ----
function loadFile(): SiteSettings {
  try {
    const raw = readFileSync(DEMO_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    return { ...DEFAULT_SITE_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SITE_SETTINGS };
  }
}

function saveFile(data: SiteSettings): void {
  try {
    mkdirSync(DEMO_DIR, { recursive: true });
    writeFileSync(DEMO_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('[site-settings] persist failed:', e);
  }
}

// ---- Neon Postgres (when DATABASE_URL configured) ----
async function ensureTable(): Promise<void> {
  const sql = getNeon();
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      brand_name TEXT NOT NULL DEFAULT '',
      instagram_url TEXT NOT NULL DEFAULT '',
      whatsapp_number TEXT NOT NULL DEFAULT '',
      contact_email TEXT NOT NULL DEFAULT '',
      contact_phone TEXT NOT NULL DEFAULT '',
      footer_text TEXT NOT NULL DEFAULT '',
      copyright_text TEXT NOT NULL DEFAULT '',
      seo_title TEXT NOT NULL DEFAULT '',
      seo_description TEXT NOT NULL DEFAULT ''
    );
  `;
}

function rowToSettings(row: Record<string, unknown>): SiteSettings {
  return {
    brandName: String(row.brand_name ?? ''),
    instagramUrl: String(row.instagram_url ?? ''),
    whatsappNumber: String(row.whatsapp_number ?? ''),
    contactEmail: String(row.contact_email ?? ''),
    contactPhone: String(row.contact_phone ?? ''),
    footerText: String(row.footer_text ?? ''),
    copyrightText: String(row.copyright_text ?? ''),
    seoTitle: String(row.seo_title ?? ''),
    seoDescription: String(row.seo_description ?? ''),
  };
}

async function loadNeon(): Promise<SiteSettings> {
  const sql = getNeon();
  await ensureTable();
  const rows = (await sql`SELECT * FROM site_settings WHERE id = 'global' LIMIT 1`) as unknown[];
  if (rows.length === 0) return { ...DEFAULT_SITE_SETTINGS };
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...rowToSettings(rows[0] as Record<string, unknown>),
  };
}

async function saveNeon(data: SiteSettings): Promise<void> {
  const sql = getNeon();
  await ensureTable();
  await sql`
    INSERT INTO site_settings (
      id, brand_name, instagram_url, whatsapp_number, contact_email,
      contact_phone, footer_text, copyright_text, seo_title, seo_description
    ) VALUES (
      'global', ${data.brandName}, ${data.instagramUrl}, ${data.whatsappNumber}, ${data.contactEmail},
      ${data.contactPhone}, ${data.footerText}, ${data.copyrightText}, ${data.seoTitle}, ${data.seoDescription}
    )
    ON CONFLICT (id) DO UPDATE SET
      brand_name = EXCLUDED.brand_name,
      instagram_url = EXCLUDED.instagram_url,
      whatsapp_number = EXCLUDED.whatsapp_number,
      contact_email = EXCLUDED.contact_email,
      contact_phone = EXCLUDED.contact_phone,
      footer_text = EXCLUDED.footer_text,
      copyright_text = EXCLUDED.copyright_text,
      seo_title = EXCLUDED.seo_title,
      seo_description = EXCLUDED.seo_description
  `;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (isDbConfigured()) {
    try {
      return await loadNeon();
    } catch (e) {
      console.warn('[site-settings] neon read failed, using file fallback:', e);
    }
  }
  return loadFile();
}

export async function updateSiteSettings(
  patch: Partial<SiteSettings>,
): Promise<SiteSettings> {
  const current = await getSiteSettings();
  const next: SiteSettings = { ...current, ...patch };
  if (isDbConfigured()) {
    try {
      await saveNeon(next);
      return next;
    } catch (e) {
      console.warn('[site-settings] neon write failed, using file fallback:', e);
    }
  }
  saveFile(next);
  return next;
}

// ----------------------------------------------------------------------------
// Homepage editable content: hero, announcement banner, best-sellers featured.
// ----------------------------------------------------------------------------

export type HomepageContent = {
  heroHeadline: string;
  heroSubheadline: string;
  heroBackgroundUrl: string;
  heroCtaText: string;
  heroCtaUrl: string;
  announcementText: string;
  featuredProductIds: string[];
};

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  heroHeadline: 'Feel the Clouds.',
  heroSubheadline: 'Live the Essence.',
  heroBackgroundUrl: BRAND.heroBackground,
  heroCtaText: 'Shop All Collection',
  heroCtaUrl: '/products',
  announcementText: 'Pick any 2 perfumes. Get 30% off + free shipping',
  featuredProductIds: [],
};

const HOMEPAGE_DEMO_FILE = path.join(DEMO_DIR, 'homepage-content.json');

function loadHomepageFile(): HomepageContent {
  try {
    const raw = readFileSync(HOMEPAGE_DEMO_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<HomepageContent>;
    const merged: HomepageContent = { ...DEFAULT_HOMEPAGE_CONTENT, ...parsed };
    if (!Array.isArray(merged.featuredProductIds))
      merged.featuredProductIds = [];
    return merged;
  } catch {
    return { ...DEFAULT_HOMEPAGE_CONTENT, featuredProductIds: [] };
  }
}

function saveHomepageFile(data: HomepageContent): void {
  try {
    mkdirSync(DEMO_DIR, { recursive: true });
    writeFileSync(HOMEPAGE_DEMO_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('[homepage-content] persist failed:', e);
  }
}

async function ensureHomepageTable(): Promise<void> {
  const sql = getNeon();
  await sql`
    CREATE TABLE IF NOT EXISTS homepage_content (
      id TEXT PRIMARY KEY,
      hero_headline TEXT NOT NULL DEFAULT '',
      hero_subheadline TEXT NOT NULL DEFAULT '',
      hero_background_url TEXT NOT NULL DEFAULT '',
      hero_cta_text TEXT NOT NULL DEFAULT '',
      hero_cta_url TEXT NOT NULL DEFAULT '',
      announcement_text TEXT NOT NULL DEFAULT '',
      featured_product_ids JSONB NOT NULL DEFAULT '[]'::jsonb
    );
  `;
}

const HOMEPAGE_JSONB_COLS = new Set(['featured_product_ids']);

function rowToHomepage(row: Record<string, unknown>): HomepageContent {
  let featured: unknown = row.featured_product_ids;
  if (typeof featured === 'string') {
    try {
      featured = JSON.parse(featured);
    } catch {
      featured = [];
    }
  }
  return {
    heroHeadline: String(row.hero_headline ?? ''),
    heroSubheadline: String(row.hero_subheadline ?? ''),
    heroBackgroundUrl: String(row.hero_background_url ?? ''),
    heroCtaText: String(row.hero_cta_text ?? ''),
    heroCtaUrl: String(row.hero_cta_url ?? ''),
    announcementText: String(row.announcement_text ?? ''),
    featuredProductIds: Array.isArray(featured)
      ? (featured as unknown[]).filter((x) => typeof x === 'string') as string[]
      : [],
  };
}

async function loadHomepageNeon(): Promise<HomepageContent> {
  const sql = getNeon();
  await ensureHomepageTable();
  const rows = (await sql`SELECT * FROM homepage_content WHERE id = 'global' LIMIT 1`) as unknown[];
  if (rows.length === 0) return { ...DEFAULT_HOMEPAGE_CONTENT, featuredProductIds: [] };
  return {
    ...DEFAULT_HOMEPAGE_CONTENT,
    ...rowToHomepage(rows[0] as Record<string, unknown>),
  };
}

async function saveHomepageNeon(data: HomepageContent): Promise<void> {
  const sql = getNeon();
  await ensureHomepageTable();
  await sql`
    INSERT INTO homepage_content (
      id, hero_headline, hero_subheadline, hero_background_url,
      hero_cta_text, hero_cta_url, announcement_text, featured_product_ids
    ) VALUES (
      'global', ${data.heroHeadline}, ${data.heroSubheadline}, ${data.heroBackgroundUrl},
      ${data.heroCtaText}, ${data.heroCtaUrl}, ${data.announcementText}, ${JSON.stringify(data.featuredProductIds)}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      hero_headline = EXCLUDED.hero_headline,
      hero_subheadline = EXCLUDED.hero_subheadline,
      hero_background_url = EXCLUDED.hero_background_url,
      hero_cta_text = EXCLUDED.hero_cta_text,
      hero_cta_url = EXCLUDED.hero_cta_url,
      announcement_text = EXCLUDED.announcement_text,
      featured_product_ids = EXCLUDED.featured_product_ids
  `;
}

export async function getHomepageContent(): Promise<HomepageContent> {
  if (isDbConfigured()) {
    try {
      return await loadHomepageNeon();
    } catch (e) {
      console.warn('[homepage-content] neon read failed, using file fallback:', e);
    }
  }
  return loadHomepageFile();
}

export async function updateHomepageContent(
  patch: Partial<HomepageContent>,
): Promise<HomepageContent> {
  const current = await getHomepageContent();
  const next: HomepageContent = {
    ...current,
    ...patch,
    featuredProductIds:
      patch.featuredProductIds && Array.isArray(patch.featuredProductIds)
        ? patch.featuredProductIds
        : current.featuredProductIds,
  };
  if (isDbConfigured()) {
    try {
      await saveHomepageNeon(next);
      return next;
    } catch (e) {
      console.warn('[homepage-content] neon write failed, using file fallback:', e);
    }
  }
  saveHomepageFile(next);
  return next;
}

// ----------------------------------------------------------------------------
// Static pages (About, FAQ, Shipping & Returns, Privacy Policy, ...).
// Each page has a fixed slug; content falls back to a sensible default until
// the admin edits it. Body is plain text (line breaks preserved on render) —
// never raw HTML, so the admin cannot inject markup/layout/code.
// ----------------------------------------------------------------------------

export type PageContent = {
  slug: string;
  title: string;
  body: string;
  updatedAt: number;
};

export const DEFAULT_PAGES: Record<string, { title: string; body: string }> = {
  about: {
    title: 'About Us',
    body:
      'GHIM is a high-end Middle Eastern fragrance house crafting scents for the hours between dusk and dawn.\n\nOur compositions blend rare oud, luminous florals and gourmand accords into luxurious, long-lasting perfumes — composed with care, presented like a gift.',
  },
  faq: {
    title: 'Frequently Asked Questions',
    body:
      'How long do GHIM perfumes last?\nOur Extrait and Eau de Parfum concentrations typically last 8+ hours on skin and longer on clothing.\n\nDo you ship across Egypt?\nYes — orders are delivered in 2–5 business days nationwide.\n\nCan I return a bottle?\nIf your bottle arrives damaged, contact us within 48 hours with a photo and we will ship a replacement free of charge.',
  },
  'shipping-returns': {
    title: 'Shipping & Returns',
    body:
      'Shipping\nOrders are dispatched within 24 hours and delivered in 2–5 business days across Egypt. Enjoy free shipping on bundle offers.\n\nReturns & Damages\nIf your bottle arrives damaged or broken, snap a photo within 48 hours and we will ship a replacement free of charge. For other concerns, reach out to our team and we will make it right.',
  },
  privacy: {
    title: 'Privacy Policy',
    body:
      'We respect your privacy. Information you provide (such as your name, email and phone when placing an order) is used solely to process and fulfil your order and to provide customer support.\n\nWe do not sell your personal data. Payment details are handled by our secure payment partners and are never stored on our servers.',
  },
};

export const PAGE_SLUGS = Object.keys(DEFAULT_PAGES);

const PAGE_DEMO_FILE = path.join(DEMO_DIR, 'page-content.json');

type PageFile = Record<string, { title: string; body: string; updatedAt: number }>;

function loadPagesFile(): PageFile {
  try {
    const raw = readFileSync(PAGE_DEMO_FILE, 'utf8');
    const parsed = JSON.parse(raw) as PageFile;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function savePagesFile(data: PageFile): void {
  try {
    mkdirSync(DEMO_DIR, { recursive: true });
    writeFileSync(PAGE_DEMO_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('[page-content] persist failed:', e);
  }
}

async function ensurePagesTable(): Promise<void> {
  const sql = getNeon();
  await sql`
    CREATE TABLE IF NOT EXISTS page_content (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      updated_at BIGINT NOT NULL DEFAULT 0
    );
  `;
}

function defaultPage(slug: string): PageContent | null {
  const d = DEFAULT_PAGES[slug];
  if (!d) return null;
  return { slug, title: d.title, body: d.body, updatedAt: 0 };
}

export async function getPageContent(slug: string): Promise<PageContent | null> {
  if (!DEFAULT_PAGES[slug]) return null;
  if (isDbConfigured()) {
    try {
      const sql = getNeon();
      await ensurePagesTable();
      const rows = (await sql`SELECT * FROM page_content WHERE slug = ${slug} LIMIT 1`) as unknown[];
      if (rows.length > 0) {
        const row = rows[0] as Record<string, unknown>;
        const d = DEFAULT_PAGES[slug];
        return {
          slug,
          title: String(row.title || d.title),
          body: String(row.body || d.body),
          updatedAt: Number(row.updated_at ?? 0),
        };
      }
      return defaultPage(slug);
    } catch (e) {
      console.warn('[page-content] neon read failed, using file fallback:', e);
    }
  }
  const file = loadPagesFile();
  const row = file[slug];
  if (row) {
    const d = DEFAULT_PAGES[slug];
    return {
      slug,
      title: row.title || d.title,
      body: row.body || d.body,
      updatedAt: Number(row.updatedAt ?? 0),
    };
  }
  return defaultPage(slug);
}

export async function listPages(): Promise<PageContent[]> {
  const pages = await Promise.all(PAGE_SLUGS.map((s) => getPageContent(s)));
  return pages.filter((p): p is PageContent => p !== null);
}

export async function updatePageContent(
  slug: string,
  patch: { title?: string; body?: string },
): Promise<PageContent | null> {
  if (!DEFAULT_PAGES[slug]) return null;
  const current = (await getPageContent(slug)) ?? defaultPage(slug)!;
  const next: PageContent = {
    ...current,
    title: patch.title !== undefined ? patch.title : current.title,
    body: patch.body !== undefined ? patch.body : current.body,
    updatedAt: Date.now(),
  };
  if (isDbConfigured()) {
    try {
      const sql = getNeon();
      await ensurePagesTable();
      await sql`
        INSERT INTO page_content (slug, title, body, updated_at)
        VALUES (${slug}, ${next.title}, ${next.body}, ${next.updatedAt})
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          body = EXCLUDED.body,
          updated_at = EXCLUDED.updated_at
      `;
      return next;
    } catch (e) {
      console.warn('[page-content] neon write failed, using file fallback:', e);
    }
  }
  const file = loadPagesFile();
  file[slug] = {
    title: next.title,
    body: next.body,
    updatedAt: next.updatedAt,
  };
  savePagesFile(file);
  return next;
}
