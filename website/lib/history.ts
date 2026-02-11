'use client';

import { useState, useEffect, useCallback } from 'react';

export interface HistoryEntry {
  id: string;
  title: string;
  asin: string;
  upc?: string;
  category?: string;
  timestamp: string;
}

const HISTORY_KEY = 'sourcetool_history';
const SEED_HISTORY_KEY = 'sourcetool_history_seeded';

const SAMPLE_HISTORY: HistoryEntry[] = [
  {
    id: '1',
    title: 'Nike Air Max 90 Essential White/Black - Men\'s Size 10',
    asin: 'B08XYZ1234',
    upc: '194501234567',
    category: 'Clothing, Shoes & Jewelry',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    title: 'Jordan Big Kid\'s 4 Retro SE Craft Medium Olive/Pale Vanilla (FB9928 200) - 3.5',
    asin: 'B0CP8KDT4G',
    upc: '196969273644',
    category: 'Clothing, Shoes & Jewelry',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    title: 'LEGO Star Wars Millennium Falcon 75375 Building Set',
    asin: 'B0CTP1YRWZ',
    upc: '673419388924',
    category: 'Toys & Games',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '4',
    title: 'Apple AirPods Pro (2nd Generation) USB-C',
    asin: 'B0D1XD1ZV3',
    upc: '195949052453',
    category: 'Electronics',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '5',
    title: 'Stanley Quencher H2.0 FlowState Tumbler 40oz',
    asin: 'B0BX5DG18G',
    upc: '191091994567',
    category: 'Kitchen & Dining',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: '6',
    title: 'Nike Women\'s Shox R4 Sneaker, White Metallic Silver Max Orange',
    asin: 'B07QRY7SG9',
    upc: '192499227331',
    category: 'Clothing, Shoes & Jewelry',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: '7',
    title: 'Dyson V15 Detect Extra Cordless Vacuum Cleaner',
    asin: 'B0C7TYR9RN',
    category: 'Home & Kitchen',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: '8',
    title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    asin: 'B09XS7JWHH',
    upc: '027242923782',
    category: 'Electronics',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];

function seedHistory() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SEED_HISTORY_KEY)) return;
  const existing = localStorage.getItem(HISTORY_KEY);
  if (!existing || existing === '[]') {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(SAMPLE_HISTORY));
  }
  localStorage.setItem(SEED_HISTORY_KEY, '1');
}

function getStoredHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  seedHistory();
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(getStoredHistory());
  }, []);

  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...getStoredHistory()];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setEntries(updated);
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.setItem(HISTORY_KEY, '[]');
    setEntries([]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    const updated = getStoredHistory().filter((e) => e.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setEntries(updated);
  }, []);

  return { entries, addEntry, clearHistory, removeEntry };
}
