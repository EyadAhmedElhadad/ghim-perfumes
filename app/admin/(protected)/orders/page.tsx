import { Panel } from '@/components/admin/ui';

export const metadata = { title: 'Orders' };

export default function OrdersPage() {
  return (
    <div className="space-y-5">
      <Panel title="Orders">
        <div className="py-10 text-center">
          <p className="text-4xl">📦</p>
          <p className="mt-3 font-headline-md text-lg font-semibold text-on-surface">
            No orders yet
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-on-surface-variant">
            Storefront checkout is not wired to a backend yet. Once an orders
            collection is connected, fulfilled, pending and cancelled orders
            will appear here.
          </p>
        </div>
      </Panel>
    </div>
  );
}