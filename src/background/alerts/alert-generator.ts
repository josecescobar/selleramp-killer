import type { Alert } from '@shared/types/alerts';
import type { Product } from '@shared/types/product';
import type { BuyBoxInfo, Offer } from '@shared/types/offers';
import type { BsrInfo } from '@shared/types/messages';
import { getSnapshots } from '../storage';

export interface AlertInput {
  product: Product;
  buyBox: BuyBoxInfo | null;
  offers: Offer[];
  bsr: BsrInfo;
  sellPriceCents: number;
  asin: string;
}

const COMMONLY_GATED_BRANDS = [
  'nike',
  'adidas',
  'apple',
  'samsung',
  'sony',
  'lego',
  'hasbro',
  'disney',
  'under armour',
  'new balance',
  'north face',
  'columbia',
  'patagonia',
  'beats',
  'bose',
  'canon',
  'nikon',
];

export async function generateAlerts(input: AlertInput): Promise<Alert[]> {
  const volatilityAlert = await priceVolatilityAlert(input.asin);

  return [
    brandGatingAlert(input.product),
    ipComplaintsAlert(),
    hazmatAlert(input.product),
    oversizeAlert(input.product),
    privateLabelAlert(input.product, input.offers),
    meltableAlert(input.product),
    adultAlert(input.product),
    volatilityAlert,
  ];
}

function brandGatingAlert(product: Product): Alert {
  const brandLower = product.brand.toLowerCase();
  const isLikelyGated = COMMONLY_GATED_BRANDS.some((b) =>
    brandLower.includes(b),
  );

  return {
    type: 'BRAND_GATING',
    icon: '\u{1F512}',
    label: 'Brand Gating',
    status: isLikelyGated ? 'warn' : 'safe',
    detail: isLikelyGated
      ? `${product.brand} is commonly gated \u2014 verify you can sell`
      : 'Not a commonly gated brand',
  };
}

function ipComplaintsAlert(): Alert {
  return {
    type: 'IP_COMPLAINTS',
    icon: '\u26A0\uFE0F',
    label: 'IP Complaints',
    status: 'neutral',
    detail: 'No IP data available \u2014 check Seller Central',
  };
}

function hazmatAlert(product: Product): Alert {
  return {
    type: 'HAZMAT',
    icon: '\u2623\uFE0F',
    label: 'Hazmat / Safety',
    status: product.isHazmat ? 'danger' : 'safe',
    detail: product.isHazmat
      ? 'Product may require hazmat review'
      : 'No hazmat restrictions detected',
  };
}

function oversizeAlert(product: Product): Alert {
  return {
    type: 'OVERSIZE',
    icon: '\u{1F4E6}',
    label: 'Oversize Item',
    status: product.isOversized ? 'warn' : 'safe',
    detail: product.isOversized
      ? `Oversize \u2014 higher FBA fees (${product.sizeTier ?? 'Oversize'})`
      : `Standard size \u2014 ${product.sizeTier ?? 'Standard'}`,
  };
}

function privateLabelAlert(product: Product, offers: Offer[]): Alert {
  const uniqueSellers = new Set(
    offers.map((o) => o.sellerName?.toLowerCase()).filter(Boolean),
  );
  const brandLower = product.brand.toLowerCase();
  const sellerMatchesBrand = [...uniqueSellers].some(
    (s) => s && (s.includes(brandLower) || brandLower.includes(s!)),
  );
  const fewSellers = uniqueSellers.size <= 2;
  const isLikelyPL = fewSellers && sellerMatchesBrand;

  return {
    type: 'PRIVATE_LABEL',
    icon: '\u{1F3F7}\uFE0F',
    label: 'Private Label Risk',
    status: isLikelyPL ? 'warn' : fewSellers ? 'warn' : 'safe',
    detail: isLikelyPL
      ? 'Likely private label \u2014 brand matches seller'
      : fewSellers
        ? `Only ${uniqueSellers.size} seller(s) \u2014 possible PL`
        : 'Multiple sellers \u2014 unlikely private label',
  };
}

function meltableAlert(product: Product): Alert {
  return {
    type: 'MELTABLE',
    icon: '\u2744\uFE0F',
    label: 'Meltable',
    status: product.isMeltable ? 'warn' : 'safe',
    detail: product.isMeltable
      ? 'May be flagged as meltable (restricted April\u2013October)'
      : 'Not flagged as meltable',
  };
}

function adultAlert(product: Product): Alert {
  return {
    type: 'ADULT_CONTENT',
    icon: '\u{1F51E}',
    label: 'Adult Content',
    status: product.isAdult ? 'danger' : 'safe',
    detail: product.isAdult
      ? 'Flagged as adult product \u2014 restricted listing'
      : 'Not adult-flagged',
  };
}

async function priceVolatilityAlert(asin: string): Promise<Alert> {
  const snapshots = await getSnapshots(asin);
  const prices = snapshots.map((s) => s.price);

  if (prices.length < 3) {
    return {
      type: 'PRICE_VOLATILITY',
      icon: '\u{1F4CA}',
      label: 'Price Volatility',
      status: 'neutral',
      detail:
        prices.length === 0
          ? 'No historical data yet'
          : `Only ${prices.length} snapshot(s) \u2014 need 3+ for analysis`,
    };
  }

  // Coefficient of variation (CV) = stddev / mean
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance =
    prices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / prices.length;
  const stddev = Math.sqrt(variance);
  const cv = mean > 0 ? (stddev / mean) * 100 : 0;

  // Price swing: max-min as % of mean
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const swingPct = mean > 0 ? ((max - min) / mean) * 100 : 0;

  // Thresholds: CV > 15% or swing > 30% = danger, CV > 8% or swing > 15% = warn
  if (cv > 15 || swingPct > 30) {
    return {
      type: 'PRICE_VOLATILITY',
      icon: '\u{1F4CA}',
      label: 'Price Volatility',
      status: 'danger',
      detail: `High volatility \u2014 ${swingPct.toFixed(0)}% price swing across ${prices.length} snapshots`,
    };
  }

  if (cv > 8 || swingPct > 15) {
    return {
      type: 'PRICE_VOLATILITY',
      icon: '\u{1F4CA}',
      label: 'Price Volatility',
      status: 'warn',
      detail: `Moderate volatility \u2014 ${swingPct.toFixed(0)}% price swing across ${prices.length} snapshots`,
    };
  }

  return {
    type: 'PRICE_VOLATILITY',
    icon: '\u{1F4CA}',
    label: 'Price Volatility',
    status: 'safe',
    detail: `Stable pricing \u2014 ${swingPct.toFixed(0)}% swing across ${prices.length} snapshots`,
  };
}
