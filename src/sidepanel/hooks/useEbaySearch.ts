import { useState, useEffect, useCallback, useRef } from 'react';
import type { AnalysisResult } from '@shared/types/messages';
import type { EbaySearchResult } from '@shared/types/ebay';

export interface EbaySearchState {
  ebayData: EbaySearchResult | null;
  loading: boolean;
  error: string | null;
  hasCredentials: boolean;
  refetch: () => void;
}

function cleanSearchQuery(title: string): string {
  // Remove common noise words and truncate to ~80 chars for better eBay results
  const cleaned = title
    .replace(/\([^)]*\)/g, '') // remove parenthetical text
    .replace(/\[[^\]]*\]/g, '') // remove bracketed text
    .replace(/,\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (cleaned.length <= 80) return cleaned;
  // Truncate at word boundary
  return cleaned.slice(0, 80).replace(/\s\S*$/, '').trim();
}

export function useEbaySearch(data: AnalysisResult | null): EbaySearchState {
  const [ebayData, setEbayData] = useState<EbaySearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCredentials, setHasCredentials] = useState(true);
  const fetchedAsinRef = useRef<string | null>(null);

  // Check eBay credentials on mount
  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: 'GET_EBAY_CREDENTIALS_STATUS' },
      (resp) => {
        if (resp?.success) setHasCredentials(resp.hasCredentials);
      },
    );
  }, []);

  const fetchEbayData = useCallback(
    (analysisData: AnalysisResult) => {
      const asin = analysisData.product.asin;

      setLoading(true);
      setError(null);

      // Check session cache first
      chrome.storage.session.get(`session:ebay:${asin}`, (result) => {
        const cached = result[`session:ebay:${asin}`] as
          | EbaySearchResult
          | undefined;
        if (cached) {
          setEbayData(cached);
          setLoading(false);
          fetchedAsinRef.current = asin;
          return;
        }

        const query = cleanSearchQuery(analysisData.product.title);
        const amazonPriceCents = analysisData.profitFba.sellPrice;

        chrome.runtime.sendMessage(
          {
            type: 'SEARCH_EBAY',
            query,
            amazonPriceCents,
            asin,
          },
          (response) => {
            setLoading(false);
            if (response?.success && response.data) {
              setEbayData(response.data);
              fetchedAsinRef.current = asin;
              if (!hasCredentials) setHasCredentials(true);
            } else {
              const err = response?.error ?? 'eBay search failed';
              setError(err);
              if (err === 'EBAY_CREDENTIALS_MISSING') {
                setHasCredentials(false);
              }
            }
          },
        );
      });
    },
    [hasCredentials],
  );

  // Auto-fetch when data is available and ASIN changes
  useEffect(() => {
    if (!data || !hasCredentials) return;
    if (fetchedAsinRef.current === data.product.asin) return;
    fetchEbayData(data);
  }, [data, hasCredentials, fetchEbayData]);

  const refetch = useCallback(() => {
    if (!data) return;
    const asin = data.product.asin;
    fetchedAsinRef.current = null;
    chrome.storage.local.remove(`ebay:${asin}`);
    chrome.storage.session.remove(`session:ebay:${asin}`);
    fetchEbayData(data);
  }, [data, fetchEbayData]);

  return { ebayData, loading, error, hasCredentials, refetch };
}
