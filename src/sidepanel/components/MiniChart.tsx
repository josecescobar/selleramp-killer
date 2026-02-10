import { useTheme } from '../theme/ThemeContext';

interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
}

export function MiniChart({ data, width = 280, height = 80 }: MiniChartProps) {
  const { tokens: t } = useTheme();

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const linePath = `M${points.join(' L')}`;
  const fillPath = `${linePath} L${width - padding},${height} L${padding},${height} Z`;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={t.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#chartGrad)" />
      <path d={linePath} fill="none" stroke={t.accent} strokeWidth="2" />
    </svg>
  );
}
