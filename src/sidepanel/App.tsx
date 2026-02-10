import { useState } from 'react';
import { useTheme } from './theme/ThemeContext';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { OverviewTab } from './tabs/OverviewTab';
import { OffersTab } from './tabs/OffersTab';
import { AlertsTab } from './tabs/AlertsTab';
import { HistoryTab } from './tabs/HistoryTab';
import { EbayTab } from './tabs/EbayTab';
import { ApiKeySetup } from './components/ApiKeySetup';
import { useProductAnalysis } from './hooks/useProductAnalysis';

export type TabId = 'overview' | 'offers' | 'alerts' | 'history' | 'ebay';

export function App() {
  const { tokens: t } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [expanded, setExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const analysis = useProductAnalysis();

  return (
    <div
      style={{
        width: expanded ? 380 : 340,
        minHeight: '100vh',
        background: t.surface,
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        transition: 'width 0.2s ease',
      }}
    >
      <Header
        expanded={expanded}
        onToggleExpand={() => setExpanded(!expanded)}
        onOpenSettings={() => setShowSettings(!showSettings)}
      />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div
        style={{
          maxHeight: 'calc(100vh - 110px)',
          overflowY: 'auto',
        }}
      >
        {/* Settings panel */}
        {showSettings && (
          <ApiKeySetup
            onSaved={() => {
              setShowSettings(false);
              analysis.refetch();
            }}
          />
        )}

        {/* API key missing state */}
        {!showSettings && !analysis.hasApiKey && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 32 }}>{'\u{1F511}'}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
              API Key Required
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.5 }}>
              Enter your Rainforest API key to start analyzing products.
            </div>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: '8px 20px',
                fontSize: 12,
                fontWeight: 600,
                color: '#fff',
                background: t.accent,
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Enter API Key
            </button>
          </div>
        )}

        {/* Loading state */}
        {!showSettings && analysis.hasApiKey && analysis.loading && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: `3px solid ${t.cardBorder}`,
                borderTopColor: t.accent,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <div style={{ fontSize: 11, color: t.textMuted }}>
              Analyzing product...
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* Error state */}
        {!showSettings && analysis.error && !analysis.loading && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 32 }}>{'\u26A0\uFE0F'}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
              {analysis.error === 'API_KEY_INVALID'
                ? 'Invalid API Key'
                : analysis.error === 'RATE_LIMITED'
                  ? 'Rate Limited'
                  : 'Analysis Failed'}
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.5 }}>
              {analysis.error === 'API_KEY_INVALID'
                ? 'Your API key is invalid. Check your settings.'
                : analysis.error === 'RATE_LIMITED'
                  ? 'Too many requests. Try again in a moment.'
                  : 'Something went wrong. Try again.'}
            </div>
            <button
              onClick={analysis.refetch}
              style={{
                padding: '8px 20px',
                fontSize: 12,
                fontWeight: 600,
                color: '#fff',
                background: t.accent,
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* No ASIN state */}
        {!showSettings &&
          analysis.hasApiKey &&
          !analysis.loading &&
          !analysis.error &&
          !analysis.data && (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 32 }}>{'\u{1F50D}'}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
                No Product Selected
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.5 }}>
                Navigate to an Amazon product page to start analyzing.
              </div>
            </div>
          )}

        {/* Data loaded - show tabs */}
        {!showSettings && analysis.data && !analysis.loading && !analysis.error && (
          <>
            {activeTab === 'overview' && <OverviewTab data={analysis.data} />}
            {activeTab === 'offers' && <OffersTab data={analysis.data} />}
            {activeTab === 'alerts' && <AlertsTab data={analysis.data} />}
            {activeTab === 'history' && <HistoryTab data={analysis.data} asin={analysis.asin!} />}
            {activeTab === 'ebay' && <EbayTab data={analysis.data} />}
          </>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '6px 14px',
          borderTop: `1px solid ${t.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: t.bg,
        }}
      >
        <span style={{ fontSize: 9, color: t.textDim }}>
          {analysis.asin
            ? `ASIN: ${analysis.asin}`
            : 'Navigate to a product page'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: analysis.asin ? t.green : t.textDim,
            }}
          />
          <span style={{ fontSize: 9, color: t.textDim }}>
            {analysis.loading
              ? 'Analyzing...'
              : analysis.asin
                ? 'Connected'
                : 'Idle'}
          </span>
        </div>
      </div>
    </div>
  );
}
