'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-on-primary hover:bg-primary-fixed-dim',
    secondary:
      'bg-secondary-container/40 text-on-secondary-container border border-outline-variant hover:bg-secondary-container/60',
    ghost: 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
    danger: 'bg-error-container text-on-error-container hover:brightness-110',
  };
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium tracking-wide text-on-surface-variant uppercase">
        {label}
      </span>
      {children}
      {hint ? <span className="text-xs text-on-surface-variant/70">{hint}</span> : null}
    </label>
  );
}

const inputBase =
  'w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-colors focus:border-primary';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputBase, 'min-h-24 resize-y', props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(inputBase, 'appearance-none', props.className)}
    />
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5',
        className,
      )}
    >
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title ? (
            <h2 className="font-headline-md text-lg font-semibold text-on-surface">
              {title}
            </h2>
          ) : null}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

const STATUS_STYLES: Record<string, string> = {
  in: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  low: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  out: 'bg-error-container/60 text-on-error-container border-error/40',
};

export function StatusBadge({ status }: { status: string }) {
  const label = status === 'in' ? 'In stock' : status === 'low' ? 'Low' : 'Out';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        STATUS_STYLES[status] ?? 'bg-surface-container-high text-on-surface-variant',
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="font-headline-md text-lg font-semibold text-on-surface">
          {title}
        </h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-on-surface-variant">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? <Spinner /> : null}
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

type Toast = { id: number; message: string; tone: 'success' | 'error' };

const ToastContext = createContext<{
  toast: (message: string, tone?: Toast['tone']) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback(
    (message: string, tone: Toast['tone'] = 'success') => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, tone }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
    },
    [],
  );
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'rounded-lg border px-4 py-2.5 text-sm shadow-lg animate-fade-up',
              t.tone === 'success'
                ? 'border-emerald-500/40 bg-surface-container-high text-emerald-200'
                : 'border-error/40 bg-surface-container-high text-error',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}