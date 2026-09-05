import { useTheme } from '../theme/ThemeContext';
import { SectionHeader } from '../components/SectionHeader';

export function EbayTab() {
  const { tokens: t } = useTheme();

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionHeader icon="🔄" title="Cross-Marketplace" badge="vs eBay" />

      {/* Comparison Cards */}
      <div style={{ display: 'flex', gap: 6 }}>
        {/* Amazon Card */}
        <div
          style={{
            flex: 1,
            background: t.card,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 8,
            padding: '10px 10px',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: t.accent,
              marginBottom: 6,
              letterSpacing: '0.04em',
            }}
          >
            AMAZON FBA
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: t.green }}>$42.18</div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>
            81% ROI · $129.99
          </div>
        </div>

        {/* eBay Card */}
        <div
          style={{
            flex: 1,
            background: t.card,
            border: `1px solid ${t.orange}30`,
            borderRadius: 8,
            padding: '10px 10px',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: t.orange,
              marginBottom: 6,
              letterSpacing: '0.04em',
            }}
          >
            EBAY
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: t.green }}>$53.40</div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>
            103% ROI · $119.95 avg
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      <div
        style={{
          background: t.accentGlow,
          border: `1px solid ${t.accent}30`,
          borderRadius: 8,
          padding: '10px 12px',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: t.accent,
            marginBottom: 4,
            letterSpacing: '0.04em',
          }}
        >
          ✦ AI RECOMMENDATION
        </div>
        <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.5 }}>
          eBay shows higher profit per unit ($53.40 vs $42.18) but lower sell-through
          rate. Consider Amazon FBA for faster turnover and eBay for margin optimization
          on slower-moving inventory.
        </div>
      </div>

      {/* eBay Details */}
      <SectionHeader icon="📊" title="eBay Details" />
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
        {[
          { label: 'Avg Sold Price', value: '$119.95' },
          { label: 'Sold (90d)', value: '47 units' },
          { label: 'Active Listings', value: '23' },
          { label: 'FVF', value: '13.25%' },
          { label: 'Processing Fee', value: '$0.30' },
          { label: 'Est. Shipping', value: '$12.50' },
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
            <span style={{ color: t.text, fontWeight: 600 }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
