import type { AnalysisResult } from '@shared/types/messages';
import { runAnalysis } from '@shared/analysis/run-analysis';
import { getApiKey } from './rainforest-client';
import { getFromCache, setInCache, getSnapshots } from '../storage';

export async function analyzeProduct(
  asin: string,
  marketplace: string,
  _url: string,
): Promise<AnalysisResult> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('API_KEY_MISSING');

  return runAnalysis(asin, {
    apiKey,
    marketplace,
    getCache: getFromCache,
    setCache: setInCache,
    getSnapshots,
  });
}
