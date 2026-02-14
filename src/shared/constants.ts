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
  EBAY_SEARCH: 30 * 60 * 1000,
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
