import { Panel } from '@/components/admin/ui';
import { isDbConfigured } from '@/lib/db/neon';
import SiteSettingsForm from '@/components/admin/SiteSettingsForm';

export const metadata = { title: 'Settings' };

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudApiKey = process.env.CLOUDINARY_API_KEY;
const cloudSecret = process.env.CLOUDINARY_API_SECRET;
const dbUrl = process.env.DATABASE_URL;

export default function SettingsPage() {
  const dbReady = isDbConfigured();
  const cloudReady = Boolean(cloudName && cloudApiKey && cloudSecret);

  const statuses = [
    {
      label: 'Neon Postgres (products + customers)',
      ok: dbReady,
      detail: dbReady
        ? 'DATABASE_URL detected — products persist in Postgres'
        : 'Not configured — product data is stored in memory (demo mode)',
    },
    {
      label: 'Cloudinary (image storage)',
      ok: cloudReady,
      detail: cloudReady
        ? 'CLOUDINARY_* keys detected'
        : 'Not configured — uploads will fail',
    },
  ];

  return (
    <div className="space-y-5">
      <Panel title="Connection status">
        <ul className="divide-y divide-outline-variant/40">
          {statuses.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-on-surface">{s.label}</p>
                <p className="text-xs text-on-surface-variant">{s.detail}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  s.ok
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-amber-500/15 text-amber-300'
                }`}
              >
                {s.ok ? 'Connected' : 'Not configured'}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Go live">
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-on-surface-variant">
          <li>
            Add <code className="text-secondary">DATABASE_URL</code> (Neon
            Postgres) to <code className="text-secondary">.env.local</code>.
          </li>
          <li>
            Add <code className="text-secondary">CLOUDINARY_CLOUD_NAME</code>,{' '}
            <code className="text-secondary">CLOUDINARY_API_KEY</code>, and{' '}
            <code className="text-secondary">CLOUDINARY_API_SECRET</code>.
          </li>
          <li>
            Restart <code className="text-secondary">npm run dev</code>. Product
            images upload to Cloudinary and product data (price, stock, notes)
            is stored in Neon — no Firebase / Blaze billing required.
          </li>
        </ol>
      </Panel>

      <SiteSettingsForm />
    </div>
  );
}
