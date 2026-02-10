import type { FeeBreakdown, ProfitCalculation, FulfillmentType } from '@shared/types/fees';
import type { Product } from '@shared/types/product';
import { REFERRAL_FEE_PERCENT, STORAGE_FEE_STANDARD_CENTS } from '@shared/constants';

/**
 * Calculate referral fee in cents.
 * Amazon charges a percentage of total sales price, with a $0.30 minimum.
 */
export function calculateReferralFee(
  sellPriceCents: number,
  category: string,
): { feeCents: number; percent: number } {
  const percent = matchCategoryFee(category);
  const calculated = Math.round((sellPriceCents * percent) / 100);
  const minimum = 30; // $0.30
  return {
    feeCents: Math.max(calculated, minimum),
    percent,
  };
}

function matchCategoryFee(category: string): number {
  const lower = category.toLowerCase();
  for (const [cat, pct] of Object.entries(REFERRAL_FEE_PERCENT)) {
    if (cat === 'default') continue;
    if (lower.includes(cat.toLowerCase())) return pct;
  }
  return REFERRAL_FEE_PERCENT['default'];
}

/**
 * Calculate FBA fulfillment fee based on product dimensions and weight.
 * Uses simplified tier logic based on Amazon's 2024 US fee schedule.
 * All dimensions in cm, weight in grams.
 */
export function calculateFbaFee(product: Product): number {
  const weightGrams = product.weightGrams ?? 454; // default 1 lb
  const dims = product.dimensions ?? {
    lengthCm: 25,
    widthCm: 20,
    heightCm: 10,
  };

  const sorted = [dims.lengthCm, dims.widthCm, dims.heightCm].sort(
    (a, b) => b - a,
  );
  const longest = sorted[0];
  const median = sorted[1];
  const shortest = sorted[2];

  // Dimensional weight (Amazon formula)
  const dimWeightGrams = Math.round(
    ((dims.lengthCm * dims.widthCm * dims.heightCm) / 5000) * 1000,
  );
  const billableWeight = Math.max(weightGrams, dimWeightGrams);

  // Standard size check
  const isStandard =
    longest <= 45.72 &&
    median <= 35.56 &&
    shortest <= 20.32 &&
    billableWeight <= 9072;

  if (isStandard) {
    // Small standard: <=12oz AND fits small envelope
    if (
      billableWeight <= 340 &&
      longest <= 38.1 &&
      median <= 30.48 &&
      shortest <= 1.905
    ) {
      return 337; // $3.37
    }
    // Small standard: <=16oz
    if (billableWeight <= 454 && longest <= 38.1) {
      return 373; // $3.73
    }
    // Large standard tiers by weight
    if (billableWeight <= 907) return 488; // <=2lb, $4.88
    if (billableWeight <= 1361) return 555; // <=3lb, $5.55
    if (billableWeight <= 2722) return 644; // <=6lb, $6.44
    // >6lb: base + per extra half-pound
    const extraHalfPounds = Math.ceil((billableWeight - 2722) / 227);
    return 644 + extraHalfPounds * 16;
  }

  // Oversize tiers
  const billableWeightLbs = billableWeight / 453.592;

  if (billableWeight <= 31751 && longest <= 152.4) {
    // Small oversize
    if (billableWeightLbs <= 2) return 987;
    return 987 + Math.ceil(billableWeightLbs - 2) * 42;
  }

  if (billableWeight <= 68039 && longest <= 274.32) {
    // Medium oversize
    if (billableWeightLbs <= 2) return 1929;
    return 1929 + Math.ceil(billableWeightLbs - 2) * 42;
  }

  // Large / special oversize
  if (billableWeightLbs <= 90) {
    return 8996 + Math.ceil(Math.max(billableWeightLbs - 2, 0)) * 83;
  }
  return 23278 + Math.ceil(Math.max(billableWeightLbs - 2, 0)) * 83;
}

/**
 * Estimate monthly storage fee in cents based on product dimensions.
 */
export function calculateStorageFee(product: Product): number {
  const dims = product.dimensions ?? {
    lengthCm: 25,
    widthCm: 20,
    heightCm: 10,
  };
  const cubicCm = dims.lengthCm * dims.widthCm * dims.heightCm;
  const cubicFeet = cubicCm / 28316.846;
  return Math.max(Math.round(cubicFeet * STORAGE_FEE_STANDARD_CENTS), 1);
}

/**
 * Assemble a complete fee breakdown for a given sell price and fulfillment type.
 */
export function calculateFeeBreakdown(
  sellPriceCents: number,
  product: Product,
  fulfillmentType: FulfillmentType,
): FeeBreakdown {
  const referral = calculateReferralFee(sellPriceCents, product.category);
  const fbaFee =
    fulfillmentType === 'FBA' ? calculateFbaFee(product) : undefined;
  const storageFee =
    fulfillmentType === 'FBA' ? calculateStorageFee(product) : 0;

  // Variable closing fee only applies to media categories
  const mediaCategories = ['books', 'music', 'video', 'dvd'];
  const isMedia = mediaCategories.some((m) =>
    product.category.toLowerCase().includes(m),
  );
  const variableClosingFee = isMedia ? 187 : 0; // $1.87

  const totalFees =
    referral.feeCents + (fbaFee ?? 0) + variableClosingFee + storageFee;

  return {
    referralFee: referral.feeCents,
    referralFeePercent: referral.percent,
    fbaFulfillmentFee: fbaFee,
    variableClosingFee,
    storageFeeMonthly: storageFee,
    totalFees,
  };
}

/**
 * Calculate full profit for a buy/sell scenario.
 */
export function calculateProfit(
  buyPriceCents: number,
  sellPriceCents: number,
  product: Product,
  fulfillmentType: FulfillmentType,
): ProfitCalculation {
  const fees = calculateFeeBreakdown(sellPriceCents, product, fulfillmentType);
  const profit = sellPriceCents - buyPriceCents - fees.totalFees;
  const roi =
    buyPriceCents > 0 ? Math.round((profit / buyPriceCents) * 100) : 0;
  const margin =
    sellPriceCents > 0 ? Math.round((profit / sellPriceCents) * 100) : 0;
  const maxCost = sellPriceCents - fees.totalFees;

  return {
    buyPrice: buyPriceCents,
    sellPrice: sellPriceCents,
    fees,
    profit,
    roi,
    margin,
    maxCost,
  };
}
