'use client';

import { useEffect, useState } from 'react';
import { Fieldset } from '@/components/dashboard/Fieldset';
import {
  getAnthropicKey,
  getKeepaKey,
  getRainforestKey,
  setAnthropicKey,
  setKeepaKey,
  setRainforestKey,
} from '@/lib/batch-keys';

export default function IntegrationsPage() {
  const [rfKey, setRfKey] = useState('');
  const [anthKey, setAnthKey] = useState('');
  const [keepaKey, setKeepaKey2] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setRfKey(getRainforestKey() ?? '');
    setAnthKey(getAnthropicKey() ?? '');
    setKeepaKey2(getKeepaKey() ?? '');
  }, []);

  const save = () => {
    setRainforestKey(rfKey.trim());
    setAnthropicKey(anthKey.trim());
    setKeepaKey(keepaKey.trim());
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary mb-1">Integrations</h1>
        <p className="text-text-muted text-sm">
          Connect third-party services to enhance your sourcing workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Fieldset title="Rainforest API">
          <p className="text-text-muted text-sm mb-3">
            Powers product, offers, and BSR lookups for Amazon analysis and batch image processing.
          </p>
          <input
            type="password"
            value={rfKey}
            onChange={(e) => setRfKey(e.target.value)}
            placeholder="Rainforest API key"
            className="w-full bg-bg border border-card-border rounded px-3 py-2 text-sm text-text-primary font-mono"
          />
          <a
            href="https://www.rainforestapi.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent text-xs hover:underline mt-2 inline-block"
          >
            Get a key
          </a>
        </Fieldset>

        <Fieldset title="Anthropic (Claude)">
          <p className="text-text-muted text-sm mb-3">
            Used by image batch processing to extract product identifiers from photos and screenshots.
          </p>
          <input
            type="password"
            value={anthKey}
            onChange={(e) => setAnthKey(e.target.value)}
            placeholder="Anthropic API key"
            className="w-full bg-bg border border-card-border rounded px-3 py-2 text-sm text-text-primary font-mono"
          />
          <a
            href="https://console.anthropic.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent text-xs hover:underline mt-2 inline-block"
          >
            Get a key
          </a>
        </Fieldset>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={save}
          disabled={!rfKey.trim() && !anthKey.trim()}
          className="btn-gradient text-white text-sm font-medium px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savedFlash ? 'Saved!' : 'Save keys'}
        </button>
        <p className="text-xs text-text-muted">
          Personal-use only. Keys are stored in your browser&apos;s localStorage and sent
          directly to Rainforest and Anthropic from this page.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Fieldset title="Google Sheets">
          <p className="text-text-muted text-sm mb-4">
            Export your product analysis data directly to Google Sheets for easy tracking and collaboration.
          </p>
          <div className="flex items-center gap-3">
            <button className="btn-gradient text-white text-sm font-medium px-4 py-2">
              Connect to Google
            </button>
            <a
              href="https://accounts.google.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent text-sm hover:underline"
            >
              Sign-up
            </a>
          </div>
        </Fieldset>

        <Fieldset title="Keepa">
          <p className="text-text-muted text-sm mb-3">
            Powers price-history, BSR, and offer-count charts on the result page.
          </p>
          <input
            type="password"
            value={keepaKey}
            onChange={(e) => setKeepaKey2(e.target.value)}
            placeholder="Keepa API key"
            className="w-full bg-bg border border-card-border rounded px-3 py-2 text-sm text-text-primary font-mono"
          />
          <a
            href="https://keepa.com/#!api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent text-xs hover:underline mt-2 inline-block"
          >
            Get a key
          </a>
        </Fieldset>
      </div>
    </div>
  );
}
