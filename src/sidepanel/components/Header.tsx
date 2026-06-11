import { useTheme } from '../theme/ThemeContext';

interface HeaderProps {
  expanded: boolean;
  onToggleExpand: () => void;
  onOpenSettings: () => void;
  mode: 'product' | 'batch';
  onToggleMode: () => void;
}

export function Header({
  expanded,
  onToggleExpand,
  onOpenSettings,
  mode: appMode,
  onToggleMode,
}: HeaderProps) {
  const { tokens: t, toggle: toggleTheme, mode } = useTheme();

  return (
    <div
      style={{
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${t.divider}`,
        background: t.bg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: '#fff',
            fontWeight: 800,
          }}
        >
          S
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: t.text,
            letterSpacing: '-0.01em',
          }}
        >
          SourceTool
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: t.accent,
            background: t.accentGlow,
            padding: '1px 6px',
            borderRadius: 4,
          }}
        >
          PRO
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={onToggleMode}
          title={appMode === 'batch' ? 'Switch to product view' : 'Open batch image analysis'}
          style={{
            background: appMode === 'batch' ? t.accent : 'none',
            border: `1px solid ${appMode === 'batch' ? t.accent : t.border}`,
            borderRadius: 6,
            color: appMode === 'batch' ? '#fff' : t.textMuted,
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Batch
        </button>
        <button
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: `1px solid ${t.border}`,
            borderRadius: 6,
            color: t.textMuted,
            fontSize: 11,
            padding: '3px 8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {mode === 'dark' ? '\u2600' : '\u{1F319}'}
        </button>
        <button
          onClick={onOpenSettings}
          style={{
            background: 'none',
            border: `1px solid ${t.border}`,
            borderRadius: 6,
            color: t.textMuted,
            fontSize: 11,
            padding: '3px 8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {'\u2699\uFE0F'}
        </button>
        <button
          onClick={onToggleExpand}
          style={{
            background: 'none',
            border: `1px solid ${t.border}`,
            borderRadius: 6,
            color: t.textMuted,
            fontSize: 11,
            padding: '3px 8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {expanded ? '\u25C1' : '\u25B7'}
        </button>
      </div>
    </div>
  );
}
