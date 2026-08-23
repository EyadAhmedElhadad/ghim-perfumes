'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Field, Input, Spinner } from '@/components/admin/ui';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin/products';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleDemoLogin() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Demo login failed');
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Login failed');
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface px-6 py-16 text-on-surface">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-headline-md text-3xl font-bold tracking-tight text-secondary">
            GHIM
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">Admin access</p>
        </div>

        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-6">
          {error && (
            <p className="mb-4 rounded-lg bg-error-container/60 px-3 py-2 text-sm text-on-error-container">
              {error}
            </p>
          )}

          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <Field label="Email">
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ghim.com"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Spinner /> : null}
              Sign in
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="h-px flex-1 bg-outline-variant/60" />
            or
            <span className="h-px flex-1 bg-outline-variant/60" />
          </div>

          <Button onClick={handleDemoLogin} variant="ghost" className="w-full" disabled={busy}>
            {busy ? <Spinner /> : null}
            Enter demo admin
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-on-surface-variant">
          <a href="/" className="underline hover:text-primary">
            Back to store
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
