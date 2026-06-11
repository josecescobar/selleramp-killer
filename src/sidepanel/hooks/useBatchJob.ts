import { useCallback, useEffect, useRef, useState } from 'react';
import type { BatchJob } from '@shared/types/batch';
import type { AnalysisResult } from '@shared/types/messages';
import { runBatch, type RunningBatch } from '@shared/batch/orchestrator';
import { extractFromImage } from '@shared/extraction/claude-client';
import { resolveAsin } from '@shared/batch/resolver';

const MARKETPLACE = 'ATVPDKIKX0DER';

async function getKey(name: string): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(name, (r) => resolve(r[name] ?? null));
  });
}

function analyzeViaBackground(asin: string): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'ANALYZE_PRODUCT', asin, marketplace: MARKETPLACE, url: '' },
      (response) => {
        const lastErr = chrome.runtime.lastError;
        if (lastErr) return reject(new Error(lastErr.message ?? 'MESSAGE_FAILED'));
        if (response?.success && response.data) resolve(response.data);
        else reject(new Error(response?.error ?? 'ANALYSIS_FAILED'));
      },
    );
  });
}

export interface BatchKeyStatus {
  hasRainforest: boolean;
  hasAnthropic: boolean;
}

export function useBatchJob() {
  const [job, setJob] = useState<BatchJob | null>(null);
  const [keys, setKeys] = useState<BatchKeyStatus>({
    hasRainforest: false,
    hasAnthropic: false,
  });
  const runningRef = useRef<RunningBatch | null>(null);

  const refreshKeys = useCallback(async () => {
    const [rf, anth] = await Promise.all([
      getKey('settings:apiKey'),
      getKey('settings:anthropicApiKey'),
    ]);
    setKeys({ hasRainforest: !!rf, hasAnthropic: !!anth });
  }, []);

  useEffect(() => {
    refreshKeys();
  }, [refreshKeys]);

  const start = useCallback(async (files: File[]) => {
    const [rfKey, anthKey] = await Promise.all([
      getKey('settings:apiKey'),
      getKey('settings:anthropicApiKey'),
    ]);
    if (!rfKey || !anthKey) {
      throw new Error('MISSING_KEYS');
    }
    runningRef.current?.cancel();

    const running = runBatch(files, {
      extract: (image) => extractFromImage(image, { apiKey: anthKey }),
      resolveAsin: (id) => resolveAsin(id, { apiKey: rfKey, marketplace: MARKETPLACE }),
      analyze: analyzeViaBackground,
      onChange: (j) => setJob({ ...j, items: j.items.map((i) => ({ ...i })) }),
      concurrency: 3,
    });
    runningRef.current = running;
  }, []);

  const cancel = useCallback(() => {
    runningRef.current?.cancel();
  }, []);

  const reset = useCallback(() => {
    runningRef.current?.cancel();
    runningRef.current = null;
    setJob(null);
  }, []);

  return { job, keys, refreshKeys, start, cancel, reset };
}
