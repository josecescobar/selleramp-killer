interface CacheEntry<T = unknown> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

export async function getFromCache<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      const entry = result[key] as CacheEntry<T> | undefined;
      if (!entry) {
        resolve(null);
        return;
      }
      if (Date.now() - entry.cachedAt > entry.ttlMs) {
        chrome.storage.local.remove(key);
        resolve(null);
        return;
      }
      resolve(entry.data);
    });
  });
}

export async function setInCache<T>(
  key: string,
  data: T,
  ttlMs: number,
): Promise<void> {
  const entry: CacheEntry<T> = { data, cachedAt: Date.now(), ttlMs };
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: entry }, resolve);
  });
}

export async function getSession<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    chrome.storage.session.get(key, (result) => {
      resolve((result[key] as T) ?? null);
    });
  });
}

export async function setSession(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.session.set({ [key]: value }, resolve);
  });
}
