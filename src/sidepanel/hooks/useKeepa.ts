import { useEffect, useRef, useState } from 'react';
import {
  fetchKeepaProduct,
  generateMockKeepaProduct,
  type KeepaProductResult,
} from '@shared/api/keepa';

interface KeepaState {
  data: KeepaProductResult | null;
  loading: boolean;
  error: string | null;
  hasKey: boolean | null;
  isDemo: boolean;
}

const CACHE_TTL_MS = 60 * 60 * 1000;

interface CachedKeepaEntry {
  ts: number;
  data: KeepaProductResult;
}

async function getKeepaKey(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get('settings:keepaApiKey', (r) =>
      resolve(r['settings:keepaApiKey'] ?? null),
    );
  });
}

async function getCached(asin: string): Promise<KeepaProductResult | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(`keepa:product:${asin}`, (r) => {
      const entry = r[`keepa:product:${asin}`] as CachedKeepaEntry | undefined;
      if (!entry) return resolve(null);
      if (Date.now() - entry.ts > CACHE_TTL_MS) return resolve(null);
      resolve(entry.data);
    });
  });
}

async function setCached(asin: string, data: KeepaProductResult): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      { [`keepa:product:${asin}`]: { ts: Date.now(), data } },
      () => resolve(),
    );
  });
}

export function useKeepa(asin: string | null): KeepaState & { refetch: () => void } {
  const [state, setState] = useState<KeepaState>({
    data: null,
    loading: false,
    error: null,
    hasKey: null,
    isDemo: false,
  });
  const lastAsin = useRef<string | null>(null);
  const lastFetchedAt = useRef<number>(0);

  const load = async (targetAsin: string, forceFresh = false) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const apiKey = await getKeepaKey();
    if (!apiKey) {
      setState({
        data: generateMockKeepaProduct(targetAsin),
        loading: false,
        error: null,
        hasKey: false,
        isDemo: true,
      });
      return;
    }
    if (!forceFresh) {
      const cached = await getCached(targetAsin);
      if (cached) {
        setState({ data: cached, loading: false, error: null, hasKey: true, isDemo: false });
        return;
      }
    }
    try {
      const data = await fetchKeepaProduct({ apiKey, asin: targetAsin });
      await setCached(targetAsin, data);
      lastFetchedAt.current = Date.now();
      setState({ data, loading: false, error: null, hasKey: true, isDemo: false });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
        hasKey: true,
        isDemo: false,
      });
    }
  };

  useEffect(() => {
    if (!asin) {
      setState({ data: null, loading: false, error: null, hasKey: null, isDemo: false });
      lastAsin.current = null;
      return;
    }
    if (lastAsin.current === asin) return;
    lastAsin.current = asin;
    load(asin);
  }, [asin]);

  const refetch = () => {
    if (asin) load(asin, true);
  };

  return { ...state, refetch };
}
