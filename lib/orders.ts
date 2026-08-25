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
  created_at: string;
};

export type NewOrderInput = {
  items: OrderItem[];
  address: OrderAddress;
  subtotal: number;
  shipping: number;
  total: number;
  currency?: string;
  paymentMethod: string;
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
  if (input.paymentMethod !== 'Cash on Delivery') {
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
}

export async function createOrder(input: NewOrderInput): Promise<Order> {
  assertValid(input);

  const governorate = input.address.governorate as Governorate;
  const address: OrderAddress = {
    ...input.address,
    governorate,
    governorateAr: GOVERNORATES_AR[governorate],
  };

  const order: Order = {
    id: randomUUID(),
    items: input.items,
    address,
    subtotal: input.subtotal,
    shipping: input.shipping,
    total: input.total,
    currency: input.currency || 'EGP',
    status: 'pending',
    paymentMethod: input.paymentMethod,
    createdAt: new Date().toISOString(),
  };

  const pool = getPool();
  await ensureOrdersTable();
  await pool.query(
    `INSERT INTO orders
       (id, items, address, governorate, subtotal, shipping, total, currency, status, payment_method, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
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
      order.createdAt,
    ],
  );
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
     RETURNING id, items, address, governorate, subtotal, shipping, total, currency, status, payment_method, created_at`,
    [id, status],
  );
  if (res.rows.length === 0) return null;
  return rowToOrder(res.rows[0]);
}

export async function listOrders(limit = 100): Promise<Order[]> {
  const pool = getPool();
  await ensureOrdersTable();
  const res = await pool.query<DbOrderRow>(
    `SELECT id, items, address, governorate, subtotal, shipping, total, currency, status, payment_method, created_at
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
    `SELECT id, items, address, governorate, subtotal, shipping, total, currency, status, payment_method, created_at
     FROM orders WHERE id = $1`,
    [id],
  );
  if (res.rows.length === 0) return null;
  return rowToOrder(res.rows[0]);
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
  };
}
