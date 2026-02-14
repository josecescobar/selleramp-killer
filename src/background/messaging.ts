import type {
  ExtensionMessage,
  AnalyzeProductResponse,
  AnalysisResult,
  SearchEbayResponse,
} from '@shared/types/messages';
import type { EbaySearchResult } from '@shared/types/ebay';
import { getFromCache, setInCache, setSession } from './storage';
import { CACHE_TTL } from '@shared/constants';
import { analyzeProduct } from './api/analyze-product';
import { getApiKey } from './api/rainforest-client';
import { getEbayCredentials, searchEbay } from './api/ebay-client';
import { buildEbaySearchResult } from './api/ebay-mapper';

// In-flight request deduplication — prevents duplicate API calls for the same ASIN
const inflight = new Map<string, Promise<AnalyzeProductResponse>>();
const inflightEbay = new Map<string, Promise<SearchEbayResponse>>();

export function handleMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): void {
  switch (message.type) {
    case 'ANALYZE_PRODUCT':
      handleAnalyzeProduct(message.asin, message.marketplace, message.url)
        .then(sendResponse)
        .catch((err) => {
          sendResponse({ success: false, error: String(err?.message || err) });
        });
      break;

    case 'GET_CACHED_PRODUCT':
      getFromCache(`analysis:${message.asin}`)
        .then((data) => sendResponse({ success: true, data }))
        .catch(() => sendResponse({ success: false }));
      break;

    case 'OPEN_SIDE_PANEL':
      if (sender.tab?.id) {
        chrome.sidePanel.open({ tabId: sender.tab.id }).catch(console.error);
        chrome.storage.session.set({ 'session:currentAsin': message.asin });
      }
      sendResponse({ success: true });
      break;

    case 'KEEP_ALIVE':
      sendResponse({ success: true });
      break;

    case 'SET_API_KEY':
      chrome.storage.local.set(
        { 'settings:apiKey': message.apiKey },
        () => {
          sendResponse({ success: true });
        },
      );
      break;

    case 'GET_API_KEY_STATUS':
      getApiKey().then((key) => {
        sendResponse({ success: true, hasKey: !!key });
      });
      break;

    case 'SEARCH_EBAY':
      handleSearchEbay(message.query, message.amazonPriceCents, message.asin)
        .then(sendResponse)
        .catch((err) => {
          sendResponse({ success: false, error: String(err?.message || err) });
        });
      break;

    case 'SET_EBAY_CREDENTIALS':
      chrome.storage.local.set(
        {
          'settings:ebayClientId': message.clientId,
          'settings:ebayClientSecret': message.clientSecret,
        },
        () => {
          sendResponse({ success: true });
        },
      );
      break;

    case 'GET_EBAY_CREDENTIALS_STATUS':
      getEbayCredentials().then((creds) => {
        sendResponse({ success: true, hasCredentials: !!creds });
      });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
}

function handleAnalyzeProduct(
  asin: string,
  marketplace: string,
  url: string,
): Promise<AnalyzeProductResponse> {
  const existing = inflight.get(asin);
  if (existing) return existing;

  const promise = doAnalyzeProduct(asin, marketplace, url);
  inflight.set(asin, promise);
  promise.finally(() => inflight.delete(asin));
  return promise;
}

async function doAnalyzeProduct(
  asin: string,
  marketplace: string,
  url: string,
): Promise<AnalyzeProductResponse> {
  // Check full analysis cache first
  const cached = await getFromCache<AnalysisResult>(`analysis:${asin}`);
  if (cached) {
    await setSession(`session:analysis:${asin}`, cached);
    await setSession('session:currentAsin', asin);
    return { success: true, data: cached };
  }

  const result = await analyzeProduct(asin, marketplace, url);

  // Cache the complete analysis
  await setInCache(`analysis:${asin}`, result, CACHE_TTL.PRICING);

  // Write to session storage for sidepanel reactivity
  await setSession(`session:analysis:${asin}`, result);
  await setSession('session:currentAsin', asin);

  return { success: true, data: result };
}

function handleSearchEbay(
  query: string,
  amazonPriceCents: number,
  asin: string,
): Promise<SearchEbayResponse> {
  const key = `ebay:${asin}`;
  const existing = inflightEbay.get(key);
  if (existing) return existing;

  const promise = doSearchEbay(query, amazonPriceCents, asin);
  inflightEbay.set(key, promise);
  promise.finally(() => inflightEbay.delete(key));
  return promise;
}

async function doSearchEbay(
  query: string,
  amazonPriceCents: number,
  asin: string,
): Promise<SearchEbayResponse> {
  // Check cache first
  const cached = await getFromCache<EbaySearchResult>(`ebay:${asin}`);
  if (cached) {
    await setSession(`session:ebay:${asin}`, cached);
    return { success: true, data: cached };
  }

  const response = await searchEbay(query);
  const result = buildEbaySearchResult(query, response, amazonPriceCents);

  await setInCache(`ebay:${asin}`, result, CACHE_TTL.EBAY_SEARCH);
  await setSession(`session:ebay:${asin}`, result);

  return { success: true, data: result };
}
