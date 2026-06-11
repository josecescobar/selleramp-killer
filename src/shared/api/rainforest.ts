import { RAINFOREST_BASE_URL, MARKETPLACE_TO_AMAZON_DOMAIN } from '../constants';

// --- Raw Rainforest Response Types ---

export interface RainforestProductResponse {
  request_info: {
    success: boolean;
    credits_used: number;
    credits_remaining: number;
  };
  product: {
    title: string;
    asin: string;
    brand?: string;
    categories?: Array<{ name: string; category_id?: string }>;
    categories_flat?: string;
    main_image?: { link: string };
    rating?: number;
    ratings_total?: number;
    buybox_winner?: {
      price?: { value: number; currency: string };
      fulfillment?: { type: string; is_fulfilled_by_amazon: boolean };
      offer_id?: string;
      seller?: { name: string; link: string };
    };
    bestsellers_rank?: Array<{
      category: string;
      rank: number;
      link: string;
    }>;
    weight?: string;
    dimensions?: string;
    specifications?: Array<{ name: string; value: string }>;
    attributes?: Array<{ name: string; value: string }>;
    is_adult_product?: boolean;
  };
}

export interface RainforestOffersResponse {
  request_info: {
    success: boolean;
    credits_used: number;
    credits_remaining: number;
  };
  offers: Array<{
    asin: string;
    price?: { value: number; currency: string };
    delivery?: {
      price?: { value: number };
      fulfilled_by_amazon: boolean;
    };
    seller?: {
      name: string;
      rating?: number;
      ratings_total?: number;
      link: string;
    };
    condition?: { title: string; is_new: boolean };
    is_buybox_winner?: boolean;
    fulfillment?: { type: string; is_fulfilled_by_amazon: boolean };
  }>;
  pagination?: { total_results: number };
}

export interface RainforestSalesEstimationResponse {
  request_info: {
    success: boolean;
    credits_used: number;
    credits_remaining: number;
  };
  sales_estimation: {
    monthly_sales_estimation: number;
  };
}

export interface RainforestSearchResponse {
  request_info: {
    success: boolean;
    credits_used: number;
    credits_remaining: number;
  };
  search_results?: Array<{
    asin?: string;
    title?: string;
    image?: string;
  }>;
}

// --- HTTP ---

export async function rainforestRequest<T>(
  apiKey: string,
  params: Record<string, string>,
): Promise<T> {
  if (!apiKey) throw new Error('API_KEY_MISSING');

  const url = new URL(RAINFOREST_BASE_URL);
  url.searchParams.set('api_key', apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('API_KEY_INVALID');
    }
    if (response.status === 429) {
      throw new Error('RATE_LIMITED');
    }
    throw new Error(`API_ERROR_${response.status}`);
  }

  const data = await response.json();
  if (data.request_info && !data.request_info.success) {
    throw new Error('API_REQUEST_FAILED');
  }
  return data as T;
}

function domainFor(marketplace: string): string {
  return MARKETPLACE_TO_AMAZON_DOMAIN[marketplace] || 'amazon.com';
}

export function fetchProduct(
  apiKey: string,
  asin: string,
  marketplace: string,
): Promise<RainforestProductResponse> {
  return rainforestRequest<RainforestProductResponse>(apiKey, {
    type: 'product',
    asin,
    amazon_domain: domainFor(marketplace),
  });
}

export function fetchOffers(
  apiKey: string,
  asin: string,
  marketplace: string,
): Promise<RainforestOffersResponse> {
  return rainforestRequest<RainforestOffersResponse>(apiKey, {
    type: 'offers',
    asin,
    amazon_domain: domainFor(marketplace),
  });
}

export function fetchSalesEstimation(
  apiKey: string,
  asin: string,
  marketplace: string,
): Promise<RainforestSalesEstimationResponse> {
  return rainforestRequest<RainforestSalesEstimationResponse>(apiKey, {
    type: 'sales_estimation',
    asin,
    amazon_domain: domainFor(marketplace),
  });
}

export async function searchAndPickAsin(
  apiKey: string,
  searchTerm: string,
  marketplace: string,
): Promise<string | null> {
  const result = await rainforestRequest<RainforestSearchResponse>(apiKey, {
    type: 'search',
    search_term: searchTerm,
    amazon_domain: domainFor(marketplace),
  });
  const first = result.search_results?.find((r) => !!r.asin);
  return first?.asin ?? null;
}
