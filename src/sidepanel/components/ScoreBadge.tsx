import { useTheme } from '../theme/ThemeContext';

interface ScoreBadgeProps {
  score: number;
  size?: number;
}

export function ScoreBadge({ score, size = 56 }: ScoreBadgeProps) {
  const { tokens: t } = useTheme();

  const color =
    score >= 80 ? t.green : score >= 60 ? t.yellow : score >= 40 ? t.orange : t.red;
  const bgColor =
    score >= 80
      ? t.greenBg
      : score >= 60
        ? t.yellowBg
        : score >= 40
          ? t.orangeBg
          : t.redBg;
  const label =
    score >= 80 ? 'BUY' : score >= 60 ? 'MAYBE' : score >= 40 ? 'RISKY' : 'PASS';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `conic-gradient(${color} ${score * 3.6}deg, ${bgColor} 0deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: size - 8,
            height: size - 8,
            borderRadius: '50%',
            background: t.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <span
            style={{
              fontSize: size * 0.34,
              fontWeight: 700,
              color,
              lineHeight: 1,
            }}
          >
            {score}
          </span>
        </div>
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color,
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </span>
    </div>
  );
}
