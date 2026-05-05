'use client';

import { useEffect, useState } from 'react';
import { fetchKeepaProduct, type KeepaProductResult } from '@shared/api/keepa';
import { getKeepaKey } from './batch-keys';

const ASIN_RE = /^B0[A-Z0-9]{8}$/i;

export interface KeepaResultState {
  data: KeepaProductResult | null;
  loading: boolean;
  error: string | null;
  hasKey: boolean | null;
  isRealAsin: boolean;
}

export function useKeepaResult(asin: string): KeepaResultState {
  const [state, setState] = useState<KeepaResultState>({
    data: null,
    loading: false,
    error: null,
    hasKey: null,
    isRealAsin: ASIN_RE.test(asin),
  });

  useEffect(() => {
    const isRealAsin = ASIN_RE.test(asin);
    if (!isRealAsin) {
      setState({ data: null, loading: false, error: null, hasKey: null, isRealAsin });
      return;
    }
    const apiKey = getKeepaKey();
    if (!apiKey) {
      setState({ data: null, loading: false, error: null, hasKey: false, isRealAsin });
      return;
    }
    let cancelled = false;
    setState({ data: null, loading: true, error: null, hasKey: true, isRealAsin });
    fetchKeepaProduct({ apiKey, asin })
      .then((data) => {
        if (cancelled) return;
        setState({ data, loading: false, error: null, hasKey: true, isRealAsin });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : String(err),
          hasKey: true,
          isRealAsin,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [asin]);

  return state;
}
