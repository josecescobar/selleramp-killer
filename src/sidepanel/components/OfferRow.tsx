import { useTheme } from '../theme/ThemeContext';
import type { FulfillmentType } from '@shared/types/fees';

interface OfferRowProps {
  type: FulfillmentType;
  price: string;
  profit: string;
  roi: string;
  isBuyBox?: boolean;
}

export function OfferRow({ type, price, profit, roi, isBuyBox }: OfferRowProps) {
  const { tokens: t } = useTheme();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '50px 1fr 1fr 1fr',
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: 6,
        background: isBuyBox ? t.accentGlow : 'transparent',
        border: isBuyBox ? `1px solid ${t.accent}30` : `1px solid ${t.cardBorder}`,
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: type === 'FBA' ? t.accent : t.orange,
          letterSpacing: '0.04em',
        }}
      >
        {type}
        {isBuyBox && (
          <span style={{ fontSize: 8, color: t.accent, marginLeft: 2 }}> BB</span>
        )}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: t.text, textAlign: 'center' }}>
        {price}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: t.green, textAlign: 'center' }}>
        {profit}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: t.green, textAlign: 'right' }}>
        {roi}
      </span>
    </div>
  );
}
