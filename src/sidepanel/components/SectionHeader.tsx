import { useTheme } from '../theme/ThemeContext';

interface SectionHeaderProps {
  icon: string;
  title: string;
  badge?: string;
}

export function SectionHeader({ icon, title, badge }: SectionHeaderProps) {
  const { tokens: t } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 0',
      }}
    >
      <span style={{ fontSize: 12 }}>{icon}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: t.text,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
        }}
      >
        {title}
      </span>
      {badge && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: t.accent,
            background: t.accentGlow,
            padding: '1px 6px',
            borderRadius: 4,
            marginLeft: 'auto',
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
