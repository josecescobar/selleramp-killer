import { useTheme } from '../theme/ThemeContext';
import { SectionHeader } from '../components/SectionHeader';
import { EbayCredentialsSetup } from '../components/EbayCredentialsSetup';
import { useEbaySearch } from '../hooks/useEbaySearch';
import { formatCurrency, formatPercent } from '@shared/utils';
import type { AnalysisResult } from '@shared/types/messages';
import type { EbayListing } from '@shared/types/ebay';

interface EbayTabProps {
  data: AnalysisResult;
}

export function EbayTab({ data }: EbayTabProps) {
  const { tokens: t } = useTheme();
  const { ebayData, loading, error, hasCredentials, refetch } =
    useEbaySearch(data);

  // No credentials — show setup
  if (!hasCredentials) {
    return (
      <EbayCredentialsSetup
        onSaved={() => {
          // After saving, the hook will re-check credentials and auto-fetch
          window.location.reload();
        }}
      />
    );
  }

  // Loading
  if (loading) {
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
        <div
          style={{
            width: 32,
            height: 32,
            border: `3px solid ${t.cardBorder}`,
            borderTopColor: t.accent,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <div style={{ fontSize: 11, color: t.textMuted }}>
          Searching eBay...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // Error
  if (error) {
    const errorMsg =
      error === 'EBAY_CREDENTIALS_INVALID'
        ? 'Invalid eBay credentials. Check your settings.'
        : error === 'EBAY_RATE_LIMITED'
          ? 'eBay rate limit reached. Try again later.'
          : 'eBay search failed. Try again.';

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
        <div style={{ fontSize: 32 }}>&#x26A0;&#xFE0F;</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
          {error === 'EBAY_RATE_LIMITED' ? 'Rate Limited' : 'Search Failed'}
        </div>
        <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.5 }}>
          {errorMsg}
        </div>
        <button
          onClick={refetch}
          style={{
            padding: '8px 20px',
            fontSize: 12,
            fontWeight: 600,
            color: '#fff',
            background: t.accent,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // No data yet
  if (!ebayData) {
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
        <div style={{ fontSize: 32 }}>&#x1F50D;</div>
        <div style={{ fontSize: 11, color: t.textMuted }}>
          No eBay data available.
        </div>
      </div>
    );
  }

  // No results found
  if (ebayData.listings.length === 0) {
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
        <div style={{ fontSize: 32 }}>&#x1F6AB;</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
          No eBay Listings Found
        </div>
        <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.5 }}>
          No matching new listings found on eBay for this product.
        </div>
        <button
          onClick={refetch}
          style={{
            padding: '8px 20px',
            fontSize: 12,
            fontWeight: 600,
            color: '#fff',
            background: t.accent,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Search Again
        </button>
      </div>
    );
  }

  const { priceStats, profitEstimate } = ebayData;
  const amazonProfit = data.profitFba.profit;
  const amazonRoi = data.profitFba.roi;
  const ebayProfit = profitEstimate.profitCents;
  const ebayRoi = profitEstimate.roi;

  return (
    <div
      style={{
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <SectionHeader icon="&#x1F504;" title="Cross-Marketplace" badge="vs eBay" />

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
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: amazonProfit > 0 ? t.green : t.red,
            }}
          >
            {formatCurrency(amazonProfit)}
          </div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>
            {formatPercent(amazonRoi)} ROI &middot;{' '}
            {formatCurrency(data.profitFba.sellPrice)}
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
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: ebayProfit > 0 ? t.green : t.red,
            }}
          >
            {formatCurrency(ebayProfit)}
          </div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>
            {formatPercent(ebayRoi)} ROI &middot;{' '}
            {formatCurrency(priceStats.medianCents)} median
          </div>
        </div>
      </div>

      {/* eBay Details */}
      <SectionHeader icon="&#x1F4CA;" title="eBay Details" />
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
          {
            label: 'Median Price',
            value: formatCurrency(priceStats.medianCents),
          },
          {
            label: 'Price Range',
            value: `${formatCurrency(priceStats.lowCents)} – ${formatCurrency(priceStats.highCents)}`,
          },
          {
            label: 'Listings Found',
            value: String(ebayData.totalListings),
          },
          {
            label: 'FVF',
            value: `${profitEstimate.fees.finalValueFeePercent}%`,
          },
          {
            label: 'Processing Fee',
            value: formatCurrency(profitEstimate.fees.processingFee),
          },
          {
            label: 'Est. Shipping',
            value: formatCurrency(profitEstimate.shippingCostCents),
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

      {/* Top Listings */}
      <SectionHeader
        icon="&#x1F4E6;"
        title="Top Listings"
        badge={`${ebayData.listings.length}`}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          maxHeight: 300,
          overflowY: 'auto',
        }}
      >
        {ebayData.listings.map((listing) => (
          <ListingCard key={listing.itemId} listing={listing} />
        ))}
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: EbayListing }) {
  const { tokens: t } = useTheme();

  return (
    <a
      href={listing.itemUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        background: t.card,
        border: `1px solid ${t.cardBorder}`,
        borderRadius: 8,
        padding: '8px 10px',
        textDecoration: 'none',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: t.text,
          fontWeight: 500,
          lineHeight: 1.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {listing.title}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 4,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.accent }}>
            {formatCurrency(listing.totalPriceCents)}
          </span>
          {listing.shippingCostCents > 0 && (
            <span style={{ fontSize: 9, color: t.textDim }}>
              +{formatCurrency(listing.shippingCostCents)} ship
            </span>
          )}
          {listing.shippingCostCents === 0 && (
            <span style={{ fontSize: 9, color: t.green }}>Free shipping</span>
          )}
        </div>
        <div style={{ fontSize: 9, color: t.textDim }}>
          {listing.seller.username}
          {listing.seller.feedbackPercent != null &&
            ` (${listing.seller.feedbackPercent}%)`}
        </div>
      </div>
    </a>
  );
}
