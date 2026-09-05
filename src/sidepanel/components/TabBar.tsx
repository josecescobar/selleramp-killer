import type { TabId } from '../App';
import { useTheme } from '../theme/ThemeContext';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '\u26A1' },
  { id: 'offers', label: 'Offers', icon: '\uD83C\uDFF7\uFE0F' },
  { id: 'alerts', label: 'Alerts', icon: '\uD83D\uDEE1\uFE0F' },
  { id: 'buylist', label: 'Buy List', icon: '\uD83D\uDED2' },
  { id: 'ebay', label: 'eBay', icon: '\uD83D\uDD04' },
];

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const { tokens: t } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        borderBottom: `1px solid ${t.divider}`,
        padding: '0 8px',
        background: t.bg,
      }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: 10,
            fontWeight: activeTab === tab.id ? 700 : 500,
            color: activeTab === tab.id ? t.accent : t.textMuted,
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === tab.id
                ? `2px solid ${t.accent}`
                : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'inherit',
            letterSpacing: '0.02em',
          }}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}
