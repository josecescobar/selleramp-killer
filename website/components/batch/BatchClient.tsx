'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BatchJob, BatchItem } from '@shared/types/batch';
import { MAX_BATCH_SIZE } from '@shared/types/batch';
import { runBatch, type RunningBatch } from '@shared/batch/orchestrator';
import { extractFromImage } from '@shared/extraction/claude-client';
import { resolveAsin } from '@shared/batch/resolver';
import { runAnalysis } from '@shared/analysis/run-analysis';
import {
  getAnthropicKey,
  getRainforestKey,
  setAnthropicKey,
  setRainforestKey,
} from '@/lib/batch-keys';

const MARKETPLACE = 'ATVPDKIKX0DER';

export function BatchClient() {
  const [job, setJob] = useState<BatchJob | null>(null);
  const [rfKey, setRfKey] = useState('');
  const [anthKey, setAnthKey] = useState('');
  const [editingKeys, setEditingKeys] = useState(false);
  const runningRef = useRef<RunningBatch | null>(null);

  useEffect(() => {
    setRfKey(getRainforestKey() ?? '');
    setAnthKey(getAnthropicKey() ?? '');
  }, []);

  const hasKeys = !!rfKey && !!anthKey;
  const showKeyPrompt = !hasKeys || editingKeys;

  const onFiles = useCallback(
    (files: File[]) => {
      const rf = getRainforestKey();
      const anth = getAnthropicKey();
      if (!rf || !anth) return;
      runningRef.current?.cancel();
      const running = runBatch(files, {
        extract: (image) => extractFromImage(image, { apiKey: anth }),
        resolveAsin: (id) => resolveAsin(id, { apiKey: rf, marketplace: MARKETPLACE }),
        analyze: (asin) =>
          runAnalysis(asin, {
            apiKey: rf,
            marketplace: MARKETPLACE,
          }),
        onChange: (j) => setJob({ ...j, items: j.items.map((i) => ({ ...i })) }),
        concurrency: 3,
      });
      runningRef.current = running;
    },
    [],
  );

  const counts = useMemo(() => {
    const items = job?.items ?? [];
    return {
      done: items.filter((i) => i.status === 'done').length,
      failed: items.filter((i) => i.status === 'failed' || i.status === 'skipped').length,
      total: items.length,
    };
  }, [job]);

  const saveKeys = () => {
    setRainforestKey(rfKey.trim());
    setAnthropicKey(anthKey.trim());
    setEditingKeys(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Batch Image Analysis</h1>
        <p className="text-text-muted text-sm mt-1">
          Upload up to {MAX_BATCH_SIZE} images. We detect the product, look it up on Amazon, and run the deal analyzer.
        </p>
      </div>

      {showKeyPrompt && (
        <div className="rounded-lg border border-card-border bg-card p-4 space-y-3">
          <div className="text-sm text-text-primary font-semibold">API keys</div>
          <p className="text-xs text-text-muted leading-relaxed">
            Personal-use only. Keys are stored in your browser&apos;s localStorage and sent
            directly to Rainforest and Anthropic from this page.
          </p>
          <label className="block">
            <span className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">
              Rainforest API key
            </span>
            <input
              type="password"
              value={rfKey}
              onChange={(e) => setRfKey(e.target.value)}
              className="mt-1 w-full bg-bg border border-card-border rounded px-3 py-2 text-sm text-text-primary font-mono"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">
              Anthropic API key
            </span>
            <input
              type="password"
              value={anthKey}
              onChange={(e) => setAnthKey(e.target.value)}
              className="mt-1 w-full bg-bg border border-card-border rounded px-3 py-2 text-sm text-text-primary font-mono"
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={saveKeys}
              disabled={!rfKey.trim() || !anthKey.trim()}
              className="btn-gradient text-white text-sm font-medium px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save keys
            </button>
            {hasKeys && (
              <button
                onClick={() => setEditingKeys(false)}
                className="text-sm text-text-muted px-4 py-2 border border-card-border rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {!showKeyPrompt && (
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Keys saved.</span>
          <button onClick={() => setEditingKeys(true)} className="text-accent hover:underline">
            Edit keys
          </button>
        </div>
      )}

      {!job && hasKeys && !editingKeys && <Dropzone onFiles={onFiles} />}

      {job && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>
              {counts.done} of {counts.total} done
              {counts.failed > 0 && ` · ${counts.failed} skipped/failed`}
            </span>
            <div className="flex gap-2">
              {job.status === 'running' && (
                <button
                  onClick={() => runningRef.current?.cancel()}
                  className="text-xs px-3 py-1 border border-card-border rounded text-text-muted"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  runningRef.current?.cancel();
                  runningRef.current = null;
                  setJob(null);
                }}
                className="text-xs px-3 py-1 border border-card-border rounded text-text-muted"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="border border-card-border rounded-lg overflow-hidden">
            {job.items.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Dropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const accept = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (arr.length > 0) onFiles(arr.slice(0, MAX_BATCH_SIZE));
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        accept(e.dataTransfer.files);
      }}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
        hover ? 'border-accent bg-accent/10' : 'border-card-border bg-card'
      }`}
    >
      <div className="text-4xl">{'📸'}</div>
      <div className="text-sm font-semibold text-text-primary mt-3">Drop images here</div>
      <div className="text-xs text-text-muted mt-1">
        or click to choose (up to {MAX_BATCH_SIZE})
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          accept(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />
    </div>
  );
}

function Row({ item }: { item: BatchItem }) {
  const a = item.analysis;
  const sellPrice = a?.profitFba.sellPrice ?? 0;
  const profit = a?.profitFba.profit ?? 0;
  const roi = a?.profitFba.roi ?? 0;
  const score = a?.dealScore.score;
  const title = a?.product.title ?? item.extraction?.identifier?.value ?? item.fileName;

  return (
    <div className="w-full flex items-center gap-3 p-3 border-b border-divider">
      <div className="w-12 h-12 rounded bg-bg border border-card-border overflow-hidden flex-shrink-0">
        {item.thumbnailDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnailDataUrl} alt="" className="w-full h-full object-cover" />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">{title}</div>
        <div className="text-xs text-text-muted mt-0.5 flex gap-2 items-center">
          <StatusPill status={item.status} />
          {item.asin && (
            <a
              href={`https://www.amazon.com/dp/${item.asin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline font-mono"
            >
              {item.asin}
            </a>
          )}
          {item.error && <span className="text-red-500">{item.error}</span>}
        </div>
      </div>
      {a && (
        <div className="text-right shrink-0">
          <div className={`text-sm font-bold ${profit > 0 ? 'text-green-600' : 'text-red-500'}`}>
            ${(profit / 100).toFixed(2)}
          </div>
          <div className="text-xs text-text-muted">
            {roi}% · ${(sellPrice / 100).toFixed(2)}
          </div>
          {typeof score === 'number' && (
            <div className="text-[10px] text-text-muted">score {score}</div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: BatchItem['status'] }) {
  const cls: Record<BatchItem['status'], string> = {
    pending: 'bg-gray-200 text-gray-700',
    extracting: 'bg-blue-100 text-blue-700',
    extracted: 'bg-blue-100 text-blue-700',
    resolving: 'bg-blue-100 text-blue-700',
    resolved: 'bg-blue-100 text-blue-700',
    analyzing: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    skipped: 'bg-gray-200 text-gray-700',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${cls[status]}`}>
      {status}
    </span>
  );
}
