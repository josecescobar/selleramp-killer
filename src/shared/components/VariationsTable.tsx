import type { KeepaVariation } from '../api/keepa';

export interface VariationsTableProps {
  variations: KeepaVariation[];
  /** Highlight the currently selected ASIN. */
  currentAsin?: string;
  /** Called when the user clicks a row. */
  onSelect?: (asin: string) => void;
  textColor?: string;
  textColorDim?: string;
  borderColor?: string;
  accentColor?: string;
  highlightBackground?: string;
  rowBackground?: string;
  maxHeight?: number;
}

const DEFAULTS = {
  textColor: '#111827',
  textColorDim: '#9ca3af',
  borderColor: '#e5e7eb',
  accentColor: '#2563eb',
  highlightBackground: '#eff6ff',
  rowBackground: 'transparent',
  maxHeight: 220,
};

export function VariationsTable(props: VariationsTableProps) {
  const {
    variations,
    currentAsin,
    onSelect,
    textColor = DEFAULTS.textColor,
    textColorDim = DEFAULTS.textColorDim,
    borderColor = DEFAULTS.borderColor,
    accentColor = DEFAULTS.accentColor,
    highlightBackground = DEFAULTS.highlightBackground,
    rowBackground = DEFAULTS.rowBackground,
    maxHeight = DEFAULTS.maxHeight,
  } = props;

  if (!variations.length) {
    return (
      <div
        style={{
          padding: '12px',
          fontSize: 11,
          color: textColorDim,
          textAlign: 'center',
          border: `1px solid ${borderColor}`,
          borderRadius: 4,
        }}
      >
        Single-variation product — no other children listed.
      </div>
    );
  }

  return (
    <div
      style={{
        maxHeight,
        overflowY: 'auto',
        border: `1px solid ${borderColor}`,
        borderRadius: 4,
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 11,
          color: textColor,
          fontFamily: 'inherit',
        }}
      >
        <thead>
          <tr style={{ position: 'sticky', top: 0, background: rowBackground }}>
            <th style={thStyle(borderColor, textColorDim)}>ASIN</th>
            <th style={thStyle(borderColor, textColorDim)}>Attributes</th>
          </tr>
        </thead>
        <tbody>
          {variations.map((v) => {
            const selected = v.asin === currentAsin;
            return (
              <tr
                key={v.asin}
                onClick={() => onSelect?.(v.asin)}
                style={{
                  cursor: onSelect ? 'pointer' : 'default',
                  background: selected ? highlightBackground : rowBackground,
                }}
              >
                <td style={tdStyle(borderColor)}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      color: selected ? accentColor : textColor,
                      fontWeight: selected ? 600 : 400,
                    }}
                  >
                    {v.asin}
                  </span>
                </td>
                <td style={{ ...tdStyle(borderColor), color: textColorDim }}>
                  {v.attributes || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function thStyle(border: string, color: string) {
  return {
    textAlign: 'left' as const,
    padding: '6px 8px',
    borderBottom: `1px solid ${border}`,
    fontSize: 10,
    fontWeight: 600,
    color,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  };
}

function tdStyle(border: string) {
  return {
    padding: '5px 8px',
    borderBottom: `1px solid ${border}`,
    verticalAlign: 'top' as const,
  };
}
