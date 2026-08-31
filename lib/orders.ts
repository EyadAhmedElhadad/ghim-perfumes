import 'server-only';
import { randomUUID } from 'crypto';
import { getPool, ORDERS_TABLE_SQL } from './neon';
import { isGovernorate, GOVERNORATES_AR, type Governorate } from './governorates';
import type { Order, OrderAddress, OrderItem, OrderStatus } from './types';

type DbOrderRow = {
  id: string;
  items: OrderItem[];
  address: OrderAddress;
  governorate: string;
  subtotal: string;
  shipping: string;
  total: string;
  currency: string;
  status: string;
  payment_method: string;
  discount_code: string | null;
  discount_amount: string | number | null;
  bundle_discount_amount: string | number | null;
  bundle_discount_percentage: number | null;
  created_at: string;
  review_token: string | null;
};

export type NewOrderInput = {
  items: OrderItem[];
  address: OrderAddress;
  subtotal: number;
  shipping: number;
  total: number;
  currency?: string;
  paymentMethod: string;
  /** Optional discount code applied at checkout (server will re-validate) */
  discountCode?: string | null;
  /** Client-sent discount amount (ignored — server recalculates) */
  discountAmount?: number;
};

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderValidationError';
  }
}

function assertValid(input: NewOrderInput): void {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new OrderValidationError('Cart is empty.');
  }
  const a = input.address;
  if (!a?.fullName?.trim()) throw new OrderValidationError('Name is required.');
  if (!a?.phone?.trim()) throw new OrderValidationError('Phone is required.');
  if (!a?.governorate || !isGovernorate(a.governorate)) {
    throw new OrderValidationError('Please select a valid governorate.');
  }
  if (!a?.addressLine?.trim()) {
    throw new OrderValidationError('Address is required.');
  }
  if (input.paymentMethod !== 'Cash on Delivery' && input.paymentMethod !== 'COD') {
    throw new OrderValidationError(
      'Cash on Delivery is the only available payment method.',
    );
  }
  if (!Number.isFinite(input.total) || input.total < 0) {
    throw new OrderValidationError('Invalid order total.');
  }
}

export async function ensureOrdersTable(): Promise<void> {
  const pool = getPool();
  await pool.query(ORDERS_TABLE_SQL);
  // Added for the token-based customer review flow.
  await pool.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_token TEXT`,
  );
  // Discount code support — store code and amount server-side
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC NOT NULL DEFAULT 0`);
  // Bundle offer support — automatic discount when quantity threshold met
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS bundle_discount_amount NUMERIC NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS bundle_discount_percentage INTEGER NOT NULL DEFAULT 0`);
}

export async function createOrder(input: NewOrderInput): Promise<Order> {
  assertValid(input);

  const governorate = input.address.governorate as Governorate;
  const address: OrderAddress = {
    ...input.address,
    governorate,
    governorateAr: GOVERNORATES_AR[governorate],
  };

  // Server-side bundle discount — automatic when quantity threshold met
  let bundleDiscountAmount = 0;
  let bundleDiscountPercentage = 0;
  let effectiveShipping = input.shipping;
  try {
    const { getSiteSettings } = await import('./content');
    const settings = await getSiteSettings();
    const count = input.items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    const bundleEnabled = settings.bundleDiscountEnabled ?? true;
    const bundlePct = settings.bundleDiscountPercentage ?? 30;
    const bundleMin = settings.bundleMinQuantity ?? 2;
    if (bundleEnabled && count >= bundleMin) {
      bundleDiscountPercentage = bundlePct;
      bundleDiscountAmount = Math.round((input.subtotal * bundlePct) / 100 * 100) / 100;
      bundleDiscountAmount = Math.min(bundleDiscountAmount, input.subtotal);
      effectiveShipping = 0; // free shipping when bundle unlocked
    }
  } catch (e) {
    console.warn('[orders] bundle calc failed, using no bundle discount:', e);
  }

  // Server-side discount code verification — never trust client total
  let discountCode: string | null = null;
  let discountAmount = 0;
  let discountId: string | null = null;
  if (input.discountCode && input.discountCode.trim()) {
    // Lazy import to avoid circular deps
    const { applyDiscountServerSide } = await import('./discounts');
    // Validate coupon on original subtotal (before bundle) per existing behavior
    // Coupon and bundle discounts stack but total discount capped at subtotal
    const applied = await applyDiscountServerSide(input.discountCode, input.subtotal);
    discountCode = applied.discountCode;
    discountAmount = applied.discountAmount;
    discountId = applied.discountId;
  }

  // Cap combined discounts at subtotal
  const totalDiscount = Math.min(bundleDiscountAmount + discountAmount, input.subtotal);
  // Recompute total authoritatively: subtotal - totalDiscount + effectiveShipping (free if bundle)
  const authoritativeTotal = Math.max(0, Math.round((input.subtotal - totalDiscount + effectiveShipping) * 100) / 100);

  const order: Order = {
    id: randomUUID(),
    items: input.items,
    address,
    subtotal: input.subtotal,
    shipping: effectiveShipping,
    total: authoritativeTotal,
    currency: input.currency || 'EGP',
    status: 'pending',
    paymentMethod: input.paymentMethod,
    createdAt: new Date().toISOString(),
    reviewToken: '',
    discountCode,
    discountAmount,
    bundleDiscountAmount,
    bundleDiscountPercentage,
  };

  const pool = getPool();
  await ensureOrdersTable();
  await pool.query(
    `INSERT INTO orders
       (id, items, address, governorate, subtotal, shipping, total, currency, status, payment_method, discount_code, discount_amount, bundle_discount_amount, bundle_discount_percentage, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      order.id,
      JSON.stringify(order.items),
      JSON.stringify(order.address),
      order.address.governorate,
      order.subtotal,
      order.shipping,
      order.total,
      order.currency,
      order.status,
      order.paymentMethod,
      order.discountCode,
      order.discountAmount,
      order.bundleDiscountAmount,
      order.bundleDiscountPercentage,
      order.createdAt,
    ],
  );
  // Increment usage count after successful order creation
  if (discountId) {
    try {
      const { incrementDiscountUsage } = await import('./discounts');
      await incrementDiscountUsage(discountId);
    } catch (e) {
      console.warn('[orders] failed to increment discount usage:', e);
    }
  }
  return order;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order | null> {
  const pool = getPool();
  await ensureOrdersTable();
  const res = await pool.query<DbOrderRow>(
    `UPDATE orders
     SET status = $2
     WHERE id = $1
     RETURNING id, items, address, governorate, subtotal, shipping, total, currency, status, payment_method, discount_code, discount_amount, bundle_discount_amount, bundle_discount_percentage, created_at, review_token`,
    [id, status],
  );
  if (res.rows.length === 0) return null;
  const order = rowToOrder(res.rows[0]);
  // Ensure a stable review token exists once an order is touched by the admin.
  order.reviewToken = await ensureReviewToken(id);
  return order;
}

