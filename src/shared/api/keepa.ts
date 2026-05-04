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

export interface KeepaProductResult {
  asin: string;
  title?: string;
  brand?: string;
  imageUrl?: string;
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

interface RawKeepaResponse {
  tokensLeft?: number;
  tokensConsumed?: number;
  products?: Array<{
    asin: string;
    title?: string;
    brand?: string;
    imagesCSV?: string;
    csv?: Array<number[] | null>;
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

  return {
    asin: product.asin,
    title: product.title,
    brand: product.brand,
    imageUrl: image ? `https://images-na.ssl-images-amazon.com/images/I/${image}` : undefined,
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
