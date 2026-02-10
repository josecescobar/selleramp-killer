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

export interface EbayFees {
  finalValueFee: number;
  finalValueFeePercent: number;
  surcharge: number;
  processingFee: number;
  promotedListingFee?: number;
  totalFees: number;
}

export interface EbayProfitCalculation {
  buyPrice: number;
  sellPrice: number;
  fees: EbayFees;
  shippingEstimate: number;
  profit: number;
  roi: number;
  margin: number;
}