/**
 * Returns the order's existing review token, generating one if absent.
 * Idempotent: concurrent calls still yield a single stable token.
 */
export async function ensureReviewToken(orderId: string): Promise<string> {
  const pool = getPool();
  await ensureOrdersTable();
  const updated = await pool.query<{ review_token: string | null }>(
    `UPDATE orders
     SET review_token = COALESCE(review_token, $2)
     WHERE id = $1 AND review_token IS NULL
     RETURNING review_token`,
    [orderId, randomUUID()],
  );
  if (updated.rows.length > 0 && updated.rows[0].review_token) {
    return updated.rows[0].review_token;
  }
  const existing = await pool.query<{ review_token: string | null }>(
    `SELECT review_token FROM orders WHERE id = $1`,
    [orderId],
  );
  return existing.rows[0]?.review_token ?? '';
}

/** Resolves a review token to its order (id + customer name) or null. */
export async function getOrderReviewContext(
  token: string,
): Promise<{ orderId: string; customerName: string } | null> {
  const pool = getPool();
  await ensureOrdersTable();
  const res = await pool.query<{ id: string; full_name: string | null }>(
    `SELECT id, address->>'fullName' AS full_name FROM orders WHERE review_token = $1`,
    [token],
  );
  if (res.rows.length === 0) return null;
  return {
    orderId: res.rows[0].id,
    customerName: res.rows[0].full_name ?? '',
  };
}

export async function listOrders(limit = 100): Promise<Order[]> {
  const pool = getPool();
  await ensureOrdersTable();
  const res = await pool.query<DbOrderRow>(
    `SELECT id, items, address, governorate, subtotal, shipping, total, currency, status, payment_method, discount_code, discount_amount, bundle_discount_amount, bundle_discount_percentage, created_at, review_token
     FROM orders
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );
  return res.rows.map(rowToOrder);
}

export async function getOrder(id: string): Promise<Order | null> {
  const pool = getPool();
  const res = await pool.query<DbOrderRow>(
    `SELECT id, items, address, governorate, subtotal, shipping, total, currency, status, payment_method, discount_code, discount_amount, bundle_discount_amount, bundle_discount_percentage, created_at, review_token
     FROM orders WHERE id = $1`,
    [id],
  );
  if (res.rows.length === 0) return null;
  return rowToOrder(res.rows[0]);
}

export async function deleteOrder(id: string): Promise<boolean> {
  const pool = getPool();
  await ensureOrdersTable();
  const res = await pool.query('DELETE FROM orders WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

function rowToOrder(row: DbOrderRow): Order {
  return {
    id: row.id,
    items: row.items,
    address: row.address,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    currency: row.currency,
    status: (row.status as OrderStatus) ?? 'pending',
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
    reviewToken: row.review_token ?? '',
    discountCode: row.discount_code ?? null,
    discountAmount: row.discount_amount != null ? Number(row.discount_amount) : 0,
    bundleDiscountAmount: row.bundle_discount_amount != null ? Number(row.bundle_discount_amount) : 0,
    bundleDiscountPercentage: row.bundle_discount_percentage != null ? Number(row.bundle_discount_percentage) : 0,
  };
}
