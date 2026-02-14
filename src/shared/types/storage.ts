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
