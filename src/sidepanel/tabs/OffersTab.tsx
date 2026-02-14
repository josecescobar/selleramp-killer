import { useTheme } from '../theme/ThemeContext';
import { SectionHeader } from '../components/SectionHeader';
import { OfferRow } from '../components/OfferRow';
import { formatCurrency, formatPercent } from '@shared/utils';
import type { AnalysisResult } from '@shared/types/messages';

interface OffersTabProps {
  data: AnalysisResult;
}

export function OffersTab({ data }: OffersTabProps) {
  const { tokens: t } = useTheme();

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SectionHeader
        icon={'\u{1F3F7}\uFE0F'}
        title="Live Offers"
        badge={`${data.offers.length} seller${data.offers.length !== 1 ? 's' : ''}`}
      />

      {/* Column Headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '50px 1fr 1fr 1fr',
          padding: '0 10px',
          gap: 4,
        }}
      >
        {['Type', 'Price', 'Profit', 'ROI'].map((h) => (
          <span
            key={h}
            style={{
              fontSize: 9,
              color: t.textDim,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              textAlign: h === 'Type' ? 'left' : h === 'ROI' ? 'right' : 'center',
            }}
          >
            {h}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {data.offers.length > 0 ? (
          data.offers.map((offer, i) => (
            <OfferRow
              key={i}
              type={offer.fulfillmentType}
              price={formatCurrency(offer.price)}
              profit={formatCurrency(offer.profit)}
              roi={formatPercent(offer.roi)}
              isBuyBox={offer.isBuyBox}
            />
          ))
        ) : (
          <div
            style={{
              padding: 16,
              textAlign: 'center',
              fontSize: 11,
              color: t.textMuted,
            }}
          >
            No offers found
          </div>
        )}
      </div>

      {/* Buy Box Info */}
      {data.buyBox && (
        <>
          <SectionHeader icon={'\u{1F3C6}'} title="Buy Box" />
          <div
            style={{
              background: t.card,
              border: `1px solid ${t.cardBorder}`,
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {[
              {
                label: 'Owner',
                value: `${data.buyBox.fulfillmentType} \u00B7 ${data.buyBox.owner}`,
              },
              {
                label: 'Stability (30d)',
                value: `${data.buyBox.stability}%`,
              },
              {
                label: 'Amazon on Listing',
                value: data.buyBox.amazonOnListing ? 'Yes \u2717' : 'No \u2713',
              },
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
        </>
      )}
    </div>
  );
}
