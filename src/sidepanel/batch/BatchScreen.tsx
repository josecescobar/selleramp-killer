import { useMemo } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { Dropzone } from './Dropzone';
import { BatchRow } from './BatchRow';
import { useBatchJob } from '../hooks/useBatchJob';
import type { BatchItem } from '@shared/types/batch';
import { MAX_BATCH_SIZE } from '@shared/types/batch';

interface BatchScreenProps {
  onOpenSettings: () => void;
  onSelectAsin: (asin: string) => void;
}

export function BatchScreen({ onOpenSettings, onSelectAsin }: BatchScreenProps) {
  const { tokens: t } = useTheme();
  const { job, keys, start, cancel, reset } = useBatchJob();

  const counts = useMemo(() => {
    const items = job?.items ?? [];
    return {
      done: items.filter((i) => i.status === 'done').length,
      failed: items.filter((i) => i.status === 'failed' || i.status === 'skipped').length,
      total: items.length,
    };
  }, [job]);

  const missingKeys = !keys.hasRainforest || !keys.hasAnthropic;

  const handleRowClick = async (item: BatchItem) => {
    if (item.status !== 'done' || !item.asin || !item.analysis) return;
    await new Promise<void>((resolve) => {
      chrome.storage.session.set(
        {
          [`session:analysis:${item.asin}`]: item.analysis,
          'session:currentAsin': item.asin,
        },
        () => resolve(),
      );
    });
    onSelectAsin(item.asin);
  };

  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Batch Image Analysis</div>
        <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
          Upload up to {MAX_BATCH_SIZE} images. We detect the product, look it up on Amazon, and run the deal analyzer.
        </div>
      </div>

      {missingKeys && (
        <div
          style={{
            padding: '10px 12px',
            background: t.accentGlow,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 8,
            fontSize: 11,
            color: t.text,
            lineHeight: 1.5,
          }}
        >
          Batch needs both a Rainforest API key and an Anthropic API key.
          <button
            onClick={onOpenSettings}
            style={{
              marginLeft: 6,
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 700,
              color: '#fff',
              background: t.accent,
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Open settings
          </button>
        </div>
      )}

      {!job && (
        <Dropzone onFiles={(files) => start(files).catch(() => {})} disabled={missingKeys} />
      )}

      {job && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              color: t.textMuted,
            }}
          >
            <span>
              {counts.done} of {counts.total} done
              {counts.failed > 0 && ` · ${counts.failed} skipped/failed`}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {job.status === 'running' && (
                <button
                  onClick={cancel}
                  style={{
                    padding: '4px 10px',
                    fontSize: 10,
                    fontWeight: 600,
                    background: t.card,
                    color: t.textMuted,
                    border: `1px solid ${t.cardBorder}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={reset}
                style={{
                  padding: '4px 10px',
                  fontSize: 10,
                  fontWeight: 600,
                  background: t.card,
                  color: t.textMuted,
                  border: `1px solid ${t.cardBorder}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Clear
              </button>
            </div>
          </div>

          <div
            style={{
              border: `1px solid ${t.cardBorder}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {job.items.map((item) => (
              <BatchRow key={item.id} item={item} onClick={handleRowClick} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
