import type { Product, Marketplace } from '@shared/types/product';
import type { Offer, BuyBoxInfo } from '@shared/types/offers';
import type { BsrInfo, SalesEstimate } from '@shared/types/messages';
import type {
  RainforestProductResponse,
  RainforestOffersResponse,
  RainforestSalesEstimationResponse,
} from './rainforest-client';

// --- Product Mapping ---

export function mapProduct(
  raw: RainforestProductResponse,
  marketplace: Marketplace,
): Product {
  const p = raw.product;
  // Skip generic top-level categories like "All Departments"
  const rawCategory =
    p.categories?.find(
      (c) => c.name && !/^all\s/i.test(c.name),
    )?.name ??
    p.categories_flat
      ?.split('/')
      .map((s) => s.trim())
      .find((s) => s && !/^all\s/i.test(s)) ??
    p.categories?.[0]?.name ??
    'Unknown';
  const category = rawCategory;
  const { weightGrams, dimensions } = parseDimensions(
    p.weight,
    p.dimensions,
    p.specifications,
  );

  return {
    asin: p.asin,
    marketplace,
    title: p.title,
    brand: p.brand ?? 'Unknown',
    category,
    categoryId: p.categories?.[0]?.category_id
      ? Number(p.categories[0].category_id)
      : undefined,
    imageUrl: p.main_image?.link,
    rating: p.rating,
    reviewCount: p.ratings_total,
    isHazmat: checkHazmat(p),
    isMeltable: checkMeltable(p),
    isAdult: p.is_adult_product ?? false,
    isOversized: checkOversized(weightGrams, dimensions),
    sizeTier: determineSizeTier(weightGrams, dimensions),
    weightGrams,
    dimensions,
  };
}

// --- Offers Mapping ---

export function mapOffers(
  raw: RainforestOffersResponse,
  feeCalculator: (
    price: number,
    fulfillment: 'FBA' | 'FBM',
  ) => { profit: number; roi: number },
): Offer[] {
  return raw.offers
    .filter((o) => o.condition?.is_new !== false && o.price?.value)
    .map((o) => {
      const priceCents = Math.round(o.price!.value * 100);
      const isFba =
        o.fulfillment?.is_fulfilled_by_amazon ??
        o.delivery?.fulfilled_by_amazon ??
        false;
      const fulfillmentType = isFba ? ('FBA' as const) : ('FBM' as const);
      const calc = feeCalculator(priceCents, fulfillmentType);

      return {
        fulfillmentType,
        price: priceCents,
        profit: calc.profit,
        roi: calc.roi,
        sellerName: o.seller?.name,
        sellerRating: o.seller?.rating,
        isBuyBox: o.is_buybox_winner ?? false,
      };
    })
    .sort((a, b) => a.price - b.price);
}

// --- Buy Box Mapping ---

export function mapBuyBox(
  raw: RainforestProductResponse,
): BuyBoxInfo | null {
  const bb = raw.product.buybox_winner;
  if (!bb) return null;

  const sellerName = bb.seller?.name ?? 'Unknown';
  return {
    owner: sellerName,
    fulfillmentType: bb.fulfillment?.is_fulfilled_by_amazon ? 'FBA' : 'FBM',
    stability: 85, // Default; would need historical data for real stability
    amazonOnListing:
      sellerName.toLowerCase() === 'amazon.com' ||
      sellerName.toLowerCase() === 'amazon',
  };
}

// --- BSR Mapping ---

export function mapBsr(raw: RainforestProductResponse): BsrInfo {
  const ranks = raw.product.bestsellers_rank ?? [];
  const primary = ranks[0];
  return {
    rank: primary?.rank ?? 0,
    category: primary?.category ?? 'Unknown',
    subCategoryRanks: ranks
      .slice(1)
      .map((r) => ({ category: r.category, rank: r.rank })),
  };
}

// --- Sales Estimate Mapping ---

