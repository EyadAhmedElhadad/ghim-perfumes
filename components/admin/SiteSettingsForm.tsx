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
import { GOVERNORATES } from '@/lib/governorates';

type Settings = PublicSiteSettings;

type StringSettingKey =
  | 'brandName'
  | 'instagramUrl'
  | 'whatsappNumber'
  | 'contactEmail'
  | 'contactPhone'
  | 'footerText'
  | 'copyrightText'
  | 'seoTitle'
  | 'seoDescription';

const FIELDS: Array<{
  key: StringSettingKey;
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
    <>
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

    <Panel title="Shipping fees by governorate">
      <p className="mb-4 text-sm text-on-surface-variant">
        Set a delivery fee (EGP) per governorate. A governorate left blank uses the
        default fee below. These fees apply automatically at checkout.
      </p>

      <Field
        label="Default shipping fee (EGP)"
        hint="Used for any governorate without a specific fee"
      >
        <Input
          type="number"
          min={0}
          value={form.defaultShippingFee ?? 0}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev!,
              defaultShippingFee:
                e.target.value === '' ? 0 : Number(e.target.value),
            }))
          }
        />
      </Field>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GOVERNORATES.map((g) => (
          <Field key={g} label={g}>
            <Input
              type="number"
              min={0}
              placeholder="Default"
              value={form.shippingFees?.[g] ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                setForm((prev) => {
                  const fees = { ...prev!.shippingFees };
                  if (raw === '') delete fees[g];
                  else {
                    const n = Number(raw);
                    if (Number.isFinite(n) && n >= 0) fees[g] = n;
                  }
                  return { ...prev!, shippingFees: fees };
                });
              }}
            />
          </Field>
        ))}
      </div>
    </Panel>

    <Panel title="Bundle Offer & Cart Banner Settings">
      <p className="mb-4 text-sm text-on-surface-variant">
        Manage the automatic bundle discount and the Arabic incentive messages shown in the cart drawer and checkout when the cart quantity threshold is reached.
      </p>

      {/* Enable / Disable */}
      <Field label="Enable Bundle Offer">
        <label className="flex items-center gap-3 rounded-lg border border-outline-variant/40 bg-surface-container-high px-3 py-2.5">
          <button
            type="button"
            role="switch"
            aria-checked={form.bundleDiscountEnabled}
            onClick={() =>
              setForm((prev) => ({
                ...prev!,
                bundleDiscountEnabled: !prev!.bundleDiscountEnabled,
              }))
            }
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
              form.bundleDiscountEnabled
                ? 'border-emerald-400/40 bg-emerald-500/20'
                : 'border-outline-variant/40 bg-surface-container'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.bundleDiscountEnabled ? 'translate-x-6 bg-emerald-300' : 'translate-x-1 bg-slate-400'
              }`}
            />
          </button>
          <span className="text-sm text-on-surface">
            {form.bundleDiscountEnabled ? 'Enabled — bundle discount is active' : 'Disabled — no automatic discount'}
          </span>
        </label>
      </Field>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Bundle Discount Percentage (%)" hint="e.g. 30 for 30% off">
          <Input
            type="number"
            min={0}
            max={100}
            step={1}
            value={form.bundleDiscountPercentage ?? 30}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev!,
                bundleDiscountPercentage: e.target.value === '' ? 0 : Number(e.target.value),
              }))
            }
          />
        </Field>
        <Field label="Minimum Quantity" hint="e.g. 2 perfumes to trigger">
          <Input
            type="number"
            min={1}
            max={100}
            step={1}
            value={form.bundleMinQuantity ?? 2}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev!,
                bundleMinQuantity: e.target.value === '' ? 2 : Number(e.target.value),
              }))
            }
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4">
        <Field label="Pre-Unlock Message" hint="Shown when quantity < threshold — RTL Arabic">
          <Input
            dir="rtl"
            value={form.bundleOfferText ?? ''}
            onChange={(e) =>
              setForm((prev) => ({ ...prev!, bundleOfferText: e.target.value }))
            }
            placeholder="اطلب واحدة كمان عشان تفعل العرض"
            className="text-right"
          />
        </Field>
        <Field label="Post-Unlock Success Message" hint="Shown when discount unlocked — RTL Arabic">
          <Input
            dir="rtl"
            value={form.bundleUnlockedText ?? ''}
            onChange={(e) =>
              setForm((prev) => ({ ...prev!, bundleUnlockedText: e.target.value }))
            }
            placeholder="تم تفعيل خصم 30% + الشحن المجاني 🎉"
            className="text-right"
          />
        </Field>
      </div>

      <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-500/5 px-3 py-2.5 text-xs leading-relaxed text-on-surface-variant">
        <span className="font-medium text-amber-300">Preview: </span>
        <span dir="rtl" className="inline-block">
          {form.bundleDiscountEnabled
            ? `عند ${form.bundleMinQuantity ?? 2} قطع → ${form.bundleUnlockedText || 'تم تفعيل خصم 30% + الشحن المجاني 🎉'}`
            : 'العرض معطّل'}
        </span>
        <span className="mx-2 text-outline-variant">|</span>
        <span dir="rtl" className="inline-block">
          {form.bundleOfferText || 'اطلب واحدة كمان عشان تفعل العرض'}
        </span>
      </div>
    </Panel>
    </>
  );
}
