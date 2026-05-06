// Keepa API client — fetches a product with full price history and decodes the
// CSV-encoded series. Documented at https://api.keepa.com/.
//
// Time format: "Keepa Minutes" = (Unix ms / 60_000) - 21_564_000.
// Prices are reported in cents. Sales rank is reported as an integer rank.
// Missing data points are encoded as -1.

const KEEPA_BASE_URL = 'https://api.keepa.com/product';

const DOMAIN_BY_MARKETPLACE: Record<string, number> = {
  ATVPDKIKX0DER: 1, // amazon.com
  A2EUQ1WTGCTBG2: 6, // amazon.ca
  A1F83G8C2ARO7P: 2, // amazon.co.uk
  A1PA6795UKMFR9: 3, // amazon.de
  A13V1IB3VIYZZH: 4, // amazon.fr
  APJ6JRA9NG5V4: 8, // amazon.it
  A1RKKUPIHCS9HS: 9, // amazon.es
  A1VC38T7YXB528: 5, // amazon.co.jp
  A39IBJ37TRP1C6: 11, // amazon.com.au
};

// Series indices we care about for the elite chart.
export const KEEPA_SERIES = {
  AMAZON: 0,
  NEW: 1,
  USED: 2,
  SALES_RANK: 3,
  LIST_PRICE: 4,
  BUY_BOX: 18,
  COUNT_NEW: 11,
} as const;

export interface KeepaPoint {
  /** Unix epoch milliseconds. */
  ts: number;
  /** Price in cents, or rank/count integer depending on series. */
  value: number;
}

export interface KeepaVariation {
  asin: string;
  /** Pretty-printed dimension string, e.g. "Color: Red, Size: M". */
  attributes: string;
}

export interface KeepaProductResult {
  asin: string;
  title?: string;
  brand?: string;
  imageUrl?: string;
  /** Set when this ASIN is a child variation; null/undefined for parents. */
  parentAsin?: string | null;
  /** Variation children (only populated when this ASIN is a parent). */
  variations: KeepaVariation[];
  series: {
    amazon: KeepaPoint[];
    newPrice: KeepaPoint[];
    buyBox: KeepaPoint[];
    salesRank: KeepaPoint[];
    offerCountNew: KeepaPoint[];
  };
  /** Token cost reported by Keepa for this request. */
  tokensConsumed?: number;
  /** Tokens remaining on the account. */
  tokensLeft?: number;
}

export interface FetchKeepaOpts {
  apiKey: string;
  asin: string;
  marketplace?: string;
  /** Override domain code if marketplace lookup is insufficient. */
  domain?: number;
  signal?: AbortSignal;
}

interface RawKeepaVariation {
  asin: string;
  attributes?: Array<{ dimension?: string; value?: string }>;
}

interface RawKeepaResponse {
  tokensLeft?: number;
  tokensConsumed?: number;
  products?: Array<{
    asin: string;
    parentAsin?: string | null;
    title?: string;
    brand?: string;
    imagesCSV?: string;
    csv?: Array<number[] | null>;
    variations?: RawKeepaVariation[];
  }>;
  error?: { message: string; type: string };
}

export async function fetchKeepaProduct(
  opts: FetchKeepaOpts,
): Promise<KeepaProductResult> {
  if (!opts.apiKey) throw new Error('KEEPA_API_KEY_MISSING');

  const domain =
    opts.domain ?? DOMAIN_BY_MARKETPLACE[opts.marketplace ?? 'ATVPDKIKX0DER'] ?? 1;

  const url = new URL(KEEPA_BASE_URL);
  url.searchParams.set('key', opts.apiKey);
  url.searchParams.set('domain', String(domain));
  url.searchParams.set('asin', opts.asin);
  url.searchParams.set('history', '1');
  url.searchParams.set('stats', '90');

  const response = await fetch(url.toString(), { signal: opts.signal });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('KEEPA_API_KEY_INVALID');
    }
    if (response.status === 429) {
      throw new Error('KEEPA_RATE_LIMITED');
    }
    throw new Error(`KEEPA_API_ERROR_${response.status}`);
  }

  const data: RawKeepaResponse = await response.json();
  if (data.error) throw new Error(`KEEPA_${data.error.type}`);
  const product = data.products?.[0];
  if (!product) throw new Error('KEEPA_PRODUCT_NOT_FOUND');

  const csv = product.csv ?? [];
  const image = product.imagesCSV?.split(',')[0]?.trim();

  const variations: KeepaVariation[] = (product.variations ?? []).map((v) => ({
    asin: v.asin,
    attributes: (v.attributes ?? [])
      .filter((a) => a.dimension && a.value)
      .map((a) => `${a.dimension}: ${a.value}`)
      .join(', '),
  }));

  return {
    asin: product.asin,
    parentAsin: product.parentAsin ?? null,
    title: product.title,
    brand: product.brand,
    imageUrl: image ? `https://images-na.ssl-images-amazon.com/images/I/${image}` : undefined,
    variations,
    series: {
      amazon: decodeSeries(csv[KEEPA_SERIES.AMAZON]),
      newPrice: decodeSeries(csv[KEEPA_SERIES.NEW]),
      buyBox: decodeSeries(csv[KEEPA_SERIES.BUY_BOX]),
      salesRank: decodeSeries(csv[KEEPA_SERIES.SALES_RANK]),
      offerCountNew: decodeSeries(csv[KEEPA_SERIES.COUNT_NEW]),
    },
    tokensConsumed: data.tokensConsumed,
    tokensLeft: data.tokensLeft,
  };
}

