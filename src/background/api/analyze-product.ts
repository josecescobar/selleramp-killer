import type { AnalysisResult } from '@shared/types/messages';
import type { Marketplace } from '@shared/types/product';
import {
  fetchProduct,
  fetchOffers,
  fetchSalesEstimation,
} from './rainforest-client';
import {
  mapProduct,
  mapOffers,
  mapBuyBox,
  mapBsr,
  mapSalesEstimate,
} from './rainforest-mapper';
import { calculateProfit, calculateFeeBreakdown } from '../fees/calculator';
import { calculateDealScore } from '../scoring/deal-scorer';
import { generateAlerts } from '../alerts/alert-generator';
import { getFromCache, setInCache } from '../storage';
import { CACHE_TTL } from '@shared/constants';
import type { RainforestSalesEstimationResponse } from './rainforest-client';
import type { SalesEstimate } from '@shared/types/messages';

export async function analyzeProduct(
  asin: string,
  marketplace: string,
  _url: string,
): Promise<AnalysisResult> {
  const mp = (marketplace || 'ATVPDKIKX0DER') as Marketplace;

  // Fetch from Rainforest API in parallel (3 credits total)
  const [productRaw, offersRaw, salesRaw] = await Promise.all([
    fetchWithCache(
      `rf:product:${asin}`,
      () => fetchProduct(asin, mp),
      CACHE_TTL.PRODUCT_DETAILS,
    ),
    fetchWithCache(
      `rf:offers:${asin}`,
      () => fetchOffers(asin, mp),
      CACHE_TTL.PRICING,
    ),
    fetchWithCache(
      `rf:sales:${asin}`,
      () => fetchSalesEstimation(asin, mp),
      CACHE_TTL.BSR,
    ).catch(
      (): RainforestSalesEstimationResponse => ({
        request_info: { success: true, credits_used: 0, credits_remaining: 0 },
        sales_estimation: { monthly_sales_estimation: 0 },
      }),
    ),
  ]);

  // Map to internal types
  const product = mapProduct(productRaw, mp);
  const bsr = mapBsr(productRaw);
  const salesEstimate: SalesEstimate = mapSalesEstimate(salesRaw);
  const buyBox = mapBuyBox(productRaw);

  // Determine sell price (buybox price or first offer)
  const sellPriceCents = productRaw.product.buybox_winner?.price?.value
    ? Math.round(productRaw.product.buybox_winner.price.value * 100)
    : offersRaw.offers[0]?.price?.value
      ? Math.round(offersRaw.offers[0].price.value * 100)
      : 0;

  // Default buy price at 40% of sell (user can override later)
  const defaultBuyPriceCents = Math.round(sellPriceCents * 0.4);

  // Map offers with fee calculations
  const offers = mapOffers(offersRaw, (price, fulfillment) => {
    const fees = calculateFeeBreakdown(price, product, fulfillment);
    const profit = price - defaultBuyPriceCents - fees.totalFees;
    const roi =
      defaultBuyPriceCents > 0
        ? Math.round((profit / defaultBuyPriceCents) * 100)
        : 0;
    return { profit, roi };
  });

  // Calculate profit for FBA and FBM
  const profitFba = calculateProfit(
    defaultBuyPriceCents,
    sellPriceCents,
    product,
    'FBA',
  );
  const profitFbm = calculateProfit(
    defaultBuyPriceCents,
    sellPriceCents,
    product,
    'FBM',
  );

  // Generate alerts
  const alerts = generateAlerts({
    product,
    buyBox,
    offers,
    bsr,
    sellPriceCents,
  });

  // Calculate deal score
  const dealScore = calculateDealScore({
    profitFba,
    profitFbm,
    bsr,
    sales: salesEstimate,
    buyBox,
    offers,
    product,
  });

  return {
    product,
    dealScore,
    profitFba,
    profitFbm,
    offers,
    buyBox,
    alerts,
    salesEstimate,
    bsr,
    analyzedAt: Date.now(),
  };
}

async function fetchWithCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl: number,
): Promise<T> {
  const cached = await getFromCache<T>(cacheKey);
  if (cached) return cached;

  const data = await fetcher();
  await setInCache(cacheKey, data, ttl);
  return data;
}
