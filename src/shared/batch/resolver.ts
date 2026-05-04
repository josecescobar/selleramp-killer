import type { ExtractedIdentifier } from '../types/batch';
import { searchAndPickAsin } from '../api/rainforest';

const ASIN_RE = /^[A-Z0-9]{10}$/;

export interface ResolverDeps {
  apiKey: string;
  marketplace: string;
}

export async function resolveAsin(
  id: ExtractedIdentifier,
  deps: ResolverDeps,
): Promise<string | null> {
  switch (id.kind) {
    case 'asin': {
      const cleaned = id.value.trim().toUpperCase();
      return ASIN_RE.test(cleaned) ? cleaned : null;
    }
    case 'upc':
    case 'ean':
    case 'title': {
      return searchAndPickAsin(deps.apiKey, id.value, deps.marketplace);
    }
    default:
      return null;
  }
}
