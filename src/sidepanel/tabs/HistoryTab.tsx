import { useTheme } from '../theme/ThemeContext';
import { HistoryChart } from '../components/HistoryChart';
import { MetricBox } from '../components/MetricBox';
import { SectionHeader } from '../components/SectionHeader';
import { formatCurrency, formatNumber } from '@shared/utils';
import type { AnalysisResult } from '@shared/types/messages';
import { usePriceHistory, type Period } from '../hooks/usePriceHistory';

const PERIODS: Period[] = ['1M', '3M', '6M', '1Y', 'ALL'];

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

  const hasChartData = filtered.length >= 2;

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

      {/* Loading */}
      {loading && (
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
          Loading history...
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasChartData && (
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

      {/* Price History */}
      {!loading && hasChartData && (
        <>
          <SectionHeader
            icon={'\u{1F4C8}'}
            title="Price History"
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
        </>
      )}

      {/* BSR History */}
      {!loading && hasChartData && (
        <>
          <SectionHeader
            icon={'\u{1F4CA}'}
            title="BSR History"
            badge={data.bsr.category}
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
              valueKey="bsr"
              color={t.orange}
              width={300}
              height={120}
              formatValue={(v) => formatNumber(Math.round(v))}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <MetricBox label="High" value={formatNumber(Math.round(bsrStats.high))} />
            <MetricBox label="Low" value={formatNumber(Math.round(bsrStats.low))} />
            <MetricBox label="Avg" value={formatNumber(Math.round(bsrStats.avg))} />
            <MetricBox
              label="Change"
              value={fmtChangePct(bsrStats.changePct)}
              color={bsrStats.changePct <= 0 ? t.green : t.red}
            />
          </div>
        </>
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
