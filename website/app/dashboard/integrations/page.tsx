'use client';

import { useEffect, useState } from 'react';
import {
  getAnthropicKey,
  getKeepaKey,
  getRainforestKey,
  setAnthropicKey,
  setKeepaKey,
  setRainforestKey,
} from '@/lib/batch-keys';

interface KeyCard {
  id: 'rainforest' | 'anthropic' | 'keepa';
  title: string;
  blurb: string;
  helpUrl: string;
  helpLabel: string;
  placeholder: string;
}

const CARDS: KeyCard[] = [
  {
    id: 'rainforest',
    title: 'Rainforest API',
    blurb: 'Product, offers, and BSR lookups for Amazon analysis and batch image processing.',
    helpUrl: 'https://www.rainforestapi.com/',
    helpLabel: 'rainforestapi.com',
    placeholder: 'Rainforest API key',
  },
  {
    id: 'anthropic',
    title: 'Anthropic (Claude)',
    blurb: 'Image batch processing — extracts ASINs / UPCs from photos and screenshots.',
    helpUrl: 'https://console.anthropic.com/',
    helpLabel: 'console.anthropic.com',
    placeholder: 'Anthropic API key (sk-ant-…)',
  },
  {
    id: 'keepa',
    title: 'Keepa',
    blurb: 'Price-history, BSR, offer-count charts and product variations on the result page.',
    helpUrl: 'https://keepa.com/#!api',
    helpLabel: 'keepa.com/#!api',
    placeholder: 'Keepa API key',
  },
];

export default function IntegrationsPage() {
  const [values, setValues] = useState<Record<KeyCard['id'], string>>({
    rainforest: '',
    anthropic: '',
    keepa: '',
  });
  const [saved, setSaved] = useState<Record<KeyCard['id'], boolean>>({
    rainforest: false,
    anthropic: false,
    keepa: false,
  });
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const next = {
      rainforest: getRainforestKey() ?? '',
      anthropic: getAnthropicKey() ?? '',
      keepa: getKeepaKey() ?? '',
    };
    setValues(next);
    setSaved({
      rainforest: !!next.rainforest,
      anthropic: !!next.anthropic,
      keepa: !!next.keepa,
    });
  }, []);

  const update = (id: KeyCard['id'], v: string) =>
    setValues((prev) => ({ ...prev, [id]: v }));

  const save = () => {
    setRainforestKey(values.rainforest.trim());
    setAnthropicKey(values.anthropic.trim());
    setKeepaKey(values.keepa.trim());
    setSaved({
      rainforest: !!values.rainforest.trim(),
      anthropic: !!values.anthropic.trim(),
      keepa: !!values.keepa.trim(),
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const isDirty = CARDS.some((c) => {
    const stored =
      c.id === 'rainforest'
        ? getRainforestKey() ?? ''
        : c.id === 'anthropic'
          ? getAnthropicKey() ?? ''
          : getKeepaKey() ?? '';
    return values[c.id] !== stored;
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary mb-1">Integrations</h1>
        <p className="text-text-muted text-sm">
          Connect third-party services to enhance your sourcing workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {CARDS.map((card) => (
          <div
            key={card.id}
            className="bg-card border border-card-border p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">{card.title}</h2>
              <span
                className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ${
                  saved[card.id]
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {saved[card.id] ? '● Connected' : '○ Not set'}
              </span>
            </div>
            <p className="text-text-muted text-xs leading-snug">{card.blurb}</p>
            <input
              type="password"
              value={values[card.id]}
              onChange={(e) => update(card.id, e.target.value)}
              placeholder={card.placeholder}
              className="w-full bg-bg border border-card-border rounded px-2.5 py-1.5 text-sm text-text-primary font-mono focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
            />
            <a
              href={card.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent text-[11px] hover:underline self-start"
            >
              {card.helpLabel} →
            </a>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-bg/95 backdrop-blur border-t border-card-border py-3 -mx-6 px-6 flex items-center gap-3">
        <button
          onClick={save}
          disabled={!isDirty}
          className="btn-gradient text-white text-sm font-medium px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {savedFlash ? '✓ Saved' : 'Save keys'}
        </button>
        <p className="text-xs text-text-muted">
          Personal-use only. Keys live in your browser&apos;s localStorage and are
          sent directly to each provider from your device.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="bg-card border border-card-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Google Sheets</h2>
            <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              ○ Coming soon
            </span>
          </div>
          <p className="text-text-muted text-xs leading-snug mb-3">
            Export product analysis directly to Google Sheets for tracking and collaboration.
          </p>
          <button
            disabled
            className="text-sm font-medium px-3 py-1.5 border border-card-border text-text-muted cursor-not-allowed"
          >
            Connect to Google
          </button>
        </div>

        <div className="bg-card border border-card-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Watches & alerts</h2>
            <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              ○ Roadmap
            </span>
          </div>
          <p className="text-text-muted text-xs leading-snug">
            Track ASINs and get notified when price drops or BSR spikes. Hooked up
            once Keepa integration matures.
          </p>
        </div>
      </div>
    </div>
  );
}
