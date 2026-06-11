// Re-export shared types/functions and provide chrome-storage-backed wrappers.
import {
  fetchProduct as fetchProductShared,
  fetchOffers as fetchOffersShared,
  fetchSalesEstimation as fetchSalesEstimationShared,
} from '@shared/api/rainforest';

export type {
  RainforestProductResponse,
  RainforestOffersResponse,
  RainforestSalesEstimationResponse,
  RainforestSearchResponse,
} from '@shared/api/rainforest';

// --- API Key Management (chrome.storage-backed) ---

export async function getApiKey(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get('settings:apiKey', (result) => {
      resolve(result['settings:apiKey'] ?? null);
    });
  });
}

async function requireApiKey(): Promise<string> {
  const key = await getApiKey();
  if (!key) throw new Error('API_KEY_MISSING');
  return key;
}

// --- Public API: signature-compatible with prior version ---

export async function fetchProduct(asin: string, marketplace: string) {
  return fetchProductShared(await requireApiKey(), asin, marketplace);
}

export async function fetchOffers(asin: string, marketplace: string) {
  return fetchOffersShared(await requireApiKey(), asin, marketplace);
}

export async function fetchSalesEstimation(asin: string, marketplace: string) {
  return fetchSalesEstimationShared(await requireApiKey(), asin, marketplace);
}
