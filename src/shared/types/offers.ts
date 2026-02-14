import type { FulfillmentType } from './fees';

export interface Offer {
  fulfillmentType: FulfillmentType;
  price: number;
  profit: number;
  roi: number;
  sellerName?: string;
  sellerRating?: number;
  isBuyBox: boolean;
}

export interface BuyBoxInfo {
  owner: string;
  fulfillmentType: FulfillmentType;
  stability: number;
  amazonOnListing: boolean;
}
