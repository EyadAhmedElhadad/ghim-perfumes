import 'server-only';
import { getPool } from './neon';

export type DiscountType = 'percentage' | 'fixed';

export type DiscountCode = {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minOrderAmount: number;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
};

export type DiscountInput = {
  code: string;
  type: DiscountType;
  value: number;
  minOrderAmount?: number;
  isActive?: boolean;
  usageLimit?: number | null;
};

export type DiscountUpdateInput = Partial<Omit<DiscountInput, 'code'>> & {
  code?: string;
  isActive?: boolean;
};

export type ValidateResult = {
  valid: true;
  code: DiscountCode;
  discountAmount: number;
};

export type ValidateError = {
  valid: false;
  error: string;
};

const DISCOUNT_CODES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value NUMERIC NOT NULL CHECK (value > 0),
    min_order_amount NUMERIC NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
    usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS discount_codes_code_idx ON discount_codes (code);
  CREATE INDEX IF NOT EXISTS discount_codes_active_idx ON discount_codes (is_active) WHERE is_active = true;
`;

export async function ensureDiscountCodesTable(): Promise<void> {
  const pool = getPool();
  await pool.query(DISCOUNT_CODES_TABLE_SQL);
  // Backfill for deployments that may have older columns
  await pool.query(`ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS code TEXT`);
  await pool.query(`ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS type TEXT`);
  await pool.query(`ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS value NUMERIC`);
  await pool.query(`ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`);
  await pool.query(`ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS usage_limit INTEGER`);
  await pool.query(`ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()`);
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

function rowToDiscount(row: {
  id: string;
  code: string;
  type: string;
  value: string | number;
  min_order_amount: string | number;
  is_active: boolean;
  usage_limit: number | null;
  usage_count: number | string;
  created_at: string;
}): DiscountCode {
  return {
    id: row.id,
    code: row.code,
    type: row.type as DiscountType,
    value: Number(row.value),
    minOrderAmount: Number(row.min_order_amount),
    isActive: Boolean(row.is_active),
    usageLimit: row.usage_limit != null ? Number(row.usage_limit) : null,
    usageCount: Number(row.usage_count),
    createdAt: row.created_at,
  };
}

export function calculateDiscountAmount(
  type: DiscountType,
  value: number,
  subtotal: number,
): number {
  if (subtotal <= 0) return 0;
  if (type === 'percentage') {
    const pct = Math.min(Math.max(value, 0), 100);
    const raw = (subtotal * pct) / 100;
    return Math.min(Math.round(raw * 100) / 100, subtotal);
  }
  // fixed amount EGP
  return Math.min(Math.max(value, 0), subtotal);
}

export function validateDiscountInput(input: DiscountInput | DiscountUpdateInput, isUpdate = false): string | null {
  if (!isUpdate || input.code !== undefined) {
    const code = input.code ? normalizeCode(input.code) : '';
    if (!code) return 'Code is required';
    if (code.length < 3 || code.length > 20) return 'Code must be 3-20 characters';
    if (!/^[A-Z0-9_-]+$/.test(code)) return 'Code may only contain letters, numbers, hyphen and underscore';
  }
  if (!isUpdate || input.type !== undefined) {
    if (input.type !== 'percentage' && input.type !== 'fixed') return 'Invalid discount type';
  }
  if (!isUpdate || input.value !== undefined) {
    const v = Number(input.value);
    if (!Number.isFinite(v) || v <= 0) return 'Value must be greater than 0';
    const t = input.type as DiscountType | undefined;
    if (t === 'percentage' && v > 100) return 'Percentage cannot exceed 100%';
    if (t === undefined) {
      // generic check, allow up to 100 for percentage but not know type yet; we check later
      if (v > 10000) return 'Value is too large';
    }
    if (t === 'fixed' && v > 100000) return 'Fixed amount is too large';
  }
  if (input.minOrderAmount !== undefined) {
    const m = Number(input.minOrderAmount);
    if (!Number.isFinite(m) || m < 0) return 'Minimum order amount must be 0 or more';
  }
  if (input.usageLimit !== undefined && input.usageLimit !== null) {
    const u = Number(input.usageLimit);
    if (!Number.isInteger(u) || u <= 0) return 'Usage limit must be a positive integer or empty for unlimited';
  }
  return null;
}

export async function listDiscountCodes(): Promise<DiscountCode[]> {
  const pool = getPool();
  await ensureDiscountCodesTable();
  const res = await pool.query<{
    id: string;
    code: string;
    type: string;
    value: string | number;
    min_order_amount: string | number;
    is_active: boolean;
    usage_limit: number | null;
    usage_count: number | string;
    created_at: string;
  }>(`SELECT id, code, type, value, min_order_amount, is_active, usage_limit, usage_count, created_at FROM discount_codes ORDER BY created_at DESC`);
  return res.rows.map(rowToDiscount);
}

export async function getDiscountByCode(code: string): Promise<DiscountCode | null> {
  const pool = getPool();
  await ensureDiscountCodesTable();
  const normalized = normalizeCode(code);
  const res = await pool.query<{
    id: string;
    code: string;
    type: string;
    value: string | number;
    min_order_amount: string | number;
    is_active: boolean;
    usage_limit: number | null;
    usage_count: number | string;
    created_at: string;
  }>(`SELECT id, code, type, value, min_order_amount, is_active, usage_limit, usage_count, created_at FROM discount_codes WHERE code = $1 LIMIT 1`, [normalized]);
  if (res.rows.length === 0) return null;
  return rowToDiscount(res.rows[0]);
}

export async function getDiscountById(id: string): Promise<DiscountCode | null> {
  const pool = getPool();
  await ensureDiscountCodesTable();
  const res = await pool.query<{
    id: string;
    code: string;
    type: string;
    value: string | number;
    min_order_amount: string | number;
    is_active: boolean;
    usage_limit: number | null;
    usage_count: number | string;
    created_at: string;
  }>(`SELECT id, code, type, value, min_order_amount, is_active, usage_limit, usage_count, created_at FROM discount_codes WHERE id = $1 LIMIT 1`, [id]);
  if (res.rows.length === 0) return null;
  return rowToDiscount(res.rows[0]);
}

export async function createDiscountCode(input: DiscountInput): Promise<DiscountCode> {
  const pool = getPool();
  await ensureDiscountCodesTable();
  const err = validateDiscountInput(input, false);
  if (err) throw new Error(err);
  const code = normalizeCode(input.code);
  const type = input.type;
  const value = Number(input.value);
  if (type === 'percentage' && (value <= 0 || value > 100)) throw new Error('Percentage must be between 1 and 100');
  if (type === 'fixed' && value <= 0) throw new Error('Fixed amount must be greater than 0');
  const minOrderAmount = input.minOrderAmount != null ? Number(input.minOrderAmount) : 0;
  const isActive = input.isActive ?? true;
  const usageLimit = input.usageLimit != null ? Number(input.usageLimit) : null;

  const res = await pool.query<{
    id: string;
    code: string;
    type: string;
    value: string | number;
    min_order_amount: string | number;
    is_active: boolean;
    usage_limit: number | null;
    usage_count: number | string;
    created_at: string;
  }>(
    `INSERT INTO discount_codes (code, type, value, min_order_amount, is_active, usage_limit, usage_count)
     VALUES ($1, $2, $3, $4, $5, $6, 0)
     RETURNING id, code, type, value, min_order_amount, is_active, usage_limit, usage_count, created_at`,
    [code, type, value, minOrderAmount, isActive, usageLimit],
  );
  return rowToDiscount(res.rows[0]);
}

export async function updateDiscountCode(
  id: string,
  patch: DiscountUpdateInput,
): Promise<DiscountCode | null> {
  const pool = getPool();
  await ensureDiscountCodesTable();
  const current = await getDiscountById(id);
  if (!current) return null;
  const err = validateDiscountInput(patch, true);
  if (err) throw new Error(err);

  const nextCode = patch.code !== undefined ? normalizeCode(patch.code) : current.code;
  const nextType = (patch.type ?? current.type) as DiscountType;
  const nextValue = patch.value !== undefined ? Number(patch.value) : current.value;
  const nextMin = patch.minOrderAmount !== undefined ? Number(patch.minOrderAmount) : current.minOrderAmount;
  const nextActive = patch.isActive !== undefined ? Boolean(patch.isActive) : current.isActive;
  const nextLimit = patch.usageLimit !== undefined ? (patch.usageLimit === null ? null : Number(patch.usageLimit)) : current.usageLimit;

  if (nextType === 'percentage' && (nextValue <= 0 || nextValue > 100)) throw new Error('Percentage must be between 1 and 100');
  if (nextType === 'fixed' && nextValue <= 0) throw new Error('Fixed amount must be greater than 0');

  const res = await pool.query<{
    id: string;
    code: string;
    type: string;
    value: string | number;
    min_order_amount: string | number;
    is_active: boolean;
    usage_limit: number | null;
    usage_count: number | string;
    created_at: string;
  }>(
    `UPDATE discount_codes
     SET code = $2, type = $3, value = $4, min_order_amount = $5, is_active = $6, usage_limit = $7
     WHERE id = $1
     RETURNING id, code, type, value, min_order_amount, is_active, usage_limit, usage_count, created_at`,
    [id, nextCode, nextType, nextValue, nextMin, nextActive, nextLimit],
  );
  if (res.rows.length === 0) return null;
  return rowToDiscount(res.rows[0]);
}

export async function deleteDiscountCode(id: string): Promise<boolean> {
  const pool = getPool();
  await ensureDiscountCodesTable();
  const res = await pool.query(`DELETE FROM discount_codes WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function toggleDiscountActive(id: string, isActive: boolean): Promise<DiscountCode | null> {
  return updateDiscountCode(id, { isActive });
}

