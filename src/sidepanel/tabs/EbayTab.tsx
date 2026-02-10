import { useTheme } from '../theme/ThemeContext';
import { SectionHeader } from '../components/SectionHeader';
import { MetricBox } from '../components/MetricBox';
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

  // Winner detection
  const isSimilar = absDiff < 100;
  const ebayWins = diff > 0;

  const winnerColor = isSimilar ? t.yellow : ebayWins ? t.orange : t.accent;
  const winnerBg = isSimilar ? t.yellowBg : ebayWins ? t.orangeBg : t.accentGlow;
  const winnerLabel = isSimilar ? 'SIMILAR' : ebayWins ? 'EBAY WINS' : 'AMAZON WINS';

  let recText: string;
  if (isSimilar) {
    recText = `Both channels yield similar profit (within ${fmt(absDiff)}). Choose based on speed vs. margin preference.`;
  } else if (ebayWins) {
    recText = `eBay yields ${fmt(absDiff)} more profit per unit. Consider eBay for higher margins, but factor in slower sell-through and self-fulfillment effort.`;
  } else {
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

  // Amazon card wins if diff <= -100, eBay card wins if diff >= 100
  const amazonCardWins = !isSimilar && !ebayWins;
  const ebayCardWins = !isSimilar && ebayWins;

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Winner Summary Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          background: winnerBg,
          borderRadius: 8,
          border: `1px solid ${winnerColor}30`,
        }}
      >
        <span style={{ fontSize: 14 }}>
          {isSimilar ? '\u{1F91D}' : ebayWins ? '\u{1F3F7}\uFE0F' : '\u{1F4E6}'}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: winnerColor, letterSpacing: '0.04em' }}>
            {isSimilar ? `WITHIN ${fmt(absDiff)}` : `+${fmt(absDiff)} PROFIT`}
          </span>
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: winnerColor,
            letterSpacing: '0.06em',
            padding: '2px 8px',
            borderRadius: 4,
            background: `${winnerColor}15`,
            border: `1px solid ${winnerColor}40`,
          }}
        >
          {winnerLabel}
        </span>
      </div>

      <SectionHeader icon="\u{1F504}" title="Head-to-Head" badge="vs eBay" />

      {/* Comparison Cards */}
      <div style={{ display: 'flex', gap: 6 }}>
        <ComparisonCard
          t={t}
          label="AMAZON FBA"
          labelColor={t.accent}
          accentColor={t.accent}
          isWinner={amazonCardWins}
          winnerGlow={t.accentGlow}
          profit={amazonProfit}
          roi={profitFba.roi}
          sellPrice={sellPrice}
        />
        <ComparisonCard
          t={t}
          label="EBAY"
          labelColor={t.orange}
          accentColor={t.orange}
          isWinner={ebayCardWins}
          winnerGlow={t.orangeBg}
          profit={ebayProfit}
          roi={ebay.roi}
          sellPrice={sellPrice}
        />
      </div>

      {/* eBay Metrics Row */}
      <div style={{ display: 'flex', gap: 6 }}>
        <MetricBox label="eBay Profit" value={fmt(ebayProfit)} color={ebayProfit >= 0 ? t.green : t.red} />
        <MetricBox label="eBay ROI" value={`${ebay.roi}%`} color={ebay.roi >= 0 ? t.green : t.red} />
        <MetricBox label="eBay Margin" value={`${ebay.margin}%`} color={ebay.margin >= 0 ? t.green : t.red} />
      </div>

      {/* Recommendation Card */}
      <div
        style={{
          background: winnerBg,
          border: `1px solid ${winnerColor}30`,
          borderLeft: `3px solid ${winnerColor}`,
          borderRadius: 8,
          padding: '10px 12px',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: winnerColor,
            marginBottom: 4,
            letterSpacing: '0.04em',
          }}
        >
          {winnerLabel}{!isSimilar ? ` BY ${fmt(absDiff)}` : ''}
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
          borderLeft: `3px solid ${t.orange}`,
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
            <span style={{ color: t.text, fontWeight: 600 }}>
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
  accentColor,
  isWinner,
  winnerGlow,
  profit,
  roi,
  sellPrice,
}: {
  t: Record<string, string>;
  label: string;
  labelColor: string;
  accentColor: string;
  isWinner: boolean;
  winnerGlow: string;
  profit: number;
  roi: number;
  sellPrice: number;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: isWinner ? winnerGlow : t.card,
        border: `1px solid ${isWinner ? `${accentColor}30` : t.cardBorder}`,
        borderLeft: `3px solid ${accentColor}`,
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
