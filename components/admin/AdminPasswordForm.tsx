'use client';

import * as React from 'react';
import { Panel, Field, Input, Button, Spinner, useToast } from '@/components/admin/ui';

export default function AdminPasswordForm() {
  const { toast } = useToast();
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (password.length < 6) {
      toast('Password must be at least 6 characters', 'error');
      return;
    }
    if (password !== confirm) {
      toast('Passwords do not match', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      toast('Admin password updated', 'success');
      setPassword('');
      setConfirm('');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to update password', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel
      title="Admin password"
      action={
        <Button onClick={save} disabled={saving || !password}>
          {saving ? <Spinner /> : null}
          {saving ? 'Saving…' : 'Update password'}
        </Button>
      }
    >
      <p className="mb-4 text-sm text-on-surface-variant">
        Set the password used to sign in to this admin dashboard. It is stored
        securely (hashed) and takes effect immediately. If unset here, the
        site&rsquo;s <code className="text-secondary">ADMIN_PASSWORD</code>{' '}
        environment variable is used as a fallback.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" hint="At least 6 characters">
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm password">
          <Input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
      </div>
    </Panel>
  );
}
