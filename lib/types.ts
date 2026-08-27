export type PerfumeNoteGroup = {
  top: string[];
  middle: string[];
  base: string[];
};

export type ProductMedia = {
  url: string;
  path: string;
  alt: string;
  order: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  images: ProductMedia[];
  /** Optional plain/studio shot shown on card hover. Falls back to images[0] when absent. */
  hoverImage?: ProductMedia;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  stock: number;
  concentration: string;
  size: string;
  inspiredBy: string | null;
  inspiredByRetail: number | null;
  notes: PerfumeNoteGroup;
  vibe: string;
  performance: string;
  bestFor: string;
  featured?: boolean;
};

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  image: string;
  size: string;
  qty: number;
};

export type GiftNote = {
  enabled: boolean;
  message: string;
};

export type ShippingPolicy = {
  bundleOffer: string;
  deliveryTime: string;
  paymentOptions: string[];
  damageGuarantee: string;
};

export type StockStatus = 'in' | 'low' | 'out';

export type OrderStatus = 'pending' | 'confirmed' | 'delivered';

export type OrderAddress = {
  fullName: string;
  phone: string;
  /** Canonical English governorate name (one of GOVERNORATES). */
  governorate: string;
  /** Arabic label for the selected governorate, for bilingual display. */
  governorateAr?: string;
  addressLine: string;
  detailedAddress?: string;
  postalCode?: string;
  /** Customer email, collected for order updates (optional). */
  email?: string;
  /** Country/region; the store ships within Egypt by default. */
  country?: string;
  /** City or district. */
  city?: string;
  /** Apartment, suite, building, floor, or landmark. */
  apartment?: string;
  notes?: string;
};

export type OrderItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  qty: number;
  size: string;
  image: string;
};

export type Order = {
  id: string;
  items: OrderItem[];
  address: OrderAddress;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentMethod: string;
  /** ISO timestamp string as stored in the database. */
  createdAt: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  stock: number;
  stockStatus: StockStatus;
  concentration: string;
  size: string;
  category: 'her' | 'him' | 'unisex';
  tag: string;
  inspiredBy: string | null;
  inspiredByRetail: number | null;
  images: ProductMedia[];
  /** Optional plain/studio shot shown on card hover. Falls back to images[0] when absent. */
  hoverImage?: ProductMedia;
  notes: PerfumeNoteGroup;
  vibe: string;
  performance: string;
  bestFor: string;
  createdAt: number;
  updatedAt: number;
};
