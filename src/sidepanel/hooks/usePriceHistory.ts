import { useState, useEffect, useMemo } from 'react';
import type { PriceSnapshot } from '@shared/types/messages';

export type Period = '1M' | '3M' | '6M' | '1Y' | 'ALL';

const PERIOD_MS: Record<Period, number> = {
  '1M': 30 * 24 * 60 * 60 * 1000,
  '3M': 90 * 24 * 60 * 60 * 1000,
  '6M': 180 * 24 * 60 * 60 * 1000,
  '1Y': 365 * 24 * 60 * 60 * 1000,
  ALL: Infinity,
};

export interface Stats {
  high: number;
  low: number;
  avg: number;
  changePct: number;
}

function computeStats(values: number[]): Stats {
  if (values.length === 0) return { high: 0, low: 0, avg: 0, changePct: 0 };
  const high = Math.max(...values);
  const low = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const first = values[0];
  const last = values[values.length - 1];
  const changePct = first !== 0 ? ((last - first) / first) * 100 : 0;
  return { high, low, avg, changePct };
}

export function usePriceHistory(asin: string | undefined) {
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('ALL');

  useEffect(() => {
    if (!asin) {
      setSnapshots([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    chrome.runtime
      .sendMessage({ type: 'GET_PRODUCT_HISTORY', asin })
      .then((res: { success: boolean; data?: PriceSnapshot[] }) => {
        setSnapshots(res?.data ?? []);
      })
      .catch(() => setSnapshots([]))
      .finally(() => setLoading(false));
  }, [asin]);

  const filtered = useMemo(() => {
    if (period === 'ALL') return snapshots;
    const cutoff = Date.now() - PERIOD_MS[period];
    return snapshots.filter((s) => s.ts >= cutoff);
  }, [snapshots, period]);

  const priceStats = useMemo(
    () => computeStats(filtered.map((s) => s.price)),
    [filtered],
  );

  const bsrStats = useMemo(
    () => computeStats(filtered.map((s) => s.bsr)),
    [filtered],
  );

  return { snapshots, filtered, priceStats, bsrStats, loading, period, setPeriod };
}
