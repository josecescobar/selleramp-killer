import { RAINFOREST_BASE_URL, MARKETPLACE_TO_AMAZON_DOMAIN } from '@shared/constants';

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

// --- API Key Management ---

export async function getApiKey(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get('settings:apiKey', (result) => {
      resolve(result['settings:apiKey'] ?? null);
    });
  });
}

// --- HTTP Client ---

async function rainforestRequest<T>(
  params: Record<string, string>,
): Promise<T> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

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

// --- Public API Functions ---

export function fetchProduct(
  asin: string,
  marketplace: string,
): Promise<RainforestProductResponse> {
  const domain =
    MARKETPLACE_TO_AMAZON_DOMAIN[marketplace] || 'amazon.com';
  return rainforestRequest<RainforestProductResponse>({
    type: 'product',
    asin,
    amazon_domain: domain,
  });
}

export function fetchOffers(
  asin: string,
  marketplace: string,
): Promise<RainforestOffersResponse> {
  const domain =
    MARKETPLACE_TO_AMAZON_DOMAIN[marketplace] || 'amazon.com';
  return rainforestRequest<RainforestOffersResponse>({
    type: 'offers',
    asin,
    amazon_domain: domain,
  });
}

export function fetchSalesEstimation(
  asin: string,
  marketplace: string,
): Promise<RainforestSalesEstimationResponse> {
  const domain =
    MARKETPLACE_TO_AMAZON_DOMAIN[marketplace] || 'amazon.com';
  return rainforestRequest<RainforestSalesEstimationResponse>({
    type: 'sales_estimation',
    asin,
    amazon_domain: domain,
  });
}
