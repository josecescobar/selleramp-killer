import { useId, useMemo, useState } from 'react';
import type { KeepaPoint } from '../api/keepa';

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  /** Right-axis (e.g. sales rank, offer count) — uses an inverted/secondary scale. */
  rightAxis?: boolean;
  /** Format a value for tooltip and axis label. */
  format: (v: number) => string;
  data: KeepaPoint[];
}

export interface PriceHistoryChartProps {
  series: ChartSeries[];
  /** Filter window in days; null = all data. */
  windowDays?: number | null;
  width?: number;
  height?: number;
  background?: string;
  axisColor?: string;
  textColor?: string;
  textColorDim?: string;
  emptyMessage?: string;
}

const DEFAULTS = {
  width: 520,
  height: 220,
  background: 'transparent',
  axisColor: '#e5e7eb',
  textColor: '#111827',
  textColorDim: '#9ca3af',
};

export function PriceHistoryChart(props: PriceHistoryChartProps) {
  const {
    series,
    windowDays = 90,
    width = DEFAULTS.width,
    height = DEFAULTS.height,
    axisColor = DEFAULTS.axisColor,
    textColor = DEFAULTS.textColor,
    textColorDim = DEFAULTS.textColorDim,
    emptyMessage = 'No history data yet.',
  } = props;

  const uid = useId().replace(/:/g, '_');
  const [enabledKeys, setEnabledKeys] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(series.map((s) => [s.key, true])),
  );
  const [hoverX, setHoverX] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (windowDays == null) return series;
    const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    return series.map((s) => ({
      ...s,
      data: s.data.filter((p) => p.ts >= cutoff),
    }));
  }, [series, windowDays]);

  const visible = filtered.filter((s) => enabledKeys[s.key] && s.data.length > 1);

  const leftAxisSeries = visible.filter((s) => !s.rightAxis);
  const rightAxisSeries = visible.filter((s) => s.rightAxis);

  const allTimes = visible.flatMap((s) => s.data.map((p) => p.ts));
  const tsMin = allTimes.length ? Math.min(...allTimes) : 0;
  const tsMax = allTimes.length ? Math.max(...allTimes) : 0;
  const tsRange = tsMax - tsMin || 1;

  const leftValues = leftAxisSeries.flatMap((s) => s.data.map((p) => p.value));
  const rightValues = rightAxisSeries.flatMap((s) => s.data.map((p) => p.value));
  const leftMin = leftValues.length ? Math.min(...leftValues) : 0;
  const leftMax = leftValues.length ? Math.max(...leftValues) : 1;
  const leftRange = leftMax - leftMin || 1;
  const rightMin = rightValues.length ? Math.min(...rightValues) : 0;
  const rightMax = rightValues.length ? Math.max(...rightValues) : 1;
  const rightRange = rightMax - rightMin || 1;

  const padL = leftAxisSeries.length ? 56 : 12;
  const padR = rightAxisSeries.length ? 56 : 12;
  const padT = 12;
  const padB = 28;
  const chartW = Math.max(40, width - padL - padR);
  const chartH = Math.max(40, height - padT - padB);

  const xPos = (ts: number) => padL + ((ts - tsMin) / tsRange) * chartW;
  const yLeft = (v: number) => padT + chartH - ((v - leftMin) / leftRange) * chartH;
  const yRight = (v: number) => padT + chartH - ((v - rightMin) / rightRange) * chartH;

  const pathFor = (data: KeepaPoint[], yFn: (v: number) => number) =>
    data
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${xPos(p.ts).toFixed(1)},${yFn(p.value).toFixed(1)}`)
      .join(' ');

  const fmtDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const xLabels = useMemo(() => {
    if (!allTimes.length) return [];
    const midTs = tsMin + tsRange / 2;
    return [
      { label: fmtDate(tsMin), x: xPos(tsMin) },
      { label: fmtDate(midTs), x: xPos(midTs) },
      { label: fmtDate(tsMax), x: xPos(tsMax) },
    ];
  }, [tsMin, tsMax, tsRange, padL, chartW]); // eslint-disable-line react-hooks/exhaustive-deps

  const leftLabels = useMemo(() => {
    if (!leftAxisSeries.length) return [];
    const mid = (leftMin + leftMax) / 2;
    return [leftMax, mid, leftMin];
  }, [leftMin, leftMax, leftAxisSeries.length]);

  const rightLabels = useMemo(() => {
    if (!rightAxisSeries.length) return [];
    const mid = (rightMin + rightMax) / 2;
    return [rightMax, mid, rightMin];
  }, [rightMin, rightMax, rightAxisSeries.length]);

  // Hover lookup: nearest point per series.
  const hoverPoints =
    hoverX !== null
      ? visible.map((s) => {
          let best = s.data[0];
          let bestDx = Infinity;
          for (const p of s.data) {
            const dx = Math.abs(xPos(p.ts) - hoverX);
            if (dx < bestDx) {
              bestDx = dx;
              best = p;
            }
          }
          return { series: s, point: best };
        })
      : [];

  const hasAnyData = visible.length > 0 && allTimes.length > 0;
  const formatValueForLeft = (v: number) =>
    leftAxisSeries[0]?.format(v) ?? `${v.toFixed(2)}`;
  const formatValueForRight = (v: number) =>
    rightAxisSeries[0]?.format(v) ?? `${Math.round(v)}`;

  return (
    <div style={{ width: '100%' }}>
      {/* Legend / toggle */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 8,
          fontSize: 11,
          color: textColorDim,
        }}
      >
        {series.map((s) => {
          const on = enabledKeys[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() =>
                setEnabledKeys((prev) => ({ ...prev, [s.key]: !prev[s.key] }))
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 6px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 11,
                color: on ? textColor : textColorDim,
                opacity: on ? 1 : 0.5,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: s.color,
                  display: 'inline-block',
                }}
              />
              {s.label}
            </button>
          );
        })}
      </div>

      <svg
        role="img"
        aria-label="Price history chart"
        width={width}
        height={height}
        style={{ display: 'block', maxWidth: '100%', height: 'auto', cursor: hasAnyData ? 'crosshair' : 'default' }}
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const scaleX = rect.width / width;
          const x = (e.clientX - rect.left) / scaleX;
          if (x >= padL && x <= width - padR) setHoverX(x);
          else setHoverX(null);
        }}
        onMouseLeave={() => setHoverX(null)}
      >
        <defs>
          {visible.map((s) => (
            <linearGradient key={s.key} id={`grad_${uid}_${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Plot frame */}
        <rect
          x={padL}
          y={padT}
          width={chartW}
          height={chartH}
          fill="none"
          stroke={axisColor}
          strokeWidth="0.5"
        />

        {/* Y axis labels — left */}
        {leftLabels.map((v, i) => (
          <g key={`l${i}`}>
            <line
              x1={padL}
              y1={yLeft(v)}
              x2={width - padR}
              y2={yLeft(v)}
              stroke={axisColor}
              strokeWidth="0.5"
              strokeDasharray="2,3"
              opacity="0.5"
            />
            <text
              x={padL - 4}
              y={yLeft(v) + 3}
              textAnchor="end"
              fontSize="9"
              fill={textColorDim}
              fontFamily="inherit"
            >
              {formatValueForLeft(v)}
            </text>
          </g>
        ))}

        {/* Y axis labels — right */}
        {rightLabels.map((v, i) => (
          <text
            key={`r${i}`}
            x={width - padR + 4}
            y={yRight(v) + 3}
            textAnchor="start"
            fontSize="9"
            fill={textColorDim}
            fontFamily="inherit"
          >
            {formatValueForRight(v)}
          </text>
        ))}

        {/* X axis labels */}
        {xLabels.map((xl, i) => (
          <text
            key={`x${i}`}
            x={xl.x}
            y={height - 8}
            textAnchor="middle"
            fontSize="9"
            fill={textColorDim}
            fontFamily="inherit"
          >
            {xl.label}
          </text>
        ))}

        {/* Series */}
        {visible.map((s) => {
          const yFn = s.rightAxis ? yRight : yLeft;
          const path = pathFor(s.data, yFn);
          const last = s.data[s.data.length - 1];
          const fillPath = `${path} L${xPos(last.ts).toFixed(1)},${(padT + chartH).toFixed(1)} L${xPos(s.data[0].ts).toFixed(1)},${(padT + chartH).toFixed(1)} Z`;
          return (
            <g key={s.key}>
              {!s.rightAxis && <path d={fillPath} fill={`url(#grad_${uid}_${s.key})`} />}
              <path d={path} fill="none" stroke={s.color} strokeWidth={s.rightAxis ? 1.4 : 1.6} />
            </g>
          );
        })}

        {/* Hover crosshair */}
        {hoverX !== null && hasAnyData && (
          <line
            x1={hoverX}
            y1={padT}
            x2={hoverX}
            y2={padT + chartH}
            stroke={textColorDim}
            strokeWidth="0.5"
            strokeDasharray="3,3"
          />
        )}

        {/* Hover dots per series */}
        {hoverPoints.map(({ series: s, point }) => {
          const yFn = s.rightAxis ? yRight : yLeft;
          return (
            <circle
              key={s.key}
              cx={xPos(point.ts)}
              cy={yFn(point.value)}
              r="3"
              fill={s.color}
              stroke="#fff"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {/* Hover tooltip table */}
      {hoverPoints.length > 0 && (
        <div
          style={{
            marginTop: 6,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: 11,
            color: textColor,
          }}
        >
          <span style={{ color: textColorDim }}>
            {fmtDate(hoverPoints[0].point.ts)}
          </span>
          {hoverPoints.map(({ series: s, point }) => (
            <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: s.color,
                  display: 'inline-block',
                }}
              />
              <span style={{ color: textColorDim }}>{s.label}</span>
              <strong>{s.format(point.value)}</strong>
            </span>
          ))}
        </div>
      )}

      {!hasAnyData && (
        <div
          style={{
            padding: '20px 12px',
            textAlign: 'center',
            fontSize: 11,
            color: textColorDim,
          }}
        >
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

// --- Series-builder helpers ---

export function buildKeepaSeries(opts: {
  amazon: KeepaPoint[];
  newPrice: KeepaPoint[];
  buyBox: KeepaPoint[];
  salesRank: KeepaPoint[];
  offerCountNew: KeepaPoint[];
  formatPrice?: (cents: number) => string;
  formatRank?: (n: number) => string;
  formatCount?: (n: number) => string;
}): ChartSeries[] {
  const fmtPrice = opts.formatPrice ?? ((c) => `$${(c / 100).toFixed(2)}`);
  const fmtRank = opts.formatRank ?? ((n) => `#${n.toLocaleString()}`);
  const fmtCount = opts.formatCount ?? ((n) => `${n}`);

  return [
    { key: 'amazon', label: 'Amazon', color: '#ff9900', format: fmtPrice, data: opts.amazon },
    { key: 'newPrice', label: 'New', color: '#337ab7', format: fmtPrice, data: opts.newPrice },
    { key: 'buyBox', label: 'Buy Box', color: '#d9534f', format: fmtPrice, data: opts.buyBox },
    { key: 'salesRank', label: 'Sales Rank', color: '#8b5cf6', format: fmtRank, data: opts.salesRank, rightAxis: true },
    { key: 'offerCountNew', label: 'Offers', color: '#5cb85c', format: fmtCount, data: opts.offerCountNew, rightAxis: true },
  ];
}
