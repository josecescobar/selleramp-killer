import { useTheme } from '../theme/ThemeContext';
import { MetricBox } from '../components/MetricBox';
import { SectionHeader } from '../components/SectionHeader';
import { ScoreBadge } from '../components/ScoreBadge';
import { formatCurrency, formatPercent } from '@shared/utils';
import type { BuyListState } from '../hooks/useBuyList';

interface BuyListTabProps {
  buyList: BuyListState;
}

export function BuyListTab({ buyList }: BuyListTabProps) {
  const { tokens: t } = useTheme();
  const { items, loading, removeItem, clearAll } = buyList;

  if (loading) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          fontSize: 11,
          color: t.textMuted,
        }}
      >
        Loading...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 32 }}>{'\uD83D\uDED2'}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
          No Items Yet
        </div>
        <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.5 }}>
          Add products from the Overview tab to track sourcing opportunities.
        </div>
      </div>
    );
  }

  const totalProfit = items.reduce((sum, i) => sum + i.profitCents, 0);
  const avgRoi =
    items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + i.roi, 0) / items.length)
      : 0;

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionHeader
        icon={'\uD83D\uDED2'}
        title="Buy List"
        badge={`${items.length} item${items.length !== 1 ? 's' : ''}`}
      />

      {/* Summary metrics */}
      <div style={{ display: 'flex', gap: 6 }}>
        <MetricBox label="Items" value={String(items.length)} />
        <MetricBox
          label="Total Profit"
          value={formatCurrency(totalProfit)}
          color={totalProfit > 0 ? t.green : t.red}
        />
        <MetricBox
          label="Avg ROI"
          value={formatPercent(avgRoi)}
          color={avgRoi > 30 ? t.green : t.yellow}
        />
      </div>

      {/* Item cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item) => (
          <div
            key={item.asin}
            style={{
              background: t.card,
              border: `1px solid ${t.cardBorder}`,
              borderRadius: 8,
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {/* Top row: image + info + score */}
            <a
              href={`https://www.amazon.com/dp/${item.asin}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 6,
                  background: t.surface,
                  border: `1px solid ${t.cardBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  '\uD83D\uDCE6'
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: t.text,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: t.textMuted,
                    marginTop: 2,
                    display: 'flex',
                    gap: 6,
                  }}
                >
                  <span>{item.asin}</span>
                  <span style={{ color: t.textDim }}>
                    {new Date(item.addedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <ScoreBadge score={item.score} size={36} />
            </a>

            {/* Bottom row: prices + remove */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  fontSize: 11,
                }}
              >
                <span style={{ color: t.textMuted }}>
                  Buy:{' '}
                  <span style={{ fontWeight: 600, color: t.text }}>
                    {formatCurrency(item.buyPriceCents)}
                  </span>
                </span>
                <span style={{ color: t.textMuted }}>
                  Sell:{' '}
                  <span style={{ fontWeight: 600, color: t.text }}>
                    {formatCurrency(item.sellPriceCents)}
                  </span>
                </span>
                <span style={{ color: t.textMuted }}>
                  Profit:{' '}
                  <span
                    style={{
                      fontWeight: 600,
                      color: item.profitCents > 0 ? t.green : t.red,
                    }}
                  >
                    {formatCurrency(item.profitCents)}
                  </span>
                </span>
              </div>
              <button
                onClick={() => removeItem(item.asin)}
                style={{
                  padding: '2px 8px',
                  fontSize: 10,
                  fontWeight: 600,
                  color: t.red,
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Clear All */}
      <button
        onClick={clearAll}
        style={{
          padding: '8px 0',
          fontSize: 11,
          fontWeight: 600,
          color: t.red,
          background: 'transparent',
          border: `1px solid ${t.red}`,
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Clear All
      </button>
    </div>
  );
}
