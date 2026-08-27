import type { Product, ShippingPolicy } from './types';

const img = (seed: string, w = 900, h = 1120) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const SHIPPING_POLICY: ShippingPolicy = {
  bundleOffer: 'Buy 2 perfumes and get 30% off your order + FREE shipping, all day, every day.',
  deliveryTime: 'Orders are dispatched within 24 hours and delivered in 2–5 business days across Egypt.',
  paymentOptions: ['Cash on Delivery', 'Visa', 'Mastercard', 'Apple Pay', 'Amex', 'InstaPay'],
  damageGuarantee: 'If your bottle arrives damaged or broken, snap a photo within 48 hours and we will ship a replacement free of charge.',
};

export const MOCK_PRODUCTS = ([
  {
    id: 'cloud-marshmallow',
    slug: 'cloud-marshmallow',
    name: 'Cloud Marshmallow',
    category: 'her',
    tagline: 'Smells like the most expensive dessert you\u2019ve ever had.',
    description:
      'A plush, gourmand cloud of whipped marshmallow wrapped in warm cashmere and golden amber. It opens airy and sweet, then melts into a creamy, skin-close hug that lasts all night long. Our take on a true viral favorite \u2014 built for the girls who want dessert to wear, not just to eat.',
    images: [
      { src: img('cloud-marshmallow-1'), alt: 'Cloud Marshmallow bottle front' },
      { src: img('cloud-marshmallow-2'), alt: 'Cloud Marshmallow bottle back' },
      { src: img('cloud-marshmallow-3'), alt: 'Cloud Marshmallow layering shot' },
      { src: img('cloud-marshmallow-4'), alt: 'Cloud Marshmallow in hand' },
    ],
    price: 2750,
    compareAtPrice: 3400,
    currency: 'EGP',
    stock: 8,
    concentration: 'Extrait de Parfum',
    size: '50 ml / 1.7 FL.OZ.',
    inspiredBy: 'Boujee Marshmallow 81',
    inspiredByRetail: 13550,
    notes: {
      top: ['Candied Pear', 'Coconut', 'Pink Pepper'],
      middle: ['Whipped Marshmallow', 'Cashmere Wood', 'Iris'],
      base: ['Golden Amber', 'White Musk', 'Sandalwood'],
    },
    vibe: 'Sweet, gourmand, cozy \u2014 pure dessert energy',
    performance: '8+ hours on skin, strong sillage that lingers on clothes',
    bestFor: 'Date nights, cold days, and all-day wear',
    featured: true,
  },
  {
    id: 'luna-aurea',
    slug: 'luna-aurea',
    name: 'Luna Aurea',
    category: 'her',
    tagline: 'Golden moonlight wrapped in white amber and night jasmine.',
    description:
      'A luminous oriental floral that glows on the skin like a full moon. Creamy white amber, narcotic jasmine and a whisper of vanilla build slowly from the office through dinner, blooming brighter the longer you wear it.',
    images: [
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7s9lMZAO2c7zjAIQVITZ_AKBSuudZq-tZ87G5zLUTjhwMxtSpVm5TBw5hZEhxyiuEUHalVO6dyCf_upfZjepZxF4MiIR7ShNorXUeCgWRtcXXytPBrtCoZS5mLBgQr1y_r4sks7uXygjc7TpCElimeFm-ZtbYpKuP9v5RqlJiFBg6u1okVC9a_UT6yuj0DjHUHSH0ehwnDsG7b5ZTq9CPmL6DaUV0HU8lwL7Z806vCXXuMeMvyC0', alt: 'Luna Aurea bottle against a purple night sky' },
      { src: img('luna-aurea-2'), alt: 'Luna Aurea bottle back' },
      { src: img('luna-aurea-3'), alt: 'Luna Aurea layering shot' },
      { src: img('luna-aurea-4'), alt: 'Luna Aurea in hand' },
    ],
    price: 2450,
    compareAtPrice: null,
    currency: 'EGP',
    stock: 24,
    concentration: 'Eau de Parfum',
    size: '100 ml / 3.4 FL.OZ.',
    inspiredBy: null,
    inspiredByRetail: null,
    notes: {
      top: ['Bergamot', 'Pear Blossom'],
      middle: ['Night Jasmine', 'Orange Blossom', 'White Amber'],
      base: ['Vanilla', 'Creamy Musk'],
    },
    vibe: 'Elegant, creamy, soft-luminous',
    performance: '6–8 hours, medium sillage',
    bestFor: 'Office, evenings out, year-round',
    featured: true,
  },
  {
    id: 'oud-noir',
    slug: 'oud-noir',
    name: 'Oud Noir',
    category: 'him',
    tagline: 'Smoky Cambodian oud that stays smooth, never heavy.',
    description:
      'The first oud you can wear without it wearing you. Smoked Cambodian oud meets black pepper and supple leather over a dry amber base \u2014 deep, brooding and impossibly refined.',
    images: [
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeTGyKCcZ5V8HpOIPPhzzL-MQoYQTAItnnRe8neqpiXFu6v1rhCoA05PNVv30BlrCbXSy4qM0s4zGWnf_0WWPUvUMljDVvD9jeuHZQt1O3WlfvwRuFw_dbLVCUIwAIFsu_F4EIdQRB1ivme8jtiGuK99yn-B5dNfRG1JRWTUk0rfdQJ-wy0QZDjXZrOnQqZaCKEF8yBVQbQZgXp2Zq-sADym9UoKSMFbA3ZaU0VxeJH3YT36rOR0c', alt: 'Oud Noir sleek dark bottle' },
      { src: img('oud-noir-2'), alt: 'Oud Noir bottle back' },
      { src: img('oud-noir-3'), alt: 'Oud Noir layering shot' },
      { src: img('oud-noir-4'), alt: 'Oud Noir in hand' },
    ],
    price: 3100,
    compareAtPrice: 3600,
    currency: 'EGP',
    stock: 0,
    concentration: 'Extrait de Parfum',
    size: '100 ml / 3.4 FL.OZ.',
    inspiredBy: null,
    inspiredByRetail: null,
    notes: {
      top: ['Black Pepper', 'Saffron'],
      middle: ['Cambodian Oud', 'Leather'],
      base: ['Vetiver', 'Dark Amber'],
    },
    vibe: 'Smoky, mysterious, commanding',
    performance: '10+ hours, strong projection',
    bestFor: 'Nights, cool weather, statement moments',
    featured: true,
  },
  {
    id: 'desert-rose',
    slug: 'desert-rose',
    name: 'Desert Rose',
    category: 'unisex',
    tagline: 'Damask rose warmed by oud and cardamom.',
    description:
      'A rose for the desert \u2014 heady Damask rose balanced by earthy oud and a spark of cardamom. Romantic without being soft, floral without being shy.',
    images: [
      { src: img('desert-rose-1'), alt: 'Desert Rose bottle front' },
      { src: img('desert-rose-2'), alt: 'Desert Rose bottle back' },
      { src: img('desert-rose-3'), alt: 'Desert Rose layering shot' },
      { src: img('desert-rose-4'), alt: 'Desert Rose in hand' },
    ],
    price: 2300,
    compareAtPrice: null,
    currency: 'EGP',
    stock: 15,
    concentration: 'Eau de Parfum',
    size: '75 ml / 2.5 FL.OZ.',
    inspiredBy: null,
    inspiredByRetail: null,
    notes: {
      top: ['Cardamom', 'Pink Pepper'],
      middle: ['Damask Rose', 'Geranium'],
      base: ['Oud', 'Warm Musk'],
    },
    vibe: 'Romantic, spicy, confident',
    performance: '7–9 hours, medium-strong sillage',
    bestFor: 'Romantic evenings, special occasions',
    featured: false,
  },
] as unknown as Product[]);

