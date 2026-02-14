export type FulfillmentType = 'FBA' | 'FBM';

export interface FeeBreakdown {
  referralFee: number;
  referralFeePercent: number;
  fbaFulfillmentFee?: number;
  variableClosingFee: number;
  storageFeeMonthly: number;
  totalFees: number;
}

export interface ProfitCalculation {
  buyPrice: number;
  sellPrice: number;
  fees: FeeBreakdown;
  profit: number;
  roi: number;
  margin: number;
  maxCost: number;
}

