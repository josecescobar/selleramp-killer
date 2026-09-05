export type Marketplace =
  | 'ATVPDKIKX0DER'   // Amazon US
  | 'A2EUQ1WTGCTBG2'  // Amazon CA
  | 'A1F83G8C2ARO7P'  // Amazon UK
  | 'A1PA6795UKMFR9'  // Amazon DE
  | 'A13V1IB3VIYZZH'  // Amazon FR
  | 'APJ6JRA9NG5V4'   // Amazon IT
  | 'A1RKKUPIHCS9HS'  // Amazon ES
  | 'A1VC38T7YXB528'  // Amazon JP
  | 'A39IBJ37TRP1C6'  // Amazon AU
  | 'EBAY_US'
  | 'EBAY_UK';

export interface Product {
  asin: string;
  marketplace: Marketplace;
  title: string;
  brand: string;
  category: string;
  categoryId?: number;
  imageUrl?: string;
  upc?: string;
  ean?: string;
  rating?: number;
  reviewCount?: number;
  isHazmat: boolean;
  isMeltable: boolean;
  isAdult: boolean;
  isOversized: boolean;
  sizeTier?: string;
  weightGrams?: number;
  dimensions?: { lengthCm: number; widthCm: number; heightCm: number };
}
