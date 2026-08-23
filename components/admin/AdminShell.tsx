'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from './ui';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/collections', label: 'Collections' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/settings', label: 'Settings' },
];

const TITLES: Array<[RegExp, string]> = [
  [/^\/admin\/products\/new/, 'New Product'],
  [/^\/admin\/products\/.+\/edit/, 'Edit Product'],
  [/^\/admin\/products/, 'Products'],
  [/^\/admin\/collections/, 'Collections'],
  [/^\/admin\/orders/, 'Orders'],
  [/^\/admin\/settings/, 'Settings'],
  [/^\/admin$/, 'Dashboard'],
];

export function AdminShell({
  admin,
  children,
}: {
  admin: { uid: string; email: string; demo: boolean };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const title =
    TITLES.find(([re]) => re.test(pathname))?.[1] ?? 'Admin';

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-surface text-on-surface">
      <aside
        className={cn(
          'sticky top-0 flex h-screen shrink-0 flex-col border-r border-outline-variant/60 bg-surface-container-low transition-all duration-200',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-outline-variant/40 px-4">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-2 text-left"
            aria-label="Toggle sidebar"
          >
            <span className="font-headline-md text-xl font-bold tracking-tight text-secondary">
              GHIM
            </span>
            {!collapsed && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-primary uppercase">
                Admin
              </span>
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  collapsed && 'justify-center px-0',
                  active
                    ? 'bg-primary/15 font-medium text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
                )}
              >
                <span
                  className={cn(
                    'size-2 rounded-full',
                    active ? 'bg-primary' : 'bg-outline-variant',
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-outline-variant/40 p-3 text-xs text-on-surface-variant">
          {!collapsed && (
            <div className="space-y-0.5 px-1">
              <p className="truncate font-medium text-on-surface">{admin.email}</p>
              <p>{admin.demo ? 'Demo mode' : 'Live · Firebase'}</p>
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-outline-variant/40 bg-surface/90 px-6 backdrop-blur">
          <h1 className="font-headline-md text-xl font-semibold">{title}</h1>
          <div className="flex items-center gap-3">
            {admin.demo && (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-amber-300 uppercase">
                Demo
              </span>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface-variant transition-colors hover:border-error/50 hover:text-error"
            >
              Log out
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}