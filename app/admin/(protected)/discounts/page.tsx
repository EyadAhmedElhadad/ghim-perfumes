'use client';

import { useEffect, useState } from 'react';
import { Panel, Button, Field, Input, Select, Modal, ConfirmDialog, Spinner, useToast } from '@/components/admin/ui';
import { TrashIcon, PlusIcon, TagIcon } from '@/components/icons';

type Discount = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
};

type FormState = {
  code: string;
  type: 'percentage' | 'fixed';
  value: string;
  minOrderAmount: string;
  usageLimit: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  code: '',
  type: 'percentage',
  value: '',
  minOrderAmount: '',
  usageLimit: '',
  isActive: true,
};

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/discounts', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load discounts');
      setDiscounts(data.discounts as Discount[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load discounts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(d: Discount) {
    setEditing(d);
    setForm({
      code: d.code,
      type: d.type,
      value: String(d.value),
      minOrderAmount: d.minOrderAmount ? String(d.minOrderAmount) : '',
      usageLimit: d.usageLimit != null ? String(d.usageLimit) : '',
      isActive: d.isActive,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    if (!code) return toast('Code is required', 'error');
    if (!form.value || Number(form.value) <= 0) return toast('Value must be greater than 0', 'error');
    if (form.type === 'percentage' && Number(form.value) > 100) return toast('Percentage cannot exceed 100%', 'error');

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        code,
        type: form.type,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        isActive: form.isActive,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      };

      const url = editing ? `/api/admin/discounts/${editing.id}` : '/api/admin/discounts';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save discount');

      const saved = data.discount as Discount;
      if (editing) {
        setDiscounts((prev) => prev.map((x) => (x.id === editing.id ? saved : x)));
        toast('Discount updated', 'success');
      } else {
        setDiscounts((prev) => [saved, ...prev]);
        toast('Discount created', 'success');
      }
      setShowModal(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save discount', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(d: Discount) {
    setTogglingId(d.id);
    const next = !d.isActive;
    // optimistic
    setDiscounts((prev) => prev.map((x) => (x.id === d.id ? { ...x, isActive: next } : x)));
    try {
      const res = await fetch(`/api/admin/discounts/${d.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to toggle');
      setDiscounts((prev) => prev.map((x) => (x.id === d.id ? (data.discount as Discount) : x)));
      toast(next ? 'Discount activated' : 'Discount deactivated', 'success');
    } catch (err) {
      setDiscounts((prev) => prev.map((x) => (x.id === d.id ? { ...x, isActive: d.isActive } : x)));
      toast(err instanceof Error ? err.message : 'Failed to toggle', 'error');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete');
      setDiscounts((prev) => prev.filter((x) => x.id !== id));
      toast('Discount deleted', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete', 'error');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="space-y-5">
      <Panel
        title="Discount Codes"
        action={
          <Button onClick={openCreate} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            New Code
          </Button>
        }
      >
        {error ? (
          <div className="rounded-lg border border-error/40 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
            {error}
          </div>
        ) : loading ? (
          <p className="py-10 text-center text-sm text-on-surface-variant">Loading discounts…</p>
        ) : discounts.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-4xl">🏷️</p>
            <p className="mt-3 font-headline-md text-lg font-semibold text-on-surface">No discount codes yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-on-surface-variant">
              Create a code to offer percentage or fixed-amount discounts. Codes are validated at checkout and usage is tracked automatically.
            </p>
            <Button onClick={openCreate} className="mt-4">
              Create your first code
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-outline-variant/40">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container-high text-left text-xs uppercase tracking-widest text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Type / Value</th>
                    <th className="px-4 py-3 font-medium">Usage</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {discounts.map((d) => (
                    <tr key={d.id} className="bg-surface-container-lowest transition-colors hover:bg-surface-container-low">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 font-mono text-xs font-semibold tracking-widest text-amber-300">
                          <TagIcon className="h-3 w-3" />
                          {d.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-on-surface">
                          {d.type === 'percentage' ? `${d.value}%` : `EGP ${d.value.toFixed(2)}`}
                        </span>
                        <span className="ml-2 text-xs text-on-surface-variant">
                          {d.type === 'percentage' ? 'Percentage' : 'Fixed'}
                        </span>
                        {d.minOrderAmount > 0 && (
                          <div className="text-xs text-on-surface-variant">Min: EGP {d.minOrderAmount.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {d.usageCount}
                        {d.usageLimit != null ? ` / ${d.usageLimit}` : ' / ∞'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={togglingId === d.id}
                          onClick={() => void toggleActive(d)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors disabled:opacity-50 ${
                            d.isActive ? 'border-amber-400/40 bg-amber-500/20' : 'border-outline-variant/40 bg-surface-container-high'
                          }`}
                          aria-label={d.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              d.isActive ? 'translate-x-6 bg-amber-300' : 'translate-x-1 bg-slate-400'
                            }`}
                          />
                        </button>
                        <span className={`ml-2 text-xs font-medium ${d.isActive ? 'text-emerald-300' : 'text-on-surface-variant'}`}>
                          {togglingId === d.id ? 'Saving…' : d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
                            Edit
                          </Button>
                          <button
                            type="button"
                            aria-label="Delete discount"
                            disabled={deletingId === d.id}
                            onClick={() => setConfirmDeleteId(d.id)}
                            className="rounded-full border border-outline-variant/40 bg-surface-container-high p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error disabled:opacity-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Panel>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Discount Code' : 'Create Discount Code'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Code name" hint="Auto-uppercased, 3-20 chars, letters/numbers/_-">
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="GHIM15"
              maxLength={20}
              required
              className="font-mono uppercase tracking-widest"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as FormState['type'] }))}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (EGP)</option>
              </Select>
            </Field>
            <Field label={form.type === 'percentage' ? 'Discount Value (%)' : 'Discount Value (EGP)'}>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={form.type === 'percentage' ? 100 : undefined}
                step="0.01"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder={form.type === 'percentage' ? '15' : '100'}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Minimum Order Subtotal (EGP)" hint="Optional, default 0">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={form.minOrderAmount}
                onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                placeholder="0"
              />
            </Field>
            <Field label="Usage Limit" hint="Empty = unlimited">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={form.usageLimit}
                onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                placeholder="∞"
              />
            </Field>
          </div>

          <Field label="Active / Inactive">
            <label className="flex items-center gap-3 rounded-lg border border-outline-variant/40 bg-surface-container-high px-3 py-2">
              <button
                type="button"
                role="switch"
                aria-checked={form.isActive}
                onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                  form.isActive ? 'border-emerald-400/40 bg-emerald-500/20' : 'border-outline-variant/40 bg-surface-container'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form.isActive ? 'translate-x-6 bg-emerald-300' : 'translate-x-1 bg-slate-400'
                  }`}
                />
              </button>
              <span className="text-sm text-on-surface">{form.isActive ? 'Active — code can be used' : 'Inactive — code disabled'}</span>
            </label>
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Spinner className="mr-2" /> : null}
              {editing ? 'Save changes' : 'Create code'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete discount code?"
        message="This will permanently remove the code. Customers will no longer be able to use it."
        confirmLabel="Delete"
        busy={!!deletingId}
        onConfirm={() => {
          if (confirmDeleteId) void handleDelete(confirmDeleteId);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
