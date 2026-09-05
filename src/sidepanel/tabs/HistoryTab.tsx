import { useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { MiniChart } from '../components/MiniChart';
import { MetricBox } from '../components/MetricBox';
import { SectionHeader } from '../components/SectionHeader';
import { formatCurrency, formatNumber } from '@shared/utils';
import type { AnalysisResult } from '@shared/types/messages';

const PERIODS = ['1M', '3M', '6M', '1Y', 'ALL'] as const;

interface HistoryTabProps {
  data: AnalysisResult;
}

export function HistoryTab({ data }: HistoryTabProps) {
  const { tokens: t } = useTheme();
  const [period, setPeriod] = useState<string>('3M');

  // Single data point from current analysis; full history requires Keepa or accumulated snapshots
  const currentPrice = data.profitFba.sellPrice / 100;
  const chartData = [currentPrice];

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionHeader icon={'\u{1F4C8}'} title="Price History" badge="Current" />

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

      {/* Chart */}
      <div
        style={{
          background: t.card,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 8,
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {chartData.length > 1 ? (
          <MiniChart data={chartData} width={290} height={100} />
        ) : (
          <div
            style={{
              height: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              color: t.textMuted,
            }}
          >
            Price history will build over time
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 6 }}>
        <MetricBox label="Current Price" value={formatCurrency(data.profitFba.sellPrice)} />
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
