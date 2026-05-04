import type {
  BatchItem,
  BatchJob,
  ExtractionResult,
  ExtractedIdentifier,
} from '../types/batch';
import { MAX_BATCH_SIZE } from '../types/batch';
import type { AnalysisResult } from '../types/messages';
import { prepareImage, type PreparedFile } from './image-prep';

export interface OrchestratorDeps {
  extract: (image: PreparedFile['forExtraction']) => Promise<ExtractionResult | null>;
  resolveAsin: (id: ExtractedIdentifier) => Promise<string | null>;
  analyze: (asin: string) => Promise<AnalysisResult>;
  onChange: (job: BatchJob) => void;
  concurrency?: number;
}

export interface RunningBatch {
  job: BatchJob;
  cancel: () => void;
  done: Promise<void>;
}

export function runBatch(files: File[], deps: OrchestratorDeps): RunningBatch {
  const limited = files.slice(0, MAX_BATCH_SIZE);
  const concurrency = Math.max(1, Math.min(deps.concurrency ?? 3, 6));

  const job: BatchJob = {
    id: makeId(),
    createdAt: Date.now(),
    items: limited.map((f) => ({
      id: makeId(),
      fileName: f.name,
      thumbnailDataUrl: '',
      status: 'pending',
    })),
    concurrency,
    status: 'running',
  };

  let cancelled = false;
  const cancel = () => {
    cancelled = true;
    if (job.status === 'running') {
      job.status = 'cancelled';
      deps.onChange(job);
    }
  };

  const emit = () => deps.onChange(job);
  emit();

  const done = (async () => {
    let cursor = 0;
    const workers = Array.from({ length: concurrency }, async () => {
      while (true) {
        if (cancelled) return;
        const i = cursor++;
        if (i >= limited.length) return;
        await processOne(limited[i], job.items[i], deps, emit, () => cancelled);
      }
    });
    await Promise.all(workers);
    if (!cancelled) {
      job.status = 'complete';
      emit();
    }
  })();

  return { job, cancel, done };
}

async function processOne(
  file: File,
  item: BatchItem,
  deps: OrchestratorDeps,
  emit: () => void,
  isCancelled: () => boolean,
): Promise<void> {
  item.startedAt = Date.now();

  // 1) Prepare image (resize + thumbnail)
  let prepared: PreparedFile;
  try {
    prepared = await prepareImage(file);
    item.thumbnailDataUrl = prepared.thumbnailDataUrl;
  } catch (err) {
    return finish(item, 'failed', errorMessage(err), emit);
  }
  if (isCancelled()) return;

  // 2) Extract identifier via Claude vision
  item.status = 'extracting';
  emit();
  let extraction: ExtractionResult | null;
  try {
    extraction = await deps.extract(prepared.forExtraction);
  } catch (err) {
    return finish(item, 'failed', errorMessage(err), emit);
  }
  if (isCancelled()) return;
  if (!extraction || !extraction.identifier) {
    return finish(item, 'skipped', 'No product detected', emit, { extraction: extraction ?? undefined });
  }
  item.extraction = extraction;
  item.status = 'extracted';
  emit();

  // 3) Resolve to ASIN
  item.status = 'resolving';
  emit();
  let asin: string | null;
  try {
    asin = await deps.resolveAsin(extraction.identifier);
  } catch (err) {
    return finish(item, 'failed', errorMessage(err), emit);
  }
  if (isCancelled()) return;
  if (!asin) {
    return finish(item, 'failed', 'Could not resolve ASIN', emit);
  }
  item.asin = asin;
  item.status = 'resolved';
  emit();

  // 4) Analyze
  item.status = 'analyzing';
  emit();
  try {
    const analysis = await deps.analyze(asin);
    item.analysis = analysis;
  } catch (err) {
    return finish(item, 'failed', errorMessage(err), emit);
  }
  if (isCancelled()) return;

  finish(item, 'done', undefined, emit);
}

function finish(
  item: BatchItem,
  status: BatchItem['status'],
  error: string | undefined,
  emit: () => void,
  extra: Partial<BatchItem> = {},
): void {
  item.status = status;
  if (error) item.error = error;
  Object.assign(item, extra);
  item.finishedAt = Date.now();
  emit();
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
