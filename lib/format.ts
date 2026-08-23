import { SHIPPING_POLICY } from './mock-data';
import type { ShippingPolicy } from './types';

export const formatPrice = (value: number, currency = 'EGP') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);

export function getShippingPolicy(): ShippingPolicy {
  return SHIPPING_POLICY;
}
