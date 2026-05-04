import { useEffect, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';

interface ApiKeySetupProps {
  onSaved: () => void;
}

export function ApiKeySetup({ onSaved }: ApiKeySetupProps) {
  const { tokens: t } = useTheme();
  const [rfKey, setRfKey] = useState('');
  const [anthKey, setAnthKey] = useState('');
  const [hasAnthKey, setHasAnthKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: 'GET_ANTHROPIC_KEY_STATUS' },
      (response) => {
        setHasAnthKey(!!response?.hasKey);
      },
    );
  }, []);

  const saveOne = (
    type: 'SET_API_KEY' | 'SET_ANTHROPIC_KEY',
    value: string,
  ): Promise<boolean> =>
    new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, apiKey: value }, (response) => {
        resolve(!!response?.success);
      });
    });

  const handleSave = async () => {
    if (!rfKey.trim() && !anthKey.trim()) return;
    setSaving(true);
    setStatus('idle');
    let ok = true;
    if (rfKey.trim()) ok = ok && (await saveOne('SET_API_KEY', rfKey.trim()));
    if (anthKey.trim()) ok = ok && (await saveOne('SET_ANTHROPIC_KEY', anthKey.trim()));
    setSaving(false);
    if (ok) {
      setStatus('saved');
      setTimeout(onSaved, 500);
    } else {
      setStatus('error');
    }
  };

  const handleClear = () => {
    chrome.storage.local.remove(
      ['settings:apiKey', 'settings:anthropicApiKey'],
      () => {
        setRfKey('');
        setAnthKey('');
        setHasAnthKey(false);
        setStatus('idle');
      },
    );
  };

  const labelStyle = {
    fontSize: 10,
    color: t.textMuted,
    fontWeight: 600 as const,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    display: 'block',
    marginBottom: 4,
  };
  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    fontSize: 12,
    background: t.card,
    border: `1px solid ${t.cardBorder}`,
    borderRadius: 6,
    color: t.text,
    fontFamily: 'monospace' as const,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };
  const helperStyle = {
    fontSize: 10,
    color: t.textDim,
    marginTop: 4,
    lineHeight: 1.4,
  };

  return (
    <div
      style={{
        padding: '20px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Settings</div>

      <div>
        <label style={labelStyle}>Rainforest API Key</label>
        <input
          type="password"
          value={rfKey}
          onChange={(e) => setRfKey(e.target.value)}
          placeholder="Enter your Rainforest API key..."
          style={inputStyle}
        />
        <div style={helperStyle}>Get your key from rainforestapi.com</div>
      </div>

      <div>
        <label style={labelStyle}>
          Anthropic API Key {hasAnthKey ? '(saved)' : '(optional, for batch)'}
        </label>
        <input
          type="password"
          value={anthKey}
          onChange={(e) => setAnthKey(e.target.value)}
          placeholder={hasAnthKey ? 'Replace existing key...' : 'Enter your Anthropic API key...'}
          style={inputStyle}
        />
        <div style={helperStyle}>
          Used by image batch processing. Personal use only — keys are stored
          locally and sent direct to Anthropic from your browser.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleSave}
          disabled={(!rfKey.trim() && !anthKey.trim()) || saving}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: 12,
            fontWeight: 600,
            color: '#fff',
            background:
              status === 'saved'
                ? t.green
                : !rfKey.trim() && !anthKey.trim()
                  ? t.textDim
                  : t.accent,
            border: 'none',
            borderRadius: 8,
            cursor: (rfKey.trim() || anthKey.trim()) && !saving ? 'pointer' : 'default',
            fontFamily: 'inherit',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : status === 'saved' ? 'Saved!' : 'Save Keys'}
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
        <div style={{ fontSize: 11, color: t.red }}>Failed to save. Try again.</div>
      )}
    </div>
  );
}
