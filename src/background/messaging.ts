import type {
  ExtensionMessage,
  AnalyzeProductResponse,
  AnalysisResult,
} from '@shared/types/messages';
import { getFromCache, setInCache, setSession } from './storage';
import { CACHE_TTL } from '@shared/constants';
import { analyzeProduct } from './api/analyze-product';
import { getApiKey } from './api/rainforest-client';

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

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
}

async function handleAnalyzeProduct(
  asin: string,
  marketplace: string,
  url: string,
): Promise<AnalyzeProductResponse> {
  // Set ASIN immediately so sidepanel knows we're on a product page
  await setSession('session:currentAsin', asin);

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
