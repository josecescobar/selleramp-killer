import { useState, useId } from 'react';
import { useTheme } from '../theme/ThemeContext';
import type { PriceSnapshot } from '@shared/types/messages';

interface HistoryChartProps {
  data: PriceSnapshot[];
  valueKey: 'price' | 'bsr';
  color: string;
  width?: number;
  height?: number;
  formatValue: (v: number) => string;
}

export function HistoryChart({
  data,
  valueKey,
  color,
  width = 300,
  height = 120,
  formatValue,
}: HistoryChartProps) {
  const { tokens: t } = useTheme();
  const uid = useId().replace(/:/g, '_');
  const gradId = `hcGrad${uid}`;
  const [hover, setHover] = useState<number | null>(null);

  if (data.length < 2) return null;

  const padL = 40;
  const padR = 8;
  const padT = 8;
  const padB = 20;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const values = data.map((s) => s[valueKey]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const tsMin = data[0].ts;
  const tsMax = data[data.length - 1].ts;
  const tsRange = tsMax - tsMin || 1;

  function xPos(ts: number) {
    return padL + ((ts - tsMin) / tsRange) * chartW;
  }
  function yPos(v: number) {
    return padT + chartH - ((v - min) / range) * chartH;
  }

  const points = data.map((s) => ({ x: xPos(s.ts), y: yPos(s[valueKey]) }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const fillPath = `${linePath} L${points[points.length - 1].x},${padT + chartH} L${points[0].x},${padT + chartH} Z`;

  // Y-axis labels
  const mid = (min + max) / 2;
  const yLabels = [
    { v: max, y: yPos(max) },
    { v: mid, y: yPos(mid) },
    { v: min, y: yPos(min) },
  ];

  // X-axis date labels (first, mid, last)
  const fmtDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  const midTs = data[Math.floor(data.length / 2)].ts;
  const xLabels = [
    { label: fmtDate(tsMin), x: xPos(tsMin) },
    { label: fmtDate(midTs), x: xPos(midTs) },
    { label: fmtDate(tsMax), x: xPos(tsMax) },
  ];

  // Find closest point to hover
  const hoverData =
    hover !== null
      ? data.reduce((closest, s) => {
          const dx = Math.abs(xPos(s.ts) - hover);
          const closestDx = Math.abs(xPos(closest.ts) - hover);
          return dx < closestDx ? s : closest;
        }, data[0])
      : null;

  const hoverX = hoverData ? xPos(hoverData.ts) : 0;
  const hoverY = hoverData ? yPos(hoverData[valueKey]) : 0;

  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'block', cursor: 'crosshair' }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x >= padL && x <= width - padR) setHover(x);
        else setHover(null);
      }}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y-axis labels */}
      {yLabels.map((yl, i) => (
        <text
          key={i}
          x={padL - 4}
          y={yl.y + 3}
          textAnchor="end"
          fontSize="8"
          fill={t.textDim}
          fontFamily="inherit"
        >
          {formatValue(yl.v)}
        </text>
      ))}

      {/* X-axis labels */}
      {xLabels.map((xl, i) => (
        <text
          key={i}
          x={xl.x}
          y={height - 3}
          textAnchor="middle"
          fontSize="8"
          fill={t.textDim}
          fontFamily="inherit"
        >
          {xl.label}
        </text>
      ))}

      {/* Grid lines */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke={t.cardBorder} strokeWidth="0.5" />
      <line x1={padL} y1={padT + chartH} x2={width - padR} y2={padT + chartH} stroke={t.cardBorder} strokeWidth="0.5" />

      {/* Fill + Line */}
      <path d={fillPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" />

      {/* Data point dots */}
      {data.length <= 20 &&
        points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />
        ))}

      {/* Hover crosshair + tooltip */}
      {hoverData && (
        <>
          <line x1={hoverX} y1={padT} x2={hoverX} y2={padT + chartH} stroke={t.textDim} strokeWidth="0.5" strokeDasharray="3,3" />
          <circle cx={hoverX} cy={hoverY} r="3.5" fill={color} stroke={t.card} strokeWidth="1.5" />
          <rect
            x={Math.min(hoverX + 6, width - 90)}
            y={Math.max(hoverY - 28, padT)}
            width="82"
            height="22"
            rx="4"
            fill={t.card}
            stroke={t.cardBorder}
            strokeWidth="1"
          />
          <text
            x={Math.min(hoverX + 10, width - 86)}
            y={Math.max(hoverY - 13, padT + 15)}
            fontSize="9"
            fill={t.text}
            fontFamily="inherit"
            fontWeight="600"
          >
            {formatValue(hoverData[valueKey])}
          </text>
          <text
            x={Math.min(hoverX + 56, width - 40)}
            y={Math.max(hoverY - 13, padT + 15)}
            fontSize="8"
            fill={t.textDim}
            fontFamily="inherit"
          >
            {fmtDate(hoverData.ts)}
          </text>
        </>
      )}
    </svg>
  );
}
