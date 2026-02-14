import { useState } from 'react';
import { useTheme } from '../theme/ThemeContext';

interface EbayCredentialsSetupProps {
  onSaved: () => void;
}

export function EbayCredentialsSetup({ onSaved }: EbayCredentialsSetupProps) {
  const { tokens: t } = useTheme();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const handleSave = () => {
    if (!clientId.trim() || !clientSecret.trim()) return;
    setSaving(true);
    setStatus('idle');

    chrome.runtime.sendMessage(
      {
        type: 'SET_EBAY_CREDENTIALS',
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
      },
      (response) => {
        setSaving(false);
        if (response?.success) {
          setStatus('saved');
          setTimeout(onSaved, 500);
        } else {
          setStatus('error');
        }
      },
    );
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    fontSize: 12,
    background: t.card,
    border: `1px solid ${t.cardBorder}`,
    borderRadius: 6,
    color: t.text,
    fontFamily: 'monospace',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    fontSize: 10,
    color: t.textMuted,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    display: 'block',
    marginBottom: 4,
  };

  const canSave = clientId.trim() && clientSecret.trim();

  return (
    <div
      style={{
        padding: '20px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
        eBay API Setup
      </div>

      <div>
        <label style={labelStyle}>Client ID</label>
        <input
          type="password"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Enter your eBay Client ID..."
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Client Secret</label>
        <input
          type="password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Enter your eBay Client Secret..."
          style={inputStyle}
        />
      </div>

      <div
        style={{
          fontSize: 10,
          color: t.textDim,
          lineHeight: 1.4,
        }}
      >
        Get credentials from developer.ebay.com
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        style={{
          width: '100%',
          padding: '8px 0',
          fontSize: 12,
          fontWeight: 600,
          color: '#fff',
          background:
            status === 'saved' ? t.green : !canSave ? t.textDim : t.accent,
          border: 'none',
          borderRadius: 8,
          cursor: canSave && !saving ? 'pointer' : 'default',
          fontFamily: 'inherit',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Saving...' : status === 'saved' ? 'Saved!' : 'Save Credentials'}
      </button>

      {status === 'error' && (
        <div style={{ fontSize: 11, color: t.red }}>
          Failed to save. Try again.
        </div>
      )}
    </div>
  );
}
