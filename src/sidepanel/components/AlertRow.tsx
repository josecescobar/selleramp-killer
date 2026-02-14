import { useTheme } from '../theme/ThemeContext';
import type { AlertStatus } from '@shared/types/alerts';

interface AlertRowProps {
  icon: string;
  label: string;
  status: AlertStatus;
  detail: string;
}

export function AlertRow({ icon, label, status, detail }: AlertRowProps) {
  const { tokens: t } = useTheme();

  const statusConfig: Record<AlertStatus, { color: string; bg: string; text: string }> = {
    safe: { color: t.green, bg: t.greenBg, text: 'CLEAR' },
    warn: { color: t.yellow, bg: t.yellowBg, text: 'WARN' },
    danger: { color: t.red, bg: t.redBg, text: 'RISK' },
    neutral: { color: t.textMuted, bg: t.surfaceHover, text: 'N/A' },
  };

  const cfg = statusConfig[status];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        background: cfg.bg,
        borderRadius: 6,
        border: `1px solid ${t.cardBorder}`,
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: t.text }}>{label}</div>
        <div style={{ fontSize: 10, color: t.textDim }}>{detail}</div>
      </div>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: cfg.color,
          letterSpacing: '0.06em',
          padding: '2px 6px',
          borderRadius: 4,
          background: cfg.bg,
          border: `1px solid ${cfg.color}30`,
        }}
      >
        {cfg.text}
      </span>
    </div>
  );
}
