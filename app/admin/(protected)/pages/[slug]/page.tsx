'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Panel, Field, Input, Textarea, Button, Spinner, useToast } from '@/components/admin/ui';

type PageContent = { slug: string; title: string; body: string; updatedAt: number };

export default function PageEditor() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [page, setPage] = React.useState<PageContent | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/pages/${slug}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !data.page) throw new Error(data.error || 'Failed to load');
        setPage(data.page);
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Failed to load', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, toast]);

  async function save() {
    if (!page) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: page.title, body: page.body }),
      });
      const data = await res.json();
      if (!res.ok || !data.page) throw new Error(data.error || 'Failed to save');
      setPage(data.page);
      toast('Page saved', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !page) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return (
    <Panel
      title={page.title}
      action={
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.push('/admin/pages')}>
            Back
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Spinner /> : null}
            {saving ? 'Saving…' : 'Save page'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Page title">
          <Input
            value={page.title}
            onChange={(e) => setPage({ ...page, title: e.target.value })}
          />
        </Field>
        <Field label="Body copy" hint="Plain text. Use blank lines between paragraphs.">
          <Textarea
            value={page.body}
            onChange={(e) => setPage({ ...page, body: e.target.value })}
            className="min-h-64"
          />
        </Field>
        <p className="text-xs text-on-surface-variant">
          Public URL: <code className="text-secondary">/p/{page.slug}</code>
        </p>
      </div>
    </Panel>
  );
}
