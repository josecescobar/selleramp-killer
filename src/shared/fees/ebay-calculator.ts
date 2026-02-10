import type { EbayFees, EbayProfitCalculation } from '@shared/types/fees';
import {
  EBAY_FVF_PERCENT,
  EBAY_FVF_SURCHARGE_CENTS,
  EBAY_PROCESSING_FEE_CENTS,
  EBAY_SHIPPING_ESTIMATE,
} from '@shared/constants';

function matchEbayCategory(category: string): number {
  const lower = category.toLowerCase();
  for (const [cat, pct] of Object.entries(EBAY_FVF_PERCENT)) {
    if (cat === 'default') continue;
    if (lower.includes(cat.toLowerCase())) return pct;
  }
  return EBAY_FVF_PERCENT['default'];
}

/**
 * Estimate eBay shipping cost in cents based on weight.
 * Defaults to $8.50 (2lb tier) when weight is unknown.
 */
export function estimateEbayShipping(weightGrams?: number): number {
  if (!weightGrams) return 850;
  for (const tier of EBAY_SHIPPING_ESTIMATE) {
    if (weightGrams <= tier.maxGrams) return tier.cents;
  }
  return EBAY_SHIPPING_ESTIMATE[EBAY_SHIPPING_ESTIMATE.length - 1].cents;
}

/**
 * Calculate eBay fees in cents.
 * FVF = (sellPrice + shipping) × category% + $0.30 surcharge
 * Processing = $0.30
 */
export function calculateEbayFees(
  sellPriceCents: number,
  category: string,
  shippingCents: number,
): EbayFees {
  const fvfPercent = matchEbayCategory(category);
  const fvfBase = Math.round(
    ((sellPriceCents + shippingCents) * fvfPercent) / 100,
  );
  const finalValueFee = fvfBase + EBAY_FVF_SURCHARGE_CENTS;
  const processingFee = EBAY_PROCESSING_FEE_CENTS;
  const totalFees = finalValueFee + processingFee;

  return {
    finalValueFee,
    finalValueFeePercent: fvfPercent,
    surcharge: EBAY_FVF_SURCHARGE_CENTS,
    processingFee,
    totalFees,
  };
}

/**
 * Calculate full eBay profit for a buy/sell scenario.
 * profit = sell - buy - fees - shipping
 */
export function calculateEbayProfit(
  buyPriceCents: number,
  sellPriceCents: number,
  category: string,
  weightGrams?: number,
): EbayProfitCalculation {
  const shippingEstimate = estimateEbayShipping(weightGrams);
  const fees = calculateEbayFees(sellPriceCents, category, shippingEstimate);
  const profit = sellPriceCents - buyPriceCents - fees.totalFees - shippingEstimate;
  const roi = buyPriceCents > 0 ? Math.round((profit / buyPriceCents) * 100) : 0;
  const margin = sellPriceCents > 0 ? Math.round((profit / sellPriceCents) * 100) : 0;

  return {
    buyPrice: buyPriceCents,
    sellPrice: sellPriceCents,
    fees,
    shippingEstimate,
    profit,
    roi,
    margin,
  };
}
