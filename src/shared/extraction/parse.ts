import type { ExtractionResult, IdentifierKind } from '../types/batch';

const VALID_KINDS: IdentifierKind[] = ['asin', 'upc', 'ean', 'title'];

export function parseExtractionJson(text: string): ExtractionResult | null {
  const stripped = stripFences(text).trim();
  if (!stripped) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return null;
  }

  if (parsed === null || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;

  const idRaw = obj.identifier;
  let identifier: ExtractionResult['identifier'] = null;

  if (idRaw && typeof idRaw === 'object') {
    const kind = (idRaw as Record<string, unknown>).kind;
    const value = (idRaw as Record<string, unknown>).value;
    if (
      typeof kind === 'string' &&
      VALID_KINDS.includes(kind as IdentifierKind) &&
      typeof value === 'string' &&
      value.trim().length > 0
    ) {
      identifier = { kind: kind as IdentifierKind, value: value.trim() };
    } else {
      return null;
    }
  } else if (idRaw !== null && idRaw !== undefined) {
    return null;
  }

  const result: ExtractionResult = { identifier };
  if (typeof obj.retailPriceCents === 'number' && obj.retailPriceCents >= 0) {
    result.retailPriceCents = Math.round(obj.retailPriceCents);
  }
  if (typeof obj.storeName === 'string' && obj.storeName.trim()) {
    result.storeName = obj.storeName.trim();
  }
  if (typeof obj.notes === 'string' && obj.notes.trim()) {
    result.notes = obj.notes.trim();
  }
  return result;
}

function stripFences(text: string): string {
  // Remove ```json ... ``` fences if model added them despite instructions.
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
  const match = text.trim().match(fence);
  return match ? match[1] : text;
}
