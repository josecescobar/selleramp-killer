import { useState, useEffect, useCallback, useMemo } from 'react';
import type { BuyListItem } from '@shared/types/storage';

const STORAGE_KEY = 'buyList';

export interface BuyListState {
  items: BuyListItem[];
  loading: boolean;
  isInList: (asin: string) => boolean;
  addItem: (item: BuyListItem) => void;
  removeItem: (asin: string) => void;
  clearAll: () => void;
}

export function useBuyList(): BuyListState {
  const [items, setItems] = useState<BuyListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load on mount
  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const stored = result[STORAGE_KEY] as BuyListItem[] | undefined;
      if (stored) setItems(stored);
      setLoading(false);
    });
  }, []);

  // Sync across instances via onChanged
  useEffect(() => {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area === 'local' && changes[STORAGE_KEY]) {
        setItems(changes[STORAGE_KEY].newValue ?? []);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const asinSet = useMemo(() => new Set(items.map((i) => i.asin)), [items]);

  const isInList = useCallback((asin: string) => asinSet.has(asin), [asinSet]);

  const addItem = useCallback(
    (item: BuyListItem) => {
      const next = [item, ...items.filter((i) => i.asin !== item.asin)];
      setItems(next);
      chrome.storage.local.set({ [STORAGE_KEY]: next });
    },
    [items],
  );

  const removeItem = useCallback(
    (asin: string) => {
      const next = items.filter((i) => i.asin !== asin);
      setItems(next);
      chrome.storage.local.set({ [STORAGE_KEY]: next });
    },
    [items],
  );

  const clearAll = useCallback(() => {
    setItems([]);
    chrome.storage.local.set({ [STORAGE_KEY]: [] });
  }, []);

  return { items, loading, isInList, addItem, removeItem, clearAll };
}
