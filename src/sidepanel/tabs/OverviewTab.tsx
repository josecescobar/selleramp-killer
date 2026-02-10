import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { MetricBox } from '../components/MetricBox';
import { ScoreBadge } from '../components/ScoreBadge';
import { SectionHeader } from '../components/SectionHeader';
import { formatCurrency, formatPercent, formatNumber } from '@shared/utils';
import type { AnalysisResult } from '@shared/types/messages';

interface OverviewTabProps {
  data: AnalysisResult;
}

export function OverviewTab({ data }: OverviewTabProps) {
  const { tokens: t } = useTheme();
  const [fulfillment, setFulfillment] = useState<'FBA' | 'FBM'>('FBA');

  const baseProfit = fulfillment === 'FBA' ? data.profitFba : data.profitFbm;
  const baseFees = baseProfit.fees;

  // Editable prices — stored as dollar strings for clean input UX
  const [buyInput, setBuyInput] = useState(() =>
    (baseProfit.buyPrice / 100).toFixed(2),
  );
  const [sellInput, setSellInput] = useState(() =>
    (baseProfit.sellPrice / 100).toFixed(2),
  );

  // Reset inputs when product changes
  useEffect(() => {
    setBuyInput((baseProfit.buyPrice / 100).toFixed(2));
    setSellInput((baseProfit.sellPrice / 100).toFixed(2));
  }, [data.product.asin, baseProfit.buyPrice, baseProfit.sellPrice]);

  // Recalculate all metrics from edited prices
  const { profitCents, roi, margin, maxCost, fees, sellPriceCents, buyPriceCents } = useMemo(() => {
    const parsedBuy = parseFloat(buyInput);
    const parsedSell = parseFloat(sellInput);
    const buy = isNaN(parsedBuy) || parsedBuy < 0 ? 0 : Math.round(parsedBuy * 100);
    const sell = isNaN(parsedSell) || parsedSell < 0 ? 0 : Math.round(parsedSell * 100);

    // Recalculate referral fee based on new sell price
    const referralFee = Math.max(
      Math.round((sell * baseFees.referralFeePercent) / 100),
      30,
    );
    // FBA fee, variable closing, and storage don't change with price
    const fbaFee = baseFees.fbaFulfillmentFee;
    const totalFees = referralFee + (fbaFee ?? 0) + baseFees.variableClosingFee + baseFees.storageFeeMonthly;

    const recalcFees = {
      ...baseFees,
      referralFee,
      totalFees,
    };

    const profit = sell - buy - totalFees;
    return {
      buyPriceCents: buy,
      sellPriceCents: sell,
      profitCents: profit,
      roi: buy > 0 ? Math.round((profit / buy) * 100) : 0,
      margin: sell > 0 ? Math.round((profit / sell) * 100) : 0,
      maxCost: sell - totalFees,
      fees: recalcFees,
    };
  }, [buyInput, sellInput, baseFees]);

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Product Summary */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: t.card,
            border: `1px solid ${t.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            overflow: 'hidden',
          }}
        >
          {data.product.imageUrl ? (
            <img
              src={data.product.imageUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            '\u{1F4E6}'
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: t.text,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {data.product.title}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: t.textMuted }}>{data.product.asin}</span>
            <span style={{ fontSize: 10, color: t.textDim }}>{data.product.brand}</span>
            {data.product.rating && (
              <span style={{ fontSize: 10, color: t.yellow }}>
                {'\u2605'} {data.product.rating}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: t.accent,
                background: t.accentGlow,
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              {data.product.category.toUpperCase()}
            </span>
          </div>
        </div>
        <ScoreBadge score={data.dealScore.score} size={52} />
      </div>

      {/* FBA/FBM Toggle */}
      <div style={{ display: 'flex', gap: 4 }}>
        {(['FBA', 'FBM'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFulfillment(type)}
            style={{
              flex: 1,
              padding: '5px 0',
              fontSize: 11,
              fontWeight: 600,
              color: fulfillment === type ? '#fff' : t.textMuted,
              background: fulfillment === type ? t.accent : t.card,
              border: `1px solid ${fulfillment === type ? t.accent : t.cardBorder}`,
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Cost/Price */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label
            style={{
              fontSize: 10,
              color: t.textMuted,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
              display: 'block',
              marginBottom: 3,
            }}
          >
            Buy Cost
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              background: t.card,
              border: `1px solid ${t.cardBorder}`,
              borderRadius: 6,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: t.textDim }}>$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={buyInput}
              onChange={(e) => setBuyInput(e.target.value)}
              onBlur={() => {
                const parsed = parseFloat(buyInput);
                if (isNaN(parsed) || parsed < 0) setBuyInput('0.00');
                else setBuyInput(parsed.toFixed(2));
              }}
              style={{
                width: '100%',
                padding: '6px 0 6px 2px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 15,
                fontWeight: 700,
                color: t.text,
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label
            style={{
              fontSize: 10,
              color: t.textMuted,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
              display: 'block',
              marginBottom: 3,
            }}
          >
            Sell Price
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              background: t.card,
              border: `1px solid ${t.cardBorder}`,
              borderRadius: 6,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: t.textDim }}>$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={sellInput}
              onChange={(e) => setSellInput(e.target.value)}
              onBlur={() => {
                const parsed = parseFloat(sellInput);
                if (isNaN(parsed) || parsed < 0) setSellInput('0.00');
                else setSellInput(parsed.toFixed(2));
              }}
              style={{
                width: '100%',
                padding: '6px 0 6px 2px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 15,
                fontWeight: 700,
                color: t.text,
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'flex', gap: 6 }}>
        <MetricBox
          label="Profit"
          value={formatCurrency(profitCents)}
          color={profitCents > 0 ? t.green : t.red}
        />
        <MetricBox
          label="ROI"
          value={formatPercent(roi)}
          color={roi > 30 ? t.green : t.yellow}
        />
        <MetricBox
          label="Margin"
          value={formatPercent(margin)}
          color={margin > 20 ? t.green : t.yellow}
        />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <MetricBox label="BSR" value={formatNumber(data.bsr.rank)} sub={data.bsr.category} />
        <MetricBox
          label="Est. Sales"
          value={`${data.salesEstimate.monthlySales}/mo`}
          sub={`${data.salesEstimate.confidence}% conf.`}
        />
        <MetricBox label="Max Cost" value={formatCurrency(maxCost)} />
      </div>

      {/* Fee Breakdown */}
      <SectionHeader icon={'\u{1F4B0}'} title="Fee Breakdown" badge={fulfillment} />
      <div
        style={{
          background: t.card,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 8,
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {[
          { label: `Referral Fee (${fees.referralFeePercent}%)`, value: fees.referralFee },
          ...(fees.fbaFulfillmentFee != null
            ? [{ label: 'FBA Fulfillment', value: fees.fbaFulfillmentFee }]
            : []),
          { label: 'Variable Closing', value: fees.variableClosingFee },
          { label: 'Storage (est.)', value: fees.storageFeeMonthly },
        ].map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
            }}
          >
            <span style={{ color: t.textMuted }}>{row.label}</span>
            <span style={{ color: t.red, fontWeight: 600, fontFamily: 'monospace' }}>
              {row.value > 0 ? `-${formatCurrency(row.value)}` : formatCurrency(0)}
            </span>
          </div>
        ))}
        <div
          style={{
            borderTop: `1px solid ${t.divider}`,
            marginTop: 2,
            paddingTop: 4,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <span style={{ color: t.text }}>Total Fees</span>
          <span style={{ color: t.red, fontFamily: 'monospace' }}>
            -{formatCurrency(fees.totalFees)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            background: t.green,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          + Add to Buy List
        </button>
        <button
          style={{
            padding: '8px 12px',
            fontSize: 14,
            background: t.card,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 8,
            cursor: 'pointer',
            color: t.textMuted,
          }}
        >
          {'\u{1F441}'}
        </button>
        <button
          style={{
            padding: '8px 12px',
            fontSize: 14,
            background: t.card,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 8,
            cursor: 'pointer',
            color: t.textMuted,
          }}
        >
          {'\u{1F4CB}'}
        </button>
      </div>
    </div>
  );
}