export const NOTES_PYRAMID_IMAGE = {
  src: 'https://picsum.photos/seed/ghim-notes-pyramid/1200/420',
  alt: 'Cloud Marshmallow perfume notes pyramid: top, heart and base notes',
};

export const SOCIAL_PROOF_IMAGES = [
  { src: img('ghim-review-1', 420, 760), alt: 'Instagram DM review of Cloud Marshmallow' },
  { src: img('ghim-review-2', 420, 760), alt: 'WhatsApp review of Cloud Marshmallow' },
  { src: img('ghim-review-3', 420, 760), alt: 'TikTok comment thread about Cloud Marshmallow' },
  { src: img('ghim-review-4', 420, 760), alt: 'Instagram story mention of Cloud Marshmallow' },
  { src: img('ghim-review-5', 420, 760), alt: 'DM exchange about Cloud Marshmallow sillage' },
];

export const BRAND = {
  logo: 'https://res.cloudinary.com/mu86dj4y/image/upload/f_auto,q_auto/ghim_logo_transparent',
  heroBackground:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBO9Nu8VpwU7vnc7fxP_eJUN4i8BaYjyPz67M8yUnfYeA6XC1BT7N_bnLc2CPwp3gbfYQOMpOrgwYTK3rH4y47kJYiNGAmaLEu_OIEY8Qh9I99fz9SDK8OQYN4TWCXmFv0mPWHUuknVZX1Xn5FMsBm01wMWadp7_cKUvuzGn_nG7XHOD-K07-x6N-uH4RoEm9x-Tq296Q_sp2EeYmSEZvBPtxYq7Zc8bED71gWLwXDVCqc0-0yVGRE',
  herImage:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCqJWw6jB8Eev5cgZG_H-8NFysZMwdNe7rtl8OHaMqJBXnnDTqdY2Vv8CPyAanCx-OpggFfVkW6r3oKE0r-17R1bdOAJihYT2zqNGedQUXWFAcmfVXC81mmONsJSpAEjD1KYCoUgKASCcRMT5Ak8knPueLUwBQRKSZ5cPbydo0cZIxaiACovseSAyUx7WivhxMwO5n-bll9P4qBYECII0kM_KNS6nKp8_Zs8ufHAq41EGhzoL0LiwI',
  himImage:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA7s9lMZAO2c7zjAIQVITZ_AKBSuudZq-tZ87G5zLUTjhwMxtSpVm5TBw5hZEhxyiuEUHalVO6dyCf_upfZjepZxF4MiIR7ShNorXUeCgWRtcXXytPBrtCoZS5mLBgQr1y_r4sks7uXygjc7TpCElimeFm-ZtbYpKuP9v5RqlJiFBg6u1okVC9a_UT6yuj0DjHUHSH0ehwnDsG7b5ZTq9CPmL6DaUV0HU8lwL7Z806vCXXuMeMvyC0',
};

export const REVIEWS = [
  {
    text: '"Luna Aurea is nothing short of a masterpiece. It lingers beautifully, evolving throughout the evening. Pure luxury in a bottle."',
    author: 'Fatima A.',
  },
  {
    text: '"The presentation alone is an experience. The scent is complex, dark, and incredibly sophisticated."',
    author: 'Omar K.',
  },
  {
    text: '"Oud Noir is the first oud I have worn that doesn\u2019t feel heavy. Deep but completely wearable — it got me three compliments in one night."',
    author: 'Karim M.',
  },
  {
    text: '"Cloud Marshmallow smells exactly like its name. Soft, sweet, and it stays on my scarf for days."',
    author: 'Nour S.',
  },
  {
    text: '"The packaging feels like a gift even before you open it. Velvety, dark, luxurious. Worth every pound."',
    author: 'Yasmin E.',
  },
];