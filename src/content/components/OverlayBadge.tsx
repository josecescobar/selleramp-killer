import { useState } from 'preact/hooks';

interface OverlayBadgeProps {
  asin: string;
  score?: number;
  loading?: boolean;
}

function getColor(score: number) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function getLabel(score: number) {
  if (score >= 80) return 'BUY';
  if (score >= 60) return 'MAYBE';
  if (score >= 40) return 'RISKY';
  return 'PASS';
}

export function OverlayBadge({ asin, score, loading }: OverlayBadgeProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleOpenPanel = () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL', asin });
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          border: 'none',
          color: '#fff',
          fontSize: 14,
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        S
      </button>
    );
  }

  const color = score != null ? getColor(score) : '#3b82f6';
  const label = score != null ? getLabel(score) : '...';

  return (
    <div
      style={{
        background: '#1a1d27',
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow:
          '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minWidth: 180,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          color: '#fff',
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        S
      </div>

      {/* Score */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#8b90a0', fontWeight: 500 }}>
          SourceTool
        </div>
        {loading ? (
          <div style={{ fontSize: 13, color: '#8b90a0' }}>Analyzing...</div>
        ) : score != null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color }}>{score}</span>
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
        ) : (
          <div style={{ fontSize: 13, color: '#5c6070' }}>No data</div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={handleOpenPanel}
          title="Open full analysis"
          style={{
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 6,
            color: '#3b82f6',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Details
        </button>
        <button
          onClick={() => setCollapsed(true)}
          title="Minimize"
          style={{
            background: 'transparent',
            border: '1px solid #2a2e3e',
            borderRadius: 6,
            color: '#5c6070',
            fontSize: 11,
            padding: '4px 6px',
            cursor: 'pointer',
          }}
        >
          _
        </button>
      </div>
    </div>
  );
}
