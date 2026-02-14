const EBAY_AUTH_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
const EBAY_BROWSE_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

interface EbayCredentials {
  clientId: string;
  clientSecret: string;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export async function getEbayCredentials(): Promise<EbayCredentials | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ['settings:ebayClientId', 'settings:ebayClientSecret'],
      (result) => {
        const clientId = result['settings:ebayClientId'];
        const clientSecret = result['settings:ebayClientSecret'];
        if (clientId && clientSecret) {
          resolve({ clientId, clientSecret });
        } else {
          resolve(null);
        }
      },
    );
  });
}

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5-min buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 5 * 60 * 1000) {
    return tokenCache.token;
  }

  const credentials = await getEbayCredentials();
  if (!credentials) {
    throw new Error('EBAY_CREDENTIALS_MISSING');
  }

  const basicAuth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);

  const response = await fetch(EBAY_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
  });

  if (!response.ok) {
    tokenCache = null;
    if (response.status === 401 || response.status === 403) {
      throw new Error('EBAY_CREDENTIALS_INVALID');
    }
    throw new Error(`EBAY_AUTH_ERROR_${response.status}`);
  }

  const data = await response.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.token;
}

export interface EbaySearchOptions {
  limit?: number;
  condition?: string;
}

export interface EbayBrowseApiResponse {
  href: string;
  total: number;
  limit: number;
  offset: number;
  itemSummaries?: Array<{
    itemId: string;
    title: string;
    price: { value: string; currency: string };
    shippingOptions?: Array<{
      shippingCostType: string;
      shippingCost?: { value: string; currency: string };
    }>;
    condition: string;
    conditionId: string;
    itemWebUrl: string;
    image?: { imageUrl: string };
    seller: {
      username: string;
      feedbackScore?: number;
      feedbackPercentage?: string;
    };
    itemLocation?: { country: string };
  }>;
}

export async function searchEbay(
  query: string,
  options: EbaySearchOptions = {},
): Promise<EbayBrowseApiResponse> {
  const token = await getAccessToken();

  const limit = options.limit ?? 12;
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    sort: 'price',
    filter: 'deliveryCountry:US,conditions:{NEW}',
  });

  const response = await fetch(`${EBAY_BROWSE_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country%3DUS',
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      tokenCache = null;
      throw new Error('EBAY_CREDENTIALS_INVALID');
    }
    if (response.status === 429) {
      throw new Error('EBAY_RATE_LIMITED');
    }
    throw new Error(`EBAY_API_ERROR_${response.status}`);
  }

  return response.json();
}
