import type { DealScore, ScoreFactor } from '@shared/types/deal';
import { getScoreLabel } from '@shared/types/deal';
import type { ProfitCalculation } from '@shared/types/fees';
import type { BuyBoxInfo, Offer } from '@shared/types/offers';
import type { BsrInfo, SalesEstimate } from '@shared/types/messages';
import type { Product } from '@shared/types/product';

export interface ScoringInput {
  profitFba: ProfitCalculation;
  profitFbm: ProfitCalculation;
  bsr: BsrInfo;
  sales: SalesEstimate;
  buyBox: BuyBoxInfo | null;
  offers: Offer[];
  product: Product;
}

/**
 * Calculate deal score (0-100) based on weighted factors.
 *
 * Weights (total = 100):
 *   ROI:          25
 *   Profit $:     15
 *   BSR:          20
 *   Sales volume: 15
 *   Competition:  15
 *   Buy Box:      10
 */
export function calculateDealScore(input: ScoringInput): DealScore {
  const factors: ScoreFactor[] = [];
  let totalScore = 0;

  // 1. ROI (weight 25)
  const bestRoi = Math.max(input.profitFba.roi, input.profitFbm.roi);
  const roiScore = clamp(bestRoi / 2, 0, 100); // 200% ROI = perfect
  const roiImpact = Math.round(roiScore * 0.25);
  factors.push({
    name: 'ROI',
    value: bestRoi,
    impact: roiImpact,
    description: `Best ROI: ${bestRoi}%`,
  });
  totalScore += roiImpact;

  // 2. Profit $ (weight 15)
  const bestProfit = Math.max(input.profitFba.profit, input.profitFbm.profit);
  const profitDollars = bestProfit / 100;
  const profitScore = clamp((profitDollars / 15) * 100, 0, 100); // $15+ = perfect
  const profitImpact = Math.round(profitScore * 0.15);
  factors.push({
    name: 'Profit',
    value: bestProfit,
    impact: profitImpact,
    description: `Best profit: $${profitDollars.toFixed(2)}`,
  });
  totalScore += profitImpact;

  // 3. BSR (weight 20)
  let bsrScore = 0;
  if (input.bsr.rank > 0) {
    if (input.bsr.rank <= 5000) bsrScore = 100;
    else if (input.bsr.rank <= 20000) bsrScore = 85;
    else if (input.bsr.rank <= 50000) bsrScore = 70;
    else if (input.bsr.rank <= 100000) bsrScore = 50;
    else if (input.bsr.rank <= 200000) bsrScore = 30;
    else bsrScore = 10;
  }
  const bsrImpact = Math.round(bsrScore * 0.2);
  factors.push({
    name: 'BSR',
    value: input.bsr.rank,
    impact: bsrImpact,
    description: `BSR #${input.bsr.rank.toLocaleString()} in ${input.bsr.category}`,
  });
  totalScore += bsrImpact;

  // 4. Sales volume (weight 15)
  const monthly = input.sales.monthlySales;
  let salesScore = 0;
  if (monthly >= 300) salesScore = 100;
  else if (monthly >= 150) salesScore = 80;
  else if (monthly >= 50) salesScore = 60;
  else if (monthly >= 20) salesScore = 40;
  else if (monthly >= 5) salesScore = 20;
  else salesScore = 5;
  const salesImpact = Math.round(salesScore * 0.15);
  factors.push({
    name: 'Sales Volume',
    value: monthly,
    impact: salesImpact,
    description: `~${monthly} sales/month`,
  });
  totalScore += salesImpact;

  // 5. Competition (weight 15)
  const fbaCount = input.offers.filter(
    (o) => o.fulfillmentType === 'FBA',
  ).length;
  let competitionScore = 100;
  if (fbaCount >= 10) competitionScore = 10;
  else if (fbaCount >= 5) competitionScore = 40;
  else if (fbaCount >= 3) competitionScore = 60;
  else if (fbaCount >= 2) competitionScore = 80;
  const competitionImpact = Math.round(competitionScore * 0.15);
  factors.push({
    name: 'Competition',
    value: fbaCount,
    impact: competitionImpact,
    description: `${fbaCount} FBA seller${fbaCount !== 1 ? 's' : ''}`,
  });
  totalScore += competitionImpact;

  // 6. Buy Box (weight 10)
  let buyBoxScore = 80;
  if (input.buyBox) {
    buyBoxScore = input.buyBox.amazonOnListing ? 10 : 90;
  }
  const buyBoxImpact = Math.round(buyBoxScore * 0.1);
  factors.push({
    name: 'Buy Box',
    value: buyBoxScore,
    impact: buyBoxImpact,
    description: input.buyBox?.amazonOnListing
      ? 'Amazon is on the listing'
      : 'Amazon not on listing',
  });
  totalScore += buyBoxImpact;

  totalScore = clamp(totalScore, 0, 100);

  // Confidence based on data completeness
  let confidence = 100;
  if (!input.bsr.rank) confidence -= 15;
  if (input.sales.monthlySales === 0) confidence -= 15;
  if (input.offers.length === 0) confidence -= 10;
  if (!input.product.weightGrams) confidence -= 10;
  if (!input.product.dimensions) confidence -= 10;

  const label = getScoreLabel(totalScore);
  const summary = generateSummary(label, factors, input);

  return {
    score: totalScore,
    label,
    confidence: clamp(confidence, 20, 100),
    factors,
    summary,
  };
}

function generateSummary(
  label: string,
  factors: ScoreFactor[],
  input: ScoringInput,
): string {
  const best = [...factors].sort((a, b) => b.impact - a.impact)[0];
  const worst = [...factors].sort((a, b) => a.impact - b.impact)[0];

  if (label === 'BUY')
    return `Strong deal. ${best.description}. ${input.offers.length} sellers competing.`;
  if (label === 'MAYBE')
    return `Decent opportunity. Strongest signal: ${best.name}. Watch: ${worst.name}.`;
  if (label === 'RISKY')
    return `Proceed with caution. ${worst.description} is concerning.`;
  return `Not recommended. ${worst.description}. Consider other products.`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
