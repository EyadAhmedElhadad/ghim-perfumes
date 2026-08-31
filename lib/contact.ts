// Client-safe store contact configuration.
//
// The store WhatsApp number is supplied via NEXT_PUBLIC_WHATSAPP_NUMBER
// (digits only, with or without country code, e.g. 201000000000). It is read
// at build time so the checkout flow can hand orders off to WhatsApp.

// Store WhatsApp number (international format, Egypt = 20 + national number).
// Read from NEXT_PUBLIC_WHATSAPP_NUMBER when set; fall back to the store's
// number so the handoff works even if the env var isn't loaded at build time.
const CONFIGURED_WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '')
  .replace(/[^\d]/g, '');

export const WHATSAPP_NUMBER = CONFIGURED_WHATSAPP || '201004692513';

export type WhatsAppOrderInput = {
  id: string;
  customerName: string;
  phone: string;
  governorate: string;
  addressLine: string;
  items: { name: string; qty: number; price: number; size?: string }[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  discountCode?: string | null;
  discountAmount?: number;
  bundleDiscountAmount?: number;
  bundleDiscountPercentage?: number;
};

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatOrderMessage(o: WhatsAppOrderInput): string {
  const lines: string[] = [];
  lines.push('*New order — GHIM.FRAGRANCES*');
  lines.push(`Order #: ${o.id}`);
  lines.push(`Name: ${o.customerName}`);
  lines.push(`Phone: ${o.phone}`);
  lines.push(`Governorate + Address: ${o.governorate}, ${o.addressLine}`);
  lines.push('');
  lines.push('*Items:*');
  for (const it of o.items) {
    const lineTotal = it.price * it.qty;
    lines.push(
      `- ${it.name}${it.size ? ` (${it.size})` : ''} × ${it.qty} — ${formatMoney(
        it.price,
        o.currency,
      )} each = ${formatMoney(lineTotal, o.currency)}`,
    );
  }
  lines.push('');
  lines.push(`Subtotal: ${formatMoney(o.subtotal, o.currency)}`);
  if (o.bundleDiscountAmount && o.bundleDiscountAmount > 0) {
    lines.push(`Bundle Discount (${o.bundleDiscountPercentage ?? 30}%): -${formatMoney(o.bundleDiscountAmount, o.currency)}`);
  }
  if (o.discountCode && o.discountAmount && o.discountAmount > 0) {
    lines.push(`Discount (${o.discountCode}): -${formatMoney(o.discountAmount, o.currency)}`);
  }
  if (o.shipping > 0) {
    lines.push(`Shipping: ${formatMoney(o.shipping, o.currency)}`);
  } else {
    lines.push(`Shipping: Free`);
  }
  lines.push(`Total: ${formatMoney(o.total, o.currency)}`);
  lines.push('Payment: Cash on Delivery');
  return lines.join('\n');
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
