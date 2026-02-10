export const AMAZON_PRODUCT_URL_PATTERN =
  /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/;

export const EBAY_ITEM_URL_PATTERN = /\/itm\/(\d+)/;

export const OVERLAY_CONTAINER_ID = 'sourcetool-overlay-root';

export const CACHE_TTL = {
  PRODUCT_DETAILS: 24 * 60 * 60 * 1000,
  PRICING: 15 * 60 * 1000,
  BSR: 60 * 60 * 1000,
  FEES: 4 * 60 * 60 * 1000,
  RESTRICTIONS: 6 * 60 * 60 * 1000,
} as const;

export const SCORE_THRESHOLDS = {
  BUY: 80,
  MAYBE: 60,
  RISKY: 40,
  PASS: 0,
} as const;

// --- Rainforest API ---

export const RAINFOREST_BASE_URL = 'https://api.rainforestapi.com/request';

export const MARKETPLACE_TO_AMAZON_DOMAIN: Record<string, string> = {
  ATVPDKIKX0DER: 'amazon.com',
  A2EUQ1WTGCTBG2: 'amazon.ca',
  A1F83G8C2ARO7P: 'amazon.co.uk',
  A1PA6795UKMFR9: 'amazon.de',
  A13V1IB3VIYZZH: 'amazon.fr',
  APJ6JRA9NG5V4: 'amazon.it',
  A1RKKUPIHCS9HS: 'amazon.es',
  A1VC38T7YXB528: 'amazon.co.jp',
  A39IBJ37TRP1C6: 'amazon.com.au',
};

// --- Amazon Fee Tables (US marketplace, all values in cents) ---

// Referral fee percentages by top-level category
export const REFERRAL_FEE_PERCENT: Record<string, number> = {
  'Clothing': 17,
  'Shoes': 15,
  'Electronics': 8,
  'Computers': 8,
  'Camera': 8,
  'Home': 15,
  'Kitchen': 15,
  'Sports': 15,
  'Outdoors': 15,
  'Tools': 15,
  'Toys': 15,
  'Games': 15,
  'Health': 8,
  'Beauty': 8,
  'Grocery': 8,
  'Baby': 8,
  'Automotive': 12,
  'Books': 15,
  'Music': 15,
  'Video Games': 15,
  'Pet Supplies': 15,
  'Office': 15,
  'Industrial': 12,
  'Garden': 15,
  'Patio': 15,
  default: 15,
};

// Monthly storage fee per cubic foot (cents)
export const STORAGE_FEE_STANDARD_CENTS = 78;   // $0.78 Jan-Sep
export const STORAGE_FEE_Q4_CENTS = 241;         // $2.41 Oct-Dec

// --- eBay Fee Tables ---

// Final Value Fee percentages by category
export const EBAY_FVF_PERCENT: Record<string, number> = {
  'Clothing': 12.35,
  'Shoes': 12.35,
  'Toys': 12.35,
  'Baby': 12.35,
  'Electronics': 14.95,
  'Computers': 14.95,
  'Sports': 14.95,
  'Home': 14.95,
  'Health': 14.95,
  'Beauty': 14.95,
  'Books': 14.95,
  default: 13.25,
};

export const EBAY_FVF_SURCHARGE_CENTS = 30;    // $0.30 per-order surcharge
export const EBAY_PROCESSING_FEE_CENTS = 30;   // $0.30 payment processing

// Shipping cost estimates by weight tier (cents)
export const EBAY_SHIPPING_ESTIMATE: { maxGrams: number; cents: number }[] = [
  { maxGrams: 227,   cents: 450 },   // <=8oz:  $4.50
  { maxGrams: 454,   cents: 650 },   // <=1lb:  $6.50
  { maxGrams: 907,   cents: 850 },   // <=2lb:  $8.50
  { maxGrams: 1361,  cents: 1050 },  // <=3lb:  $10.50
  { maxGrams: 2268,  cents: 1350 },  // <=5lb:  $13.50
  { maxGrams: 4536,  cents: 1750 },  // <=10lb: $17.50
  { maxGrams: 9072,  cents: 2500 },  // <=20lb: $25.00
  { maxGrams: Infinity, cents: 3500 }, // >20lb: $35.00
];
