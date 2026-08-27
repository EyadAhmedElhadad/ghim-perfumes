'use client';

import * as React from 'react';
import Link from 'next/link';
import { Panel, Spinner, useToast } from '@/components/admin/ui';

type PageSummary = { slug: string; title: string; updatedAt: number };

export default function PagesList() {
  const { toast } = useToast();
  const [pages, setPages] = React.useState<PageSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/pages', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setPages(data.pages ?? []);
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Failed to load', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return (
    <Panel title="Static pages">
      <p className="mb-4 text-sm text-on-surface-variant">
        Edit the body copy of the storefront&rsquo;s static pages. Content is
        plain text — line breaks are preserved, but no HTML or styling can be
        added.
      </p>
      <ul className="divide-y divide-outline-variant/40">
        {pages.map((p) => (
          <li key={p.slug} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium text-on-surface">{p.title}</p>
              <p className="text-xs text-on-surface-variant">/p/{p.slug}</p>
            </div>
            <Link
              href={`/admin/pages/${p.slug}`}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-on-primary transition-colors hover:bg-primary-fixed-dim"
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