export async function validateDiscountForSubtotal(
  code: string,
  subtotal: number,
): Promise<{ valid: true; discount: DiscountCode; discountAmount: number } | { valid: false; error: string }> {
  if (!code || !code.trim()) return { valid: false, error: 'Please enter a discount code' };
  if (!Number.isFinite(subtotal) || subtotal < 0) return { valid: false, error: 'Invalid subtotal' };
  const discount = await getDiscountByCode(code);
  if (!discount) return { valid: false, error: 'Invalid code' };
  if (!discount.isActive) return { valid: false, error: 'This code is inactive' };
  if (discount.usageLimit != null && discount.usageCount >= discount.usageLimit) {
    return { valid: false, error: 'This code has reached its usage limit' };
  }
  if (subtotal < discount.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum order amount of EGP ${discount.minOrderAmount.toFixed(2)} not met`,
    };
  }
  const discountAmount = calculateDiscountAmount(discount.type, discount.value, subtotal);
  if (discountAmount <= 0) return { valid: false, error: 'Discount cannot be applied to this order' };
  return { valid: true, discount, discountAmount };
}

export async function incrementDiscountUsage(id: string): Promise<void> {
  const pool = getPool();
  await ensureDiscountCodesTable();
  await pool.query(`UPDATE discount_codes SET usage_count = usage_count + 1 WHERE id = $1`, [id]);
}

// Used at order creation to verify code server-side and compute final totals safely
export async function applyDiscountServerSide(
  code: string | undefined | null,
  subtotal: number,
): Promise<{ discountCode: string | null; discountAmount: number; discountId: string | null }> {
  if (!code || !code.trim()) return { discountCode: null, discountAmount: 0, discountId: null };
  const result = await validateDiscountForSubtotal(code, subtotal);
  if (!result.valid) throw new Error(result.error);
  return {
    discountCode: result.discount.code,
    discountAmount: result.discountAmount,
    discountId: result.discount.id,
  };
}
