import { useTheme } from '../theme/ThemeContext';
import { HistoryChart } from '../components/HistoryChart';
import { MetricBox } from '../components/MetricBox';
import { SectionHeader } from '../components/SectionHeader';
import { formatCurrency, formatNumber } from '@shared/utils';
import type { AnalysisResult } from '@shared/types/messages';
import { usePriceHistory, type Period } from '../hooks/usePriceHistory';
import { useKeepa } from '../hooks/useKeepa';
import {
  PriceHistoryChart,
  buildKeepaSeries,
} from '@shared/components/PriceHistoryChart';
import { VariationsTable } from '@shared/components/VariationsTable';

const PERIODS: Period[] = ['1M', '3M', '6M', '1Y', 'ALL'];
const PERIOD_DAYS: Record<Period, number | null> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  ALL: null,
};

interface HistoryTabProps {
  data: AnalysisResult;
  asin: string;
}

function fmtPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtChangePct(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export function HistoryTab({ data, asin }: HistoryTabProps) {
  const { tokens: t } = useTheme();
  const { snapshots, filtered, priceStats, bsrStats, loading, period, setPeriod } =
    usePriceHistory(asin);
  const keepa = useKeepa(asin);

  const hasChartData = filtered.length >= 2;
  const hasKeepa = !!keepa.data;
  const keepaSeries = keepa.data
    ? buildKeepaSeries({
        amazon: keepa.data.series.amazon,
        newPrice: keepa.data.series.newPrice,
        buyBox: keepa.data.series.buyBox,
        salesRank: keepa.data.series.salesRank,
        offerCountNew: keepa.data.series.offerCountNew,
      })
    : [];

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Period Selector */}
      <div style={{ display: 'flex', gap: 4 }}>
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              flex: 1,
              padding: '4px 0',
              fontSize: 10,
              fontWeight: period === p ? 700 : 500,
              color: period === p ? '#fff' : t.textMuted,
              background: period === p ? t.accent : 'transparent',
              border: `1px solid ${period === p ? t.accent : t.cardBorder}`,
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Keepa price-history chart (preferred) */}
      {keepa.hasKey === false && (
        <div
          style={{
            background: t.card,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 8,
            padding: '12px',
            fontSize: 11,
            color: t.textMuted,
            lineHeight: 1.5,
          }}
        >
          Add a Keepa API key in settings to see real price-history, BSR, and offer-count charts.
        </div>
      )}
      {keepa.loading && (
        <div
          style={{
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            color: t.textMuted,
          }}
        >
          Loading Keepa history...
        </div>
      )}
      {keepa.error && !keepa.loading && (
        <div
          style={{
            background: t.card,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 11,
            color: t.red,
          }}
        >
          {keepa.error}
        </div>
      )}
      {hasKeepa && !keepa.loading && (
        <>
          <SectionHeader
            icon={'\u{1F4C8}'}
            title="Keepa History"
            badge={
              keepa.data?.tokensLeft !== undefined
                ? `${keepa.data.tokensLeft} tokens left`
                : undefined
            }
          />
          <div
            style={{
              background: t.card,
              border: `1px solid ${t.cardBorder}`,
              borderRadius: 8,
              padding: '10px 8px 8px',
            }}
          >
            <PriceHistoryChart
              series={keepaSeries}
              windowDays={PERIOD_DAYS[period]}
              width={310}
              height={200}
              axisColor={t.cardBorder}
              textColor={t.text}
              textColorDim={t.textDim}
              emptyMessage="No history points in this window."
            />
          </div>
        </>
      )}

      {/* Variations */}
      {hasKeepa && !keepa.loading && (
        <>
          <SectionHeader
            icon={'\u{1F500}'}
            title="Variations"
            badge={
              keepa.data?.variations.length
                ? `${keepa.data.variations.length}`
                : keepa.data?.parentAsin
                  ? 'child'
                  : undefined
            }
          />
          {keepa.data?.parentAsin && (
            <div
              style={{
                fontSize: 10,
                color: t.textDim,
                padding: '4px 8px',
              }}
            >
              Child of{' '}
              <span style={{ fontFamily: 'monospace', color: t.text }}>
                {keepa.data.parentAsin}
              </span>
            </div>
          )}
          <VariationsTable
            variations={keepa.data?.variations ?? []}
            currentAsin={asin}
            textColor={t.text}
            textColorDim={t.textDim}
            borderColor={t.cardBorder}
            accentColor={t.accent}
            highlightBackground={t.cardBorder}
            rowBackground={t.card}
            maxHeight={180}
          />
        </>
      )}

      {/* Local snapshots as a secondary signal */}
      {!loading && hasChartData && (
        <>
          <SectionHeader
            icon={'\u{1F4CA}'}
            title="Your Snapshots"
            badge={`${filtered.length} pts`}
          />
          <div
            style={{
              background: t.card,
              border: `1px solid ${t.cardBorder}`,
              borderRadius: 8,
              padding: '12px 8px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <HistoryChart
              data={filtered}
              valueKey="price"
              color={t.accent}
              width={300}
              height={120}
              formatValue={fmtPrice}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <MetricBox label="High" value={fmtPrice(priceStats.high)} />
            <MetricBox label="Low" value={fmtPrice(priceStats.low)} />
            <MetricBox label="Avg" value={fmtPrice(priceStats.avg)} />
            <MetricBox
              label="Change"
              value={fmtChangePct(priceStats.changePct)}
              color={priceStats.changePct >= 0 ? t.green : t.red}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <MetricBox label="BSR High" value={formatNumber(Math.round(bsrStats.high))} />
            <MetricBox label="BSR Low" value={formatNumber(Math.round(bsrStats.low))} />
            <MetricBox label="BSR Avg" value={formatNumber(Math.round(bsrStats.avg))} />
            <MetricBox
              label="BSR Δ"
              value={fmtChangePct(bsrStats.changePct)}
              color={bsrStats.changePct <= 0 ? t.green : t.red}
            />
          </div>
        </>
      )}

      {/* Empty state when neither source has data */}
      {!loading && !hasChartData && !hasKeepa && !keepa.loading && keepa.hasKey !== false && (
        <div
          style={{
            background: t.card,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 8,
            padding: '24px 12px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div style={{ fontSize: 11, color: t.textMuted }}>
            Price history will build over time
          </div>
          <div style={{ fontSize: 10, color: t.textDim }}>
            {snapshots.length === 1
              ? '1 snapshot recorded — charts appear after 2+ data points'
              : 'Each analysis records a snapshot of price & BSR'}
          </div>
        </div>
      )}

      {/* Current Snapshot */}
      <SectionHeader icon={'\u{1F4CC}'} title="Current Snapshot" />
      <div style={{ display: 'flex', gap: 6 }}>
        <MetricBox label="Price" value={formatCurrency(data.profitFba.sellPrice)} />
        <MetricBox label="BSR Rank" value={formatNumber(data.bsr.rank)} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <MetricBox label="Category" value={data.bsr.category} />
        <MetricBox
          label="Est. Sales"
          value={`${data.salesEstimate.monthlySales}/mo`}
          color={data.salesEstimate.monthlySales >= 50 ? t.green : t.yellow}
        />
      </div>
    </div>
  );
}
