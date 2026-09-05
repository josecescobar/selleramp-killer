export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  defaultFulfillment: 'FBA' | 'FBM';
  targetRoi: number;
  autoOpenPanel: boolean;
}

export interface BuyListItem {
  asin: string;
  title: string;
  imageUrl?: string;
  buyPriceCents: number;
  sellPriceCents: number;
  profitCents: number;
  roi: number;
  score: number;
  addedAt: number;
}
