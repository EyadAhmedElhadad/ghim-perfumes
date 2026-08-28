'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Panel,
  Field,
  Input,
  Textarea,
  Button,
  Spinner,
  useToast,
} from '@/components/admin/ui';
import { uploadProductImage } from '@/lib/upload';

type PageContent = {
  slug: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  body: string;
  updatedAt: number;
};

export default function PageEditor() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [page, setPage] = React.useState<PageContent | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

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
        body: JSON.stringify({
          title: page.title,
          subtitle: page.subtitle,
          imageUrl: page.imageUrl,
          body: page.body,
        }),
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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const media = await uploadProductImage(file, 'about');
      setPage((p) => (p ? { ...p, imageUrl: media.url } : p));
      toast('Image uploaded — save to apply', 'success');
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Upload failed',
        'error',
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
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

        <Field
          label="Subtitle / tagline"
          hint="Optional luxury accent heading shown above the title."
        >
          <Input
            value={page.subtitle}
            placeholder="e.g. Our Story"
            onChange={(e) => setPage({ ...page, subtitle: e.target.value })}
          />
        </Field>

        <Field
          label="Brand Story Image URL"
          hint="Paste an image URL, or upload one below. Shows on the left of the 2-column layout."
        >
          <Input
            value={page.imageUrl}
            placeholder="https://…"
            onChange={(e) => setPage({ ...page, imageUrl: e.target.value })}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Spinner /> : null}
            {uploading ? 'Uploading…' : 'Upload image'}
          </Button>
          {page.imageUrl ? (
            <Button
              variant="ghost"
              onClick={() => setPage({ ...page, imageUrl: '' })}
            >
              Remove image
            </Button>
          ) : null}
        </div>

        {page.imageUrl ? (
          <div className="overflow-hidden rounded-xl border border-outline-variant/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.imageUrl}
              alt="Brand story preview"
              className="h-48 w-full object-cover"
            />
          </div>
        ) : null}

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
