// Creates a Neon project + database and writes the pooled connection
// string into .env.local as DATABASE_URL.
//
// Usage:
//   1. Create a Neon API key: https://console.neon.tech -> Profile -> API Keys
//   2. set NEON_API_KEY=your_key
//   3. node scripts/create-neon.mjs
//
// If you already have a Neon project, just set DATABASE_URL in .env.local
// directly and skip this script.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const API = 'https://console.neon.tech/api/v2';
const key = process.env.NEON_API_KEY;

if (!key) {
  console.error('Missing NEON_API_KEY. Create one at https://console.neon.tech (Profile -> API Keys) and run:');
  console.error('  $env:NEON_API_KEY="your_key"; node scripts/create-neon.mjs');
  process.exit(1);
}

async function main() {
  const res = await fetch(`${API}/projects`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ project: { name: 'ghim-store' } }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Neon API ${res.status}: ${text}`);
  }

  const data = await res.json();
  const uri =
    data.connection_uris?.[0]?.connection_uri ??
    data.project?.connection_uris?.[0]?.connection_uri;

  if (!uri) {
    throw new Error('Created project but could not find a connection URI in the response.');
  }

  const envPath = resolve(process.cwd(), '.env.local');
  let content = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  if (/^\s*DATABASE_URL=/m.test(content)) {
    content = content.replace(/^\s*DATABASE_URL=.*$/m, `DATABASE_URL=${uri}`);
  } else {
    content += `\n# Neon Postgres connection string (orders)\nDATABASE_URL=${uri}\n`;
  }
  writeFileSync(envPath, content);

  console.log('✅ Neon project created and DATABASE_URL written to .env.local');
  console.log(`   Project: ${data.project?.name} (${data.project?.id})`);
  console.log('   Restart the dev server, then place a test order to create the orders table.');
}

main().catch((err) => {
  console.error('❌ Failed to provision Neon:', err.message);
  process.exit(1);
});
