'use client';

import { useEffect, useState } from 'react';
import {
  fetchKeepaProduct,
  generateMockKeepaProduct,
  type KeepaProductResult,
} from '@shared/api/keepa';
import { getKeepaKey } from './batch-keys';

const ASIN_RE = /^B0[A-Z0-9]{8}$/i;

export interface KeepaResultState {
  data: KeepaProductResult | null;
  loading: boolean;
  error: string | null;
  hasKey: boolean | null;
  isRealAsin: boolean;
  isDemo: boolean;
}

export function useKeepaResult(asin: string): KeepaResultState {
  const [state, setState] = useState<KeepaResultState>({
    data: null,
    loading: false,
    error: null,
    hasKey: null,
    isRealAsin: ASIN_RE.test(asin),
    isDemo: false,
  });

  useEffect(() => {
    const isRealAsin = ASIN_RE.test(asin);
    if (!isRealAsin) {
      setState({
        data: null,
        loading: false,
        error: null,
        hasKey: null,
        isRealAsin,
        isDemo: false,
      });
      return;
    }
    const apiKey = getKeepaKey();
    if (!apiKey) {
      // Fall back to deterministic synthetic data so the UI is reviewable.
      setState({
        data: generateMockKeepaProduct(asin),
        loading: false,
        error: null,
        hasKey: false,
        isRealAsin,
        isDemo: true,
      });
      return;
    }
    let cancelled = false;
    setState({
      data: null,
      loading: true,
      error: null,
      hasKey: true,
      isRealAsin,
      isDemo: false,
    });
    fetchKeepaProduct({ apiKey, asin })
      .then((data) => {
        if (cancelled) return;
        setState({
          data,
          loading: false,
          error: null,
          hasKey: true,
          isRealAsin,
          isDemo: false,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : String(err),
          hasKey: true,
          isRealAsin,
          isDemo: false,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [asin]);

  return state;
}
