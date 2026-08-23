import 'server-only';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { getNeon, isDbConfigured } from './db/neon';
import { BRAND } from './mock-data';

// ----------------------------------------------------------------------------
// Homepage "For Her" / "For Him" collection card images.
//
// NOTE: This project does NOT use Firebase/Firestore. It uses Neon Postgres
// when DATABASE_URL is configured, otherwise a local file-backed demo store.
// We model the requested Firestore shape (collection "homepageCollections",
// docs "her"/"him" with an `imageUrl` field) on the existing data layer so the
// capability — edit these two images from the admin dashboard and persist them
// — is fully satisfied without breaking the current stack.
// ----------------------------------------------------------------------------

export type CollectionKey = 'her' | 'him';
export type CollectionImages = Record<CollectionKey, string>;

const DEMO_DIR = path.join(process.cwd(), 'data');
const DEMO_FILE = path.join(DEMO_DIR, 'homepage-collections.json');

const seed: CollectionImages = {
  her: BRAND.herImage,
  him: BRAND.himImage,
};

// ---- file-backed (demo / local-dev) ----
function loadFile(): CollectionImages {
  try {
    const raw = readFileSync(DEMO_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<CollectionImages>;
    return { her: parsed.her ?? seed.her, him: parsed.him ?? seed.him };
  } catch {
    return { ...seed };
  }
}

function saveFile(data: CollectionImages): void {
  try {
    mkdirSync(DEMO_DIR, { recursive: true });
    writeFileSync(DEMO_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('[homepage-collections] persist failed:', e);
  }
}

// ---- Neon Postgres (when DATABASE_URL configured) ----
async function ensureTable(): Promise<void> {
  const sql = getNeon();
  await sql`
    CREATE TABLE IF NOT EXISTS homepage_collections (
      key TEXT PRIMARY KEY,
      image_url TEXT NOT NULL DEFAULT ''
    );
  `;
}

async function loadNeon(): Promise<CollectionImages> {
  const sql = getNeon();
  await ensureTable();
  const rows = (await sql`SELECT key, image_url FROM homepage_collections`) as unknown[];
  const map = new Map<string, string>();
  for (const r of rows as { key: string; image_url: string }[]) {
    map.set(r.key, r.image_url);
  }
  return {
    her: map.get('her') || seed.her,
    him: map.get('him') || seed.him,
  };
}

async function saveNeon(key: CollectionKey, imageUrl: string): Promise<void> {
  const sql = getNeon();
  await ensureTable();
  await sql`
    INSERT INTO homepage_collections (key, image_url)
    VALUES (${key}, ${imageUrl})
    ON CONFLICT (key) DO UPDATE SET image_url = EXCLUDED.image_url
  `;
}

export async function getCollectionImages(): Promise<CollectionImages> {
  if (isDbConfigured()) {
    try {
      return await loadNeon();
    } catch (e) {
      console.warn(
        '[homepage-collections] neon read failed, using file fallback:',
        e,
      );
    }
  }
  return loadFile();
}

export async function updateCollectionImage(
  key: CollectionKey,
  imageUrl: string,
): Promise<CollectionImages> {
  const current = await getCollectionImages();
  const next: CollectionImages = { ...current, [key]: imageUrl };
  if (isDbConfigured()) {
    try {
      await saveNeon(key, imageUrl);
      return next;
    } catch (e) {
      console.warn(
        '[homepage-collections] neon write failed, using file fallback:',
        e,
      );
    }
  }
  saveFile(next);
  return next;
}
