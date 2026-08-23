import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/db/auth';
import { AdminShell } from '@/components/admin/AdminShell';
import { ToastProvider } from '@/components/admin/ui';

export const metadata = { title: 'Admin' };

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  return (
    <ToastProvider>
      <AdminShell admin={admin}>{children}</AdminShell>
    </ToastProvider>
  );
}