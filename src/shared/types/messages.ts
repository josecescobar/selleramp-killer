import type { Product } from './product';
import type { DealScore } from './deal';
import type { ProfitCalculation } from './fees';
import type { Offer, BuyBoxInfo } from './offers';
import type { Alert } from './alerts';

// --- Analysis Result (central data contract) ---

export interface SalesEstimate {
  monthlySales: number;
  confidence: number;
  range: { low: number; high: number };
}

export interface BsrInfo {
  rank: number;
  category: string;
  categoryTotal?: number;
  subCategoryRanks?: Array<{ category: string; rank: number }>;
}

export interface AnalysisResult {
  product: Product;
  dealScore: DealScore;
  profitFba: ProfitCalculation;
  profitFbm: ProfitCalculation;
  offers: Offer[];
  buyBox: BuyBoxInfo | null;
  alerts: Alert[];
  salesEstimate: SalesEstimate;
  bsr: BsrInfo;
  analyzedAt: number;
}

// --- Messages ---

export interface AnalyzeProductRequest {
  type: 'ANALYZE_PRODUCT';
  asin: string;
  marketplace: string;
  url: string;
}

export interface GetCachedProductRequest {
  type: 'GET_CACHED_PRODUCT';
  asin: string;
}

export interface OpenSidePanelRequest {
  type: 'OPEN_SIDE_PANEL';
  asin: string;
}

export interface KeepAliveRequest {
  type: 'KEEP_ALIVE';
}

export interface SetApiKeyRequest {
  type: 'SET_API_KEY';
  apiKey: string;
}

export interface GetApiKeyStatusRequest {
  type: 'GET_API_KEY_STATUS';
}

export type ExtensionMessage =
  | AnalyzeProductRequest
  | GetCachedProductRequest
  | OpenSidePanelRequest
  | KeepAliveRequest
  | SetApiKeyRequest
  | GetApiKeyStatusRequest;

export interface AnalyzeProductResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}
