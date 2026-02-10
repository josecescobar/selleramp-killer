import { useTheme } from '../theme/ThemeContext';
import { SectionHeader } from '../components/SectionHeader';
import type { AnalysisResult } from '@shared/types/messages';
import { calculateEbayProfit } from '@shared/fees/ebay-calculator';

interface EbayTabProps {
  data: AnalysisResult;
}

function fmt(cents: number): string {
  const abs = Math.abs(cents);
  const sign = cents < 0 ? '-' : '';
  return `${sign}$${(abs / 100).toFixed(2)}`;
}

export function EbayTab({ data }: EbayTabProps) {
  const { tokens: t } = useTheme();

  const { product, profitFba } = data;
  const buyPrice = profitFba.buyPrice;
  const sellPrice = profitFba.sellPrice;

  const ebay = calculateEbayProfit(
    buyPrice,
    sellPrice,
    product.category,
    product.weightGrams,
  );

  const amazonProfit = profitFba.profit;
  const ebayProfit = ebay.profit;
  const diff = ebayProfit - amazonProfit;
  const absDiff = Math.abs(diff);

  let recLabel: string;
  let recColor: string;
  let recText: string;
  if (absDiff < 100) {
    recLabel = 'SIMILAR PROFIT';
    recColor = t.yellow;
    recText = `Both channels yield similar profit (within ${fmt(absDiff)}). Choose based on speed vs. margin preference.`;
  } else if (diff > 0) {
    recLabel = `EBAY WINS BY ${fmt(absDiff)}`;
    recColor = t.orange;
    recText = `eBay yields ${fmt(absDiff)} more profit per unit. Consider eBay for higher margins, but factor in slower sell-through and self-fulfillment effort.`;
  } else {
    recLabel = `AMAZON WINS BY ${fmt(absDiff)}`;
    recColor = t.accent;
    recText = `Amazon FBA yields ${fmt(absDiff)} more profit per unit with hands-off fulfillment and typically faster sell-through.`;
  }

  const feeRows = [
    { label: `FVF (${ebay.fees.finalValueFeePercent}%)`, value: fmt(ebay.fees.finalValueFee - ebay.fees.surcharge) },
    { label: 'FVF Surcharge', value: fmt(ebay.fees.surcharge) },
    { label: 'Processing Fee', value: fmt(ebay.fees.processingFee) },
    { label: 'Est. Shipping', value: fmt(ebay.shippingEstimate) },
    { label: 'Total eBay Costs', value: fmt(ebay.fees.totalFees + ebay.shippingEstimate) },
  ];

  const searchQuery = product.upc || product.title;
  const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}&LH_Complete=1&LH_Sold=1`;

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionHeader icon="\u{1F504}" title="Cross-Marketplace" badge="vs eBay" />

      {/* Comparison Cards */}
      <div style={{ display: 'flex', gap: 6 }}>
        <ComparisonCard
          t={t}
          label="AMAZON FBA"
          labelColor={t.accent}
          borderColor={t.cardBorder}
          profit={amazonProfit}
          roi={profitFba.roi}
          sellPrice={sellPrice}
        />
        <ComparisonCard
          t={t}
          label="EBAY"
          labelColor={t.orange}
          borderColor={`${t.orange}30`}
          profit={ebayProfit}
          roi={ebay.roi}
          sellPrice={sellPrice}
        />
      </div>

      {/* Metric Boxes */}
      <div style={{ display: 'flex', gap: 6 }}>
        <MetricBox t={t} label="eBay Profit" value={fmt(ebayProfit)} color={ebayProfit >= 0 ? t.green : t.red} />
        <MetricBox t={t} label="eBay ROI" value={`${ebay.roi}%`} color={ebay.roi >= 0 ? t.green : t.red} />
        <MetricBox t={t} label="eBay Margin" value={`${ebay.margin}%`} color={ebay.margin >= 0 ? t.green : t.red} />
      </div>

      {/* Recommendation Banner */}
      <div
        style={{
          background: t.accentGlow,
          border: `1px solid ${recColor}30`,
          borderRadius: 8,
          padding: '10px 12px',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: recColor,
            marginBottom: 4,
            letterSpacing: '0.04em',
          }}
        >
          {recLabel}
        </div>
        <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.5 }}>
          {recText}
        </div>
      </div>

      {/* eBay Fee Breakdown */}
      <SectionHeader icon="\u{1F4CA}" title="eBay Fee Breakdown" />
      <div
        style={{
          background: t.card,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 8,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        {feeRows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              ...(i === feeRows.length - 1
                ? { borderTop: `1px solid ${t.divider}`, paddingTop: 5, fontWeight: 700 }
                : {}),
            }}
          >
            <span style={{ color: t.textMuted }}>{row.label}</span>
            <span style={{ color: i === feeRows.length - 1 ? t.text : t.text, fontWeight: 600 }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Search on eBay Button */}
      <button
        onClick={() => window.open(ebaySearchUrl, '_blank')}
        style={{
          width: '100%',
          padding: '10px 0',
          fontSize: 12,
          fontWeight: 700,
          color: '#fff',
          background: t.orange,
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: 'inherit',
          letterSpacing: '0.02em',
        }}
      >
        Search on eBay
      </button>
    </div>
  );
}

function ComparisonCard({
  t,
  label,
  labelColor,
  borderColor,
  profit,
  roi,
  sellPrice,
}: {
  t: Record<string, string>;
  label: string;
  labelColor: string;
  borderColor: string;
  profit: number;
  roi: number;
  sellPrice: number;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: t.card,
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        padding: '10px 10px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: labelColor,
          marginBottom: 6,
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: profit >= 0 ? t.green : t.red }}>
        {fmt(profit)}
      </div>
      <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>
        {roi}% ROI &middot; {fmt(sellPrice)}
      </div>
    </div>
  );
}

function MetricBox({
  t,
  label,
  value,
  color,
}: {
  t: Record<string, string>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: t.card,
        border: `1px solid ${t.cardBorder}`,
        borderRadius: 8,
        padding: '8px 6px',
        textAlign: 'center' as const,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 9, color: t.textMuted, marginTop: 2 }}>{label}</div>
    </div>
  );
}
