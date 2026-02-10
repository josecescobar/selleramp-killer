import { useTheme } from '../theme/ThemeContext';
import { SectionHeader } from '../components/SectionHeader';
import { OfferRow } from '../components/OfferRow';
import { formatCurrency, formatPercent } from '@shared/utils';
import type { AnalysisResult } from '@shared/types/messages';

interface OffersTabProps {
  data: AnalysisResult;
}

const COLUMN_HEADERS = ['Type', 'Price', 'Profit', 'ROI'] as const;

function ColumnHeaders({ textDim }: { textDim: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '50px 1fr 1fr 1fr',
        padding: '0 10px',
        gap: 4,
      }}
    >
      {COLUMN_HEADERS.map((h) => (
        <span
          key={h}
          style={{
            fontSize: 9,
            color: textDim,
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
  );
}

export function OffersTab({ data }: OffersTabProps) {
  const { tokens: t } = useTheme();

  const fbaOffers = data.offers.filter((o) => o.fulfillmentType === 'FBA');
  const fbmOffers = data.offers.filter((o) => o.fulfillmentType === 'FBM');
  const totalSellers = data.offers.length;

  // Summary strip color based on competition level
  const summaryColor = totalSellers <= 3 ? t.green : totalSellers <= 7 ? t.yellow : t.red;
  const summaryBg = totalSellers <= 3 ? t.greenBg : totalSellers <= 7 ? t.yellowBg : t.redBg;
  const competitionLabel = totalSellers <= 3 ? 'LOW' : totalSellers <= 7 ? 'MODERATE' : 'HIGH';

  // Lowest price and best ROI across all offers
  const lowestPrice = totalSellers > 0
    ? Math.min(...data.offers.map((o) => o.price))
    : null;
  const bestRoi = totalSellers > 0
    ? Math.max(...data.offers.map((o) => o.roi))
    : null;

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Competition Summary Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          background: summaryBg,
          borderRadius: 8,
          border: `1px solid ${summaryColor}30`,
        }}
      >
        <span style={{ fontSize: 14 }}>
          {totalSellers <= 3 ? '\u2705' : totalSellers <= 7 ? '\u26A0\uFE0F' : '\u{1F525}'}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: summaryColor, letterSpacing: '0.04em' }}>
            {totalSellers} SELLER{totalSellers !== 1 ? 'S' : ''}
          </span>
          {fbaOffers.length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: t.accent, letterSpacing: '0.04em' }}>
              {fbaOffers.length} FBA
            </span>
          )}
          {fbmOffers.length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: t.orange, letterSpacing: '0.04em' }}>
              {fbmOffers.length} FBM
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: summaryColor,
            letterSpacing: '0.06em',
            padding: '2px 8px',
            borderRadius: 4,
            background: `${summaryColor}15`,
            border: `1px solid ${summaryColor}40`,
          }}
        >
          {competitionLabel}
        </span>
      </div>

      {/* Price & ROI highlights */}
      {totalSellers > 0 && (
        <div style={{ display: 'flex', gap: 6 }}>
          {lowestPrice !== null && (
            <div
              style={{
                flex: 1,
                background: t.card,
                border: `1px solid ${t.cardBorder}`,
                borderRadius: 6,
                padding: '6px 10px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 9, color: t.textDim, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 2 }}>
                LOWEST PRICE
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
                {formatCurrency(lowestPrice)}
              </div>
            </div>
          )}
          {bestRoi !== null && (
            <div
              style={{
                flex: 1,
                background: t.card,
                border: `1px solid ${t.cardBorder}`,
                borderRadius: 6,
                padding: '6px 10px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 9, color: t.textDim, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 2 }}>
                BEST ROI
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: bestRoi >= 0 ? t.green : t.red }}>
                {formatPercent(bestRoi)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Buy Box Card */}
      {data.buyBox && (
        <div
          style={{
            background: t.accentGlow,
            border: `1px solid ${t.accent}30`,
            borderLeft: `3px solid ${t.accent}`,
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: t.accent,
              letterSpacing: '0.06em',
            }}
          >
            {'\u{1F3C6}'} BUY BOX
          </div>
          {[
            {
              label: 'Owner',
              value: data.buyBox.owner,
              color: t.text,
            },
            {
              label: 'Fulfillment',
              value: data.buyBox.fulfillmentType,
              color: data.buyBox.fulfillmentType === 'FBA' ? t.accent : t.orange,
            },
            {
              label: 'Stability (30d)',
              value: `${data.buyBox.stability}%`,
              color: data.buyBox.stability >= 70 ? t.green : data.buyBox.stability >= 40 ? t.yellow : t.red,
            },
            {
              label: 'Amazon on Listing',
              value: data.buyBox.amazonOnListing ? 'Yes' : 'No',
              color: data.buyBox.amazonOnListing ? t.red : t.green,
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
              <span style={{ fontWeight: 600, color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* FBA Offers */}
      {fbaOffers.length > 0 && (
        <>
          <SectionHeader
            icon={'\u{1F4E6}'}
            title="FBA Offers"
            badge={`${fbaOffers.length} seller${fbaOffers.length !== 1 ? 's' : ''}`}
          />
          <ColumnHeaders textDim={t.textDim} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {fbaOffers.map((offer, i) => (
              <OfferRow
                key={i}
                type={offer.fulfillmentType}
                price={formatCurrency(offer.price)}
                profit={formatCurrency(offer.profit)}
                profitCents={offer.profit}
                roi={formatPercent(offer.roi)}
                isBuyBox={offer.isBuyBox}
              />
            ))}
          </div>
        </>
      )}

      {/* FBM Offers */}
      {fbmOffers.length > 0 && (
        <>
          <SectionHeader
            icon={'\u{1F3E0}'}
            title="FBM Offers"
            badge={`${fbmOffers.length} seller${fbmOffers.length !== 1 ? 's' : ''}`}
          />
          <ColumnHeaders textDim={t.textDim} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {fbmOffers.map((offer, i) => (
              <OfferRow
                key={i}
                type={offer.fulfillmentType}
                price={formatCurrency(offer.price)}
                profit={formatCurrency(offer.profit)}
                profitCents={offer.profit}
                roi={formatPercent(offer.roi)}
                isBuyBox={offer.isBuyBox}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {totalSellers === 0 && (
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
  );
}
