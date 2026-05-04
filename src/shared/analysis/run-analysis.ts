import type { AnalysisResult, SalesEstimate, PriceSnapshot } from '../types/messages';
import type { Marketplace } from '../types/product';
import {
  fetchProduct,
  fetchOffers,
  fetchSalesEstimation,
  type RainforestSalesEstimationResponse,
} from '../api/rainforest';
import {
  mapProduct,
  mapOffers,
  mapBuyBox,
  mapBsr,
  mapSalesEstimate,
} from '../../background/api/rainforest-mapper';
import {
  calculateProfit,
  calculateFeeBreakdown,
} from '../../background/fees/calculator';
import { calculateDealScore } from '../../background/scoring/deal-scorer';
import { generateAlerts } from '../../background/alerts/alert-generator';

export interface AnalysisDeps {
  apiKey: string;
  marketplace?: string;
  getCache?: <T>(key: string) => Promise<T | null>;
  setCache?: <T>(key: string, value: T, ttlMs: number) => Promise<void>;
  getSnapshots?: (asin: string) => Promise<PriceSnapshot[]>;
}

const CACHE_PRODUCT_TTL = 24 * 60 * 60 * 1000;
const CACHE_PRICING_TTL = 15 * 60 * 1000;
const CACHE_BSR_TTL = 60 * 60 * 1000;

export async function runAnalysis(
  asin: string,
  deps: AnalysisDeps,
): Promise<AnalysisResult> {
  const mp = (deps.marketplace || 'ATVPDKIKX0DER') as Marketplace;
  const apiKey = deps.apiKey;

  const [productRaw, offersRaw, salesRaw] = await Promise.all([
    cached(
      deps,
      `rf:product:${asin}`,
      () => fetchProduct(apiKey, asin, mp),
      CACHE_PRODUCT_TTL,
    ),
    cached(
      deps,
      `rf:offers:${asin}`,
      () => fetchOffers(apiKey, asin, mp),
      CACHE_PRICING_TTL,
    ),
    cached(
      deps,
      `rf:sales:${asin}`,
      () => fetchSalesEstimation(apiKey, asin, mp),
      CACHE_BSR_TTL,
    ).catch(
      (): RainforestSalesEstimationResponse => ({
        request_info: { success: true, credits_used: 0, credits_remaining: 0 },
        sales_estimation: { monthly_sales_estimation: 0 },
      }),
    ),
  ]);

  const product = mapProduct(productRaw, mp);
  const bsr = mapBsr(productRaw);
  const salesEstimate: SalesEstimate = mapSalesEstimate(salesRaw);
  const buyBox = mapBuyBox(productRaw);

  const sellPriceCents = productRaw.product.buybox_winner?.price?.value
    ? Math.round(productRaw.product.buybox_winner.price.value * 100)
    : offersRaw.offers[0]?.price?.value
      ? Math.round(offersRaw.offers[0].price.value * 100)
      : 0;

  const defaultBuyPriceCents = Math.round(sellPriceCents * 0.4);

  const offers = mapOffers(offersRaw, (price, fulfillment) => {
    const fees = calculateFeeBreakdown(price, product, fulfillment);
    const profit = price - defaultBuyPriceCents - fees.totalFees;
    const roi =
      defaultBuyPriceCents > 0
        ? Math.round((profit / defaultBuyPriceCents) * 100)
        : 0;
    return { profit, roi };
  });

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

  const alerts = await generateAlerts(
    { product, buyBox, offers, bsr, sellPriceCents, asin },
    { getSnapshots: deps.getSnapshots },
  );

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

async function cached<T>(
  deps: AnalysisDeps,
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
): Promise<T> {
  if (deps.getCache && deps.setCache) {
    const hit = await deps.getCache<T>(key);
    if (hit) return hit;
    const data = await fetcher();
    await deps.setCache(key, data, ttl);
    return data;
  }
  return fetcher();
}
