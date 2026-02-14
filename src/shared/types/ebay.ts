export interface EbayListing {
  itemId: string;
  title: string;
  priceCents: number;
  shippingCostCents: number;
  totalPriceCents: number;
  condition: string;
  itemUrl: string;
  imageUrl?: string;
  seller: {
    username: string;
    feedbackScore?: number;
    feedbackPercent?: number;
  };
}

export interface EbayFeeBreakdown {
  finalValueFee: number;
  finalValueFeePercent: number;
  processingFee: number;
  totalFees: number;
}

export interface EbayProfitEstimate {
  amazonBuyPriceCents: number;
  ebaySellingPriceCents: number;
  fees: EbayFeeBreakdown;
  shippingCostCents: number;
  profitCents: number;
  roi: number;
  margin: number;
}

export interface EbayPriceStats {
  medianCents: number;
  lowCents: number;
  highCents: number;
  avgCents: number;
}

export interface EbaySearchResult {
  query: string;
  totalListings: number;
  listings: EbayListing[];
  priceStats: EbayPriceStats;
  profitEstimate: EbayProfitEstimate;
  searchedAt: number;
}
