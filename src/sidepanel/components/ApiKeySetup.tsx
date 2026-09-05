import { useState } from 'react';
import { useTheme } from '../theme/ThemeContext';

interface ApiKeySetupProps {
  onSaved: () => void;
}

export function ApiKeySetup({ onSaved }: ApiKeySetupProps) {
  const { tokens: t } = useTheme();
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const handleSave = () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setStatus('idle');

    chrome.runtime.sendMessage(
      { type: 'SET_API_KEY', apiKey: apiKey.trim() },
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

  const handleClear = () => {
    chrome.storage.local.remove('settings:apiKey', () => {
      setApiKey('');
      setStatus('idle');
    });
  };

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
        Settings
      </div>

      <div>
        <label
          style={{
            fontSize: 10,
            color: t.textMuted,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
            display: 'block',
            marginBottom: 4,
          }}
        >
          Rainforest API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Enter your API key..."
          style={{
            width: '100%',
            padding: '8px 10px',
            fontSize: 12,
            background: t.card,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 6,
            color: t.text,
            fontFamily: 'monospace',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div
          style={{
            fontSize: 10,
            color: t.textDim,
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          Get your API key from rainforestapi.com
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleSave}
          disabled={!apiKey.trim() || saving}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: 12,
            fontWeight: 600,
            color: '#fff',
            background:
              status === 'saved' ? t.green : !apiKey.trim() ? t.textDim : t.accent,
            border: 'none',
            borderRadius: 8,
            cursor: apiKey.trim() && !saving ? 'pointer' : 'default',
            fontFamily: 'inherit',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : status === 'saved' ? 'Saved!' : 'Save Key'}
        </button>
        <button
          onClick={handleClear}
          style={{
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            color: t.textMuted,
            background: t.card,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Clear
        </button>
      </div>

      {status === 'error' && (
        <div style={{ fontSize: 11, color: t.red }}>
          Failed to save. Try again.
        </div>
      )}
    </div>
  );
}