export function mapSalesEstimate(
  raw: RainforestSalesEstimationResponse,
): SalesEstimate {
  const monthly = raw.sales_estimation?.monthly_sales_estimation ?? 0;
  return {
    monthlySales: monthly,
    confidence: monthly > 0 ? 70 : 0,
    range: {
      low: Math.round(monthly * 0.7),
      high: Math.round(monthly * 1.3),
    },
  };
}

// --- Internal Helpers ---

function parseDimensions(
  weightStr?: string,
  dimStr?: string,
  specs?: Array<{ name: string; value: string }>,
): {
  weightGrams?: number;
  dimensions?: { lengthCm: number; widthCm: number; heightCm: number };
} {
  let weightGrams: number | undefined;
  let dimensions:
    | { lengthCm: number; widthCm: number; heightCm: number }
    | undefined;

  // Parse weight from string like "1.2 pounds" or "540 grams"
  const weightSource =
    weightStr ??
    specs?.find((s) => s.name.toLowerCase().includes('weight'))?.value;

  if (weightSource) {
    const match = weightSource.match(
      /([\d.]+)\s*(pound|lb|ounce|oz|gram|g|kilogram|kg)/i,
    );
    if (match) {
      const val = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      if (unit.startsWith('pound') || unit === 'lb')
        weightGrams = Math.round(val * 453.592);
      else if (unit.startsWith('ounce') || unit === 'oz')
        weightGrams = Math.round(val * 28.3495);
      else if (unit.startsWith('gram') || unit === 'g')
        weightGrams = Math.round(val);
      else if (unit.startsWith('kilogram') || unit === 'kg')
        weightGrams = Math.round(val * 1000);
    }
  }

  // Parse dimensions from string like "10.5 x 8.2 x 3.1 inches"
  const dimSource =
    dimStr ??
    specs?.find((s) => s.name.toLowerCase().includes('dimension'))?.value;

  if (dimSource) {
    const match = dimSource.match(
      /([\d.]+)\s*x\s*([\d.]+)\s*x\s*([\d.]+)\s*(inch|in|cm|centimeter)/i,
    );
    if (match) {
      let [, l, w, h] = match.map(Number);
      l = parseFloat(match[1]);
      w = parseFloat(match[2]);
      h = parseFloat(match[3]);
      const unit = match[4].toLowerCase();
      if (unit.startsWith('inch') || unit === 'in') {
        l *= 2.54;
        w *= 2.54;
        h *= 2.54;
      }
      dimensions = {
        lengthCm: Math.round(l * 100) / 100,
        widthCm: Math.round(w * 100) / 100,
        heightCm: Math.round(h * 100) / 100,
      };
    }
  }

  return { weightGrams, dimensions };
}

function checkHazmat(p: RainforestProductResponse['product']): boolean {
  const text = [
    p.categories_flat ?? '',
    ...(p.attributes?.map((a) => a.value) ?? []),
    ...(p.specifications?.map((s) => s.value) ?? []),
  ]
    .join(' ')
    .toLowerCase();
  return /hazmat|lithium|flammable|corrosive|pressurized/.test(text);
}

function checkMeltable(p: RainforestProductResponse['product']): boolean {
  const text = [p.title, p.categories_flat ?? ''].join(' ').toLowerCase();
  return /chocolate|candy|gummy|wax|candle|meltable/.test(text);
}

function checkOversized(
  weightGrams?: number,
  dims?: { lengthCm: number; widthCm: number; heightCm: number },
): boolean {
  if (weightGrams && weightGrams > 9072) return true; // > 20 lbs
  if (dims) {
    const longest = Math.max(dims.lengthCm, dims.widthCm, dims.heightCm);
    if (longest > 45.72) return true; // > 18 inches
  }
  return false;
}

function determineSizeTier(
  weightGrams?: number,
  dims?: { lengthCm: number; widthCm: number; heightCm: number },
): string {
  if (!weightGrams && !dims) return 'Unknown';
  if (checkOversized(weightGrams, dims)) return 'Oversize';
  if (weightGrams && weightGrams <= 454 && dims) {
    const longest = Math.max(dims.lengthCm, dims.widthCm, dims.heightCm);
    if (longest <= 38.1) return 'Small Standard';
  }
  return 'Large Standard';
}
