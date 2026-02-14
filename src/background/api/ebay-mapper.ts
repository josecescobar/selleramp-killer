import type { EbayBrowseApiResponse } from './ebay-client';
import type {
  EbayListing,
  EbayPriceStats,
  EbayFeeBreakdown,
  EbayProfitEstimate,
  EbaySearchResult,
} from '@shared/types/ebay';

const EBAY_FVF_PERCENT = 13.25;
const EBAY_PROCESSING_FEE_CENTS = 30; // $0.30

export function mapEbayListings(
  response: EbayBrowseApiResponse,
): EbayListing[] {
  if (!response.itemSummaries) return [];

  return response.itemSummaries.map((item) => {
    const priceCents = Math.round(parseFloat(item.price.value) * 100);
    const shippingCostCents = getShippingCostCents(item.shippingOptions);
    return {
      itemId: item.itemId,
      title: item.title,
      priceCents,
      shippingCostCents,
      totalPriceCents: priceCents + shippingCostCents,
      condition: item.condition,
      itemUrl: item.itemWebUrl,
      imageUrl: item.image?.imageUrl,
      seller: {
        username: item.seller.username,
        feedbackScore: item.seller.feedbackScore,
        feedbackPercent: item.seller.feedbackPercentage
          ? parseFloat(item.seller.feedbackPercentage)
          : undefined,
      },
    };
  });
}

function getShippingCostCents(
  shippingOptions?: Array<{
    shippingCostType: string;
    shippingCost?: { value: string; currency: string };
  }>,
): number {
  if (!shippingOptions?.length) return 0;
  const first = shippingOptions[0];
  if (first.shippingCostType === 'FIXED' && first.shippingCost) {
    return Math.round(parseFloat(first.shippingCost.value) * 100);
  }
  return 0; // FREE_SHIPPING or CALCULATED treated as 0
}

export function calculatePriceStats(listings: EbayListing[]): EbayPriceStats {
  if (listings.length === 0) {
    return { medianCents: 0, lowCents: 0, highCents: 0, avgCents: 0 };
  }

  const prices = listings.map((l) => l.totalPriceCents).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median =
    prices.length % 2 === 0
      ? Math.round((prices[mid - 1] + prices[mid]) / 2)
      : prices[mid];

  return {
    medianCents: median,
    lowCents: prices[0],
    highCents: prices[prices.length - 1],
    avgCents: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
  };
}

export function calculateEbayFees(sellingPriceCents: number): EbayFeeBreakdown {
  const fvf = Math.round(sellingPriceCents * (EBAY_FVF_PERCENT / 100));
  return {
    finalValueFee: fvf,
    finalValueFeePercent: EBAY_FVF_PERCENT,
    processingFee: EBAY_PROCESSING_FEE_CENTS,
    totalFees: fvf + EBAY_PROCESSING_FEE_CENTS,
  };
}

export function calculateEbayProfit(
  amazonBuyPriceCents: number,
  ebaySellingPriceCents: number,
  shippingCostCents: number,
): EbayProfitEstimate {
  const fees = calculateEbayFees(ebaySellingPriceCents);
  const profitCents =
    ebaySellingPriceCents - amazonBuyPriceCents - fees.totalFees - shippingCostCents;
  const roi =
    amazonBuyPriceCents > 0
      ? (profitCents / amazonBuyPriceCents) * 100
      : 0;
  const margin =
    ebaySellingPriceCents > 0
      ? (profitCents / ebaySellingPriceCents) * 100
      : 0;

  return {
    amazonBuyPriceCents,
    ebaySellingPriceCents,
    fees,
    shippingCostCents,
    profitCents,
    roi,
    margin,
  };
}

export function buildEbaySearchResult(
  query: string,
  response: EbayBrowseApiResponse,
  amazonBuyPriceCents: number,
): EbaySearchResult {
  const listings = mapEbayListings(response);
  const priceStats = calculatePriceStats(listings);

  // Use median listing's shipping cost for profit estimate, or 0 if no listings
  const medianShipping =
    listings.length > 0
      ? listings[Math.floor(listings.length / 2)].shippingCostCents
      : 0;

  const profitEstimate = calculateEbayProfit(
    amazonBuyPriceCents,
    priceStats.medianCents,
    medianShipping,
  );

  return {
    query,
    totalListings: response.total ?? 0,
    listings,
    priceStats,
    profitEstimate,
    searchedAt: Date.now(),
  };
}
