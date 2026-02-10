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

// --- Price History Snapshots ---

import type { PriceSnapshot } from '@shared/types/messages';

const DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SNAPSHOTS = 5000;

export async function appendSnapshot(
  asin: string,
  snapshot: PriceSnapshot,
): Promise<void> {
  const key = `history:${asin}`;
  const existing = await new Promise<PriceSnapshot[]>((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve((result[key] as PriceSnapshot[]) ?? []);
    });
  });

  // Deduplicate: skip if last snapshot is within 10 minutes
  const last = existing[existing.length - 1];
  if (last && snapshot.ts - last.ts < DEDUP_WINDOW_MS) {
    return;
  }

  existing.push(snapshot);

  // Cap at MAX_SNAPSHOTS (keep most recent)
  const trimmed =
    existing.length > MAX_SNAPSHOTS
      ? existing.slice(existing.length - MAX_SNAPSHOTS)
      : existing;

  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: trimmed }, resolve);
  });
}

export async function getSnapshots(asin: string): Promise<PriceSnapshot[]> {
  const key = `history:${asin}`;
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve((result[key] as PriceSnapshot[]) ?? []);
    });
  });
}
