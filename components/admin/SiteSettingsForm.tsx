'use client';

import * as React from 'react';
import {
  Panel,
  Field,
  Input,
  Textarea,
  Button,
  Spinner,
  useToast,
} from '@/components/admin/ui';
import type { PublicSiteSettings } from '@/components/public-content';

type Settings = PublicSiteSettings;

const FIELDS: Array<{
  key: keyof Settings;
  label: string;
  hint?: string;
  textarea?: boolean;
  placeholder?: string;
}> = [
  { key: 'brandName', label: 'Brand name' },
  {
    key: 'instagramUrl',
    label: 'Instagram URL',
    placeholder: 'https://instagram.com/yourhandle',
  },
  {
    key: 'whatsappNumber',
    label: 'WhatsApp number',
    hint: 'Digits only, include country code (e.g. 201004692513)',
  },
  {
    key: 'contactEmail',
    label: 'Contact email',
    placeholder: 'hello@yourbrand.com',
  },
  {
    key: 'contactPhone',
    label: 'Contact phone',
    hint: 'Optional — shown in the footer if provided',
  },
  { key: 'footerText', label: 'Footer text', textarea: true },
  { key: 'copyrightText', label: 'Copyright line', textarea: true },
  { key: 'seoTitle', label: 'SEO site title', textarea: true },
  { key: 'seoDescription', label: 'SEO meta description', textarea: true },
];

export default function SiteSettingsForm() {
  const { toast } = useToast();
  const [initial, setInitial] = React.useState<Settings | null>(null);
  const [form, setForm] = React.useState<Settings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/settings', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !data.settings)
          throw new Error(data.error || 'Failed to load');
        setInitial(data.settings);
        setForm(data.settings);
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.settings)
        throw new Error(data.error || 'Failed to save');
      setInitial(data.settings);
      setForm(data.settings);
      toast('Site settings saved', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <Panel title="Brand & Site Settings">
        <div className="flex justify-center py-10">
          <Spinner className="text-primary" />
        </div>
      </Panel>
    );
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  return (
    <Panel
      title="Brand & Site Settings"
      action={
        <Button onClick={save} disabled={saving || !dirty}>
          {saving ? <Spinner /> : null}
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      }
    >
      <p className="mb-4 text-sm text-on-surface-variant">
        These values appear across the whole site — brand name, social links,
        contact details, footer copy and default SEO metadata.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <Field key={f.key} label={f.label} hint={f.hint}>
            {f.textarea ? (
              <Textarea
                value={form[f.key]}
                placeholder={f.placeholder}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev!, [f.key]: e.target.value }))
                }
              />
            ) : (
              <Input
                value={form[f.key]}
                placeholder={f.placeholder}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev!, [f.key]: e.target.value }))
                }
              />
            )}
          </Field>
        ))}
      </div>
    </Panel>
  );
}
