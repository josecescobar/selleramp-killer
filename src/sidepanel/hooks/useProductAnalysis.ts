import { useState, useEffect, useCallback, useRef } from 'react';
import type { AnalysisResult } from '@shared/types/messages';

export interface AnalysisState {
  data: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  asin: string | null;
  hasApiKey: boolean;
  refetch: () => void;
}

export function useProductAnalysis(): AnalysisState {
  const [asin, setAsin] = useState<string | null>(null);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  const skipCacheRef = useRef(false);

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

  const fetchAnalysis = useCallback((targetAsin: string) => {
    setLoading(true);
    setError(null);

    const shouldSkipCache = skipCacheRef.current;
    skipCacheRef.current = false;

    if (shouldSkipCache) {
      // Skip session cache — request fresh analysis directly
      requestAnalysis(targetAsin);
      return;
    }

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

        requestAnalysis(targetAsin);
      },
    );

    function requestAnalysis(asin: string) {
      chrome.runtime.sendMessage(
        {
          type: 'ANALYZE_PRODUCT',
          asin,
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
    }
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
    if (asin) {
      skipCacheRef.current = true;
      chrome.storage.local.remove(`analysis:${asin}`);
      chrome.storage.session.remove(`session:analysis:${asin}`);
      fetchAnalysis(asin);
    }
  }, [asin, fetchAnalysis]);

  return { data, loading, error, asin, hasApiKey, refetch };
}
