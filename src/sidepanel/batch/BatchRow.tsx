import { useTheme } from '../theme/ThemeContext';
import type { BatchItem } from '@shared/types/batch';
import { formatCurrency } from '@shared/utils';

interface BatchRowProps {
  item: BatchItem;
  onClick: (item: BatchItem) => void;
}

export function BatchRow({ item, onClick }: BatchRowProps) {
  const { tokens: t } = useTheme();
  const a = item.analysis;
  const sellPrice = a?.profitFba.sellPrice ?? 0;
  const profit = a?.profitFba.profit ?? 0;
  const roi = a?.profitFba.roi ?? 0;
  const score = a?.dealScore.score;
  const title = a?.product.title ?? item.extraction?.identifier?.value ?? item.fileName;

  const interactive = item.status === 'done';

  return (
    <div
      onClick={() => interactive && onClick(item)}
      style={{
        display: 'flex',
        gap: 8,
        padding: '8px 10px',
        borderBottom: `1px solid ${t.divider}`,
        cursor: interactive ? 'pointer' : 'default',
        background: t.card,
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 6,
          flexShrink: 0,
          background: t.bg,
          overflow: 'hidden',
          border: `1px solid ${t.cardBorder}`,
        }}
      >
        {item.thumbnailDataUrl ? (
          <img
            src={item.thumbnailDataUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: t.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 9, color: t.textDim, marginTop: 2, display: 'flex', gap: 6 }}>
          <StatusPill status={item.status} />
          {item.asin && <span>{item.asin}</span>}
          {item.error && <span style={{ color: t.red }}>{item.error}</span>}
        </div>
      </div>

      {a && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: profit > 0 ? t.green : t.red }}>
            {formatCurrency(profit)}
          </div>
          <div style={{ fontSize: 9, color: t.textDim }}>
            {roi}% · {formatCurrency(sellPrice)}
          </div>
          {typeof score === 'number' && (
            <div style={{ fontSize: 9, color: t.textMuted }}>score {score}</div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: BatchItem['status'] }) {
  const { tokens: t } = useTheme();
  const colors: Record<BatchItem['status'], string> = {
    pending: t.textDim,
    extracting: t.accent,
    extracted: t.accent,
    resolving: t.accent,
    resolved: t.accent,
    analyzing: t.accent,
    done: t.green,
    failed: t.red,
    skipped: t.textDim,
  };
  return (
    <span
      style={{
        padding: '0 4px',
        borderRadius: 3,
        background: colors[status] + '22',
        color: colors[status],
        fontSize: 9,
        fontWeight: 600,
        textTransform: 'uppercase',
      }}
    >
      {status}
    </span>
  );
}
