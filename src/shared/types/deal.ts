export type ScoreLabel = 'BUY' | 'MAYBE' | 'RISKY' | 'PASS';

export interface DealScore {
  score: number;
  label: ScoreLabel;
  confidence: number;
  factors: ScoreFactor[];
  summary?: string;
}

export interface ScoreFactor {
  name: string;
  value: number;
  impact: number;
  description: string;
}

export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 80) return 'BUY';
  if (score >= 60) return 'MAYBE';
  if (score >= 40) return 'RISKY';
  return 'PASS';
}
