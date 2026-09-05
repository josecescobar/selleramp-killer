import { useState, useEffect, useCallback } from 'react';
import type { AnalysisResult } from '@shared/types/messages';
import { AMAZON_PRODUCT_URL_PATTERN } from '@shared/constants';

export interface AnalysisState {
  data: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  asin: string | null;
  hasApiKey: boolean;
  refetch: () => void;
}

function extractAsinFromUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    const match = pathname.match(AMAZON_PRODUCT_URL_PATTERN);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function useProductAnalysis(): AnalysisState {
  const [asin, setAsin] = useState<string | null>(null);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);

  // Check API key status on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_API_KEY_STATUS' }, (resp) => {
      if (resp?.success) setHasApiKey(resp.hasKey);
    });
  }, []);

  // Watch for ASIN changes from session storage
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage?.session) return;

    chrome.storage.session.get('session:currentAsin', (result) => {
      const current = result['session:currentAsin'];
      if (current) setAsin(current);
    });

    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes['session:currentAsin']) {
        setAsin(changes['session:currentAsin'].newValue);
      }
    };
    chrome.storage.session.onChanged.addListener(listener);
    return () => chrome.storage.session.onChanged.removeListener(listener);
  }, []);

  // Fallback: detect ASIN from active tab URL (handles cases where
  // content script hasn't run yet, e.g. extension just loaded)
  useEffect(() => {
    if (asin) return; // Already have an ASIN, no need for fallback

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) {
        const detected = extractAsinFromUrl(tab.url);
        if (detected) setAsin(detected);
      }
    });
  }, [asin]);

  // Listen for tab activation and URL changes to detect new products
  useEffect(() => {
    const handleActivated = (info: chrome.tabs.TabActiveInfo) => {
      chrome.tabs.get(info.tabId, (tab) => {
        if (tab?.url) {
          const detected = extractAsinFromUrl(tab.url);
          if (detected) {
            setAsin(detected);
            setData(null);
            setError(null);
          } else {
            setAsin(null);
            setData(null);
            setError(null);
          }
        }
      });
    };

    const handleUpdated = (
      _tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab,
    ) => {
      if (changeInfo.url && tab.active) {
        const detected = extractAsinFromUrl(changeInfo.url);
        if (detected) {
          setAsin(detected);
          setData(null);
          setError(null);
        } else {
          setAsin(null);
          setData(null);
          setError(null);
        }
      }
    };

    chrome.tabs.onActivated.addListener(handleActivated);
    chrome.tabs.onUpdated.addListener(handleUpdated);
    return () => {
      chrome.tabs.onActivated.removeListener(handleActivated);
      chrome.tabs.onUpdated.removeListener(handleUpdated);
    };
  }, []);

  const fetchAnalysis = useCallback((targetAsin: string) => {
    setLoading(true);
    setError(null);

    // Check if analysis is already in session storage
    chrome.storage.session.get(
      `session:analysis:${targetAsin}`,
      (result) => {
        const cached = result[`session:analysis:${targetAsin}`] as
          | AnalysisResult
          | undefined;
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }

        // Request fresh analysis from background
        chrome.runtime.sendMessage(
          {
            type: 'ANALYZE_PRODUCT',
            asin: targetAsin,
            marketplace: 'ATVPDKIKX0DER',
            url: '',
          },
          (response) => {
            setLoading(false);
            if (response?.success && response.data) {
              setData(response.data);
              if (!hasApiKey) setHasApiKey(true);
            } else {
              const err = response?.error ?? 'Analysis failed';
              setError(err);
              if (err === 'API_KEY_MISSING') setHasApiKey(false);
            }
          },
        );
      },
    );
  }, [hasApiKey]);

  // Fetch when ASIN changes
  useEffect(() => {
    if (asin) fetchAnalysis(asin);
  }, [asin, fetchAnalysis]);

  // Listen for analysis updates from background
  useEffect(() => {
    if (!asin) return;
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes[`session:analysis:${asin}`]?.newValue) {
        setData(changes[`session:analysis:${asin}`].newValue);
        setLoading(false);
      }
    };
    chrome.storage.session.onChanged.addListener(listener);
    return () => chrome.storage.session.onChanged.removeListener(listener);
  }, [asin]);

  const refetch = useCallback(() => {
    // Re-check API key status (key may have just been saved)
    chrome.runtime.sendMessage({ type: 'GET_API_KEY_STATUS' }, (resp) => {
      if (resp?.success) setHasApiKey(resp.hasKey);
    });

    if (asin) {
      chrome.storage.local.remove(`analysis:${asin}`);
      chrome.storage.session.remove(`session:analysis:${asin}`);
      fetchAnalysis(asin);
    }
  }, [asin, fetchAnalysis]);

  return { data, loading, error, asin, hasApiKey, refetch };
}
