import { AMAZON_PRODUCT_URL_PATTERN } from '@shared/constants';

/**
 * Extracts ASIN from the current Amazon product page.
 * Multi-strategy approach: URL regex -> canonical -> input -> data attribute.
 */
export function extractASIN(): string | null {
  // Strategy 1: URL pattern (sub-1ms)
  const urlMatch = location.pathname.match(AMAZON_PRODUCT_URL_PATTERN);
  if (urlMatch) return urlMatch[1];

  // Strategy 2: Canonical link
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    const href = (canonical as HTMLLinkElement).href;
    const m = href.match(/\/dp\/([A-Z0-9]{10})/);
    if (m) return m[1];
  }

  // Strategy 3: Hidden input
  const input = document.querySelector<HTMLInputElement>('input[name="ASIN"]');
  if (input?.value) return input.value;

  // Strategy 4: Data attribute
  const el = document.querySelector('[data-asin]');
  if (el) {
    const asin = (el as HTMLElement).dataset.asin;
    if (asin && asin.length === 10) return asin;
  }

  return null;
}
