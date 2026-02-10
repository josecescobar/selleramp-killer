import { useTheme } from '../theme/ThemeContext';

interface MetricBoxProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

export function MetricBox({ label, value, sub, color }: MetricBoxProps) {
  const { tokens: t } = useTheme();

  return (
    <div
      style={{
        flex: 1,
        padding: '10px 8px',
        background: t.card,
        border: `1px solid ${t.cardBorder}`,
        borderRadius: 8,
        textAlign: 'center',
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: t.textMuted,
          marginBottom: 4,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase' as const,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: color || t.text,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: t.textDim, marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}
