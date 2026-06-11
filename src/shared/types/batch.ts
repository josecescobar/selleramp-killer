import type { AnalysisResult } from './messages';

export type ItemStatus =
  | 'pending'
  | 'extracting'
  | 'extracted'
  | 'resolving'
  | 'resolved'
  | 'analyzing'
  | 'done'
  | 'failed'
  | 'skipped';

export type IdentifierKind = 'asin' | 'upc' | 'ean' | 'title';

export interface ExtractedIdentifier {
  kind: IdentifierKind;
  value: string;
}

export interface ExtractionResult {
  identifier: ExtractedIdentifier | null;
  retailPriceCents?: number;
  storeName?: string;
  notes?: string;
}

export interface BatchItem {
  id: string;
  fileName: string;
  thumbnailDataUrl: string;
  status: ItemStatus;
  extraction?: ExtractionResult;
  asin?: string;
  analysis?: AnalysisResult;
  error?: string;
  startedAt?: number;
  finishedAt?: number;
}

export type BatchJobStatus = 'idle' | 'running' | 'cancelled' | 'complete';

export interface BatchJob {
  id: string;
  createdAt: number;
  items: BatchItem[];
  concurrency: number;
  status: BatchJobStatus;
}

export const MAX_BATCH_SIZE = 25;