const KEEPA_EPOCH_MINUTES = 21_564_000;

export function keepaMinuteToUnixMs(km: number): number {
  return (km + KEEPA_EPOCH_MINUTES) * 60_000;
}

function decodeSeries(raw: number[] | null | undefined): KeepaPoint[] {
  if (!raw || raw.length < 2) return [];
  const out: KeepaPoint[] = [];
  for (let i = 0; i + 1 < raw.length; i += 2) {
    const km = raw[i];
    const value = raw[i + 1];
    if (value === -1) continue;
    out.push({ ts: keepaMinuteToUnixMs(km), value });
  }
  return out;
}

// --- Demo data generation (used when no API key is configured) ---

/**
 * Deterministic synthetic Keepa response for a given ASIN. Produces ~90 days
 * of daily samples for prices, BSR, and offer counts plus a handful of
 * fake variations. Useful for visual review without consuming Keepa tokens.
 */
export function generateMockKeepaProduct(asin: string): KeepaProductResult {
  const seed = hashString(asin);
  const rand = mulberry32(seed);
  const days = 90;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Base levels seeded from ASIN so different products look different.
  const basePriceCents = 1500 + Math.floor(rand() * 4500); // $15–$60
  const baseRank = 1000 + Math.floor(rand() * 50_000);
  const baseOffers = 3 + Math.floor(rand() * 12);

  const amazon: KeepaPoint[] = [];
  const newPrice: KeepaPoint[] = [];
  const buyBox: KeepaPoint[] = [];
  const salesRank: KeepaPoint[] = [];
  const offerCountNew: KeepaPoint[] = [];

  let pAmazon = basePriceCents;
  let pNew = basePriceCents - 50 - Math.floor(rand() * 200);
  let pBuyBox = pNew + Math.floor(rand() * 100);
  let rank = baseRank;
  let offers = baseOffers;

  for (let i = days; i >= 0; i--) {
    const ts = now - i * dayMs;
    pAmazon = clamp(pAmazon + Math.round((rand() - 0.5) * 80), 200, 100_000);
    pNew = clamp(pNew + Math.round((rand() - 0.5) * 100), 200, 100_000);
    pBuyBox = clamp(pBuyBox + Math.round((rand() - 0.5) * 90), 200, 100_000);
    rank = clamp(Math.round(rank * (1 + (rand() - 0.5) * 0.08)), 50, 2_000_000);
    offers = clamp(offers + (rand() < 0.25 ? Math.round((rand() - 0.5) * 2) : 0), 1, 60);

    // Insert a few intentional gaps to mimic real Keepa data sparsity.
    if (rand() > 0.05) amazon.push({ ts, value: pAmazon });
    if (rand() > 0.02) newPrice.push({ ts, value: pNew });
    if (rand() > 0.1) buyBox.push({ ts, value: pBuyBox });
    salesRank.push({ ts, value: rank });
    if (i % 3 === 0) offerCountNew.push({ ts, value: offers });
  }

  const variations: KeepaVariation[] = [
    { asin: mockAsin(asin, 1), attributes: 'Color: Black, Size: M' },
    { asin: mockAsin(asin, 2), attributes: 'Color: Black, Size: L' },
    { asin: mockAsin(asin, 3), attributes: 'Color: Red, Size: M' },
    { asin: mockAsin(asin, 4), attributes: 'Color: Blue, Size: L' },
  ];

  return {
    asin,
    parentAsin: null,
    title: `Demo product · ${asin}`,
    brand: 'DemoBrand',
    imageUrl: undefined,
    variations,
    series: { amazon, newPrice, buyBox, salesRank, offerCountNew },
    tokensConsumed: 0,
    tokensLeft: undefined,
  };
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function mockAsin(parent: string, n: number): string {
  // Replace the trailing two characters with a number-derived suffix so the
  // result is still ASIN-shaped but distinguishable.
  const stem = parent.slice(0, -2).toUpperCase();
  const suffix = (n * 7).toString(36).toUpperCase().padStart(2, '0').slice(-2);
  return (stem + suffix).slice(0, 10);
}
