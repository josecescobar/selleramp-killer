'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UserSettings {
  // Amazon Specific
  marketplace: string;
  inboundFbaShipping: string;
  inboundPlacement: string;
  usePeakStorageFees: boolean;
  storageMonths: string;
  fulfillmentType: 'FBA' | 'FBM';

  // Buying Criteria
  minBsr: string;
  maxBsr: string;
  minProfit: string;
  minRoi: string;

  // Additional Costs
  prepFee: string;
  miscFee: string;
  miscFeePercent: string;

  // Display
  theme: 'dark' | 'light';
  compactMode: boolean;

  // Panels
  showQuickInfo: boolean;
  showAlerts: boolean;
  showOffers: boolean;
  showCharts: boolean;
  showRanksPrices: boolean;
  showProfitCalc: boolean;
  showNotesTags: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  marketplace: 'amazon.com',
  inboundFbaShipping: '0.00',
  inboundPlacement: 'optimized',
  usePeakStorageFees: false,
  storageMonths: '0',
  fulfillmentType: 'FBA',
  minBsr: '0',
  maxBsr: '2',
  minProfit: '3.00',
  minRoi: '25',
  prepFee: '0.00',
  miscFee: '0.00',
  miscFeePercent: '0',
  theme: 'dark',
  compactMode: false,
  showQuickInfo: true,
  showAlerts: true,
  showOffers: true,
  showCharts: true,
  showRanksPrices: true,
  showProfitCalc: true,
  showNotesTags: true,
};

const SETTINGS_KEY = 'sourcetool_settings';

function getStoredSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(getStoredSettings());
  }, []);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    const updated = { ...getStoredSettings(), ...partial };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    setSettings(updated);
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, updateSettings, resetSettings };
}
