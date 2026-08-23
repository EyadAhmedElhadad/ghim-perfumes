// Safe to import from client components (no 'server-only'). Reads only env.
export function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.startsWith('postgresql://'));
}
