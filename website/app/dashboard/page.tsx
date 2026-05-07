'use client';

import { useState, FormEvent, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHistory } from '@/lib/history';

export default function DashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { entries } = useHistory();

  const recents = useMemo(() => entries.slice(0, 4), [entries]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/dashboard/result?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">
          Look up any product. Decide in seconds.
        </h1>
        <p className="text-text-muted text-sm max-w-xl">
          Paste an ASIN, UPC, ISBN, or keyword to pull profit, BSR, and Keepa
          history into one screen.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8 max-w-2xl">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg
              aria-hidden
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="B08N5WRWNW · 027242923782 · &quot;air fryer&quot;"
              className="w-full bg-card border border-card-border pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="btn-gradient text-white font-medium px-6 py-2.5 text-sm shrink-0 disabled:opacity-50"
            disabled={!query.trim()}
          >
            Search
          </button>
        </div>
        <p className="text-text-dim text-xs mt-2">
          Try an ASIN like <code className="font-mono text-text-muted">B08N5WRWNW</code>{' '}
          to see Keepa charts and variations populate.
        </p>
      </form>

      {/* Quick actions / feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        <FeatureCard
          href="/dashboard/batch"
          accent="#3b82f6"
          title="Batch processing"
          blurb="Upload a CSV or photo dump and analyze hundreds of products at once."
          cta="Start a batch"
        />
        <FeatureCard
          href="/dashboard/result?q=B08N5WRWNW"
          accent="#d9534f"
          title="Keepa charts"
          blurb="Price-history, BSR, offer count and variations on every result page."
          cta="See an example"
        />
        <FeatureCard
          href="/dashboard/integrations"
          accent="#10b981"
          title="Integrations"
          blurb="Plug in Rainforest, Anthropic, and Keepa keys — stored locally."
          cta="Manage keys"
        />
      </div>

      {/* Recent activity */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary">Recent</h2>
          <Link
            href="/dashboard/history"
            className="text-accent text-xs hover:underline"
          >
            View all history →
          </Link>
        </div>
        {recents.length === 0 ? (
          <div className="border border-card-border bg-card p-8 text-center text-text-dim text-xs">
            Your recent lookups will appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recents.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/result?q=${encodeURIComponent(r.asin)}`}
                className="group flex items-center gap-3 bg-card border border-card-border p-3 hover:border-accent transition-colors"
              >
                <div className="w-10 h-10 bg-surface border border-card-border flex items-center justify-center text-text-dim text-[10px] font-mono shrink-0">
                  {r.asin.slice(0, 4)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
                    {r.title}
                  </div>
                  <div className="text-[11px] text-text-dim flex items-center gap-2 mt-0.5">
                    <span className="font-mono">{r.asin}</span>
                    {r.category && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="truncate">{r.category}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-text-dim text-[11px] shrink-0">
                  {relativeTime(r.timestamp)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <div className="border-t border-divider pt-4 flex items-center justify-between text-xs text-text-dim">
        <Link href="/privacy" className="hover:underline">
          Privacy policy
        </Link>
        <span>v1.0.0</span>
      </div>
    </div>
  );
}

function FeatureCard({
  href,
  accent,
  title,
  blurb,
  cta,
}: {
  href: string;
  accent: string;
  title: string;
  blurb: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-card border border-card-border p-4 flex flex-col gap-2 hover:border-accent transition-colors"
    >
      <span
        className="w-6 h-6 rounded-full inline-flex items-center justify-center text-white text-xs font-bold"
        style={{ background: accent }}
        aria-hidden
      >
        →
      </span>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <p className="text-text-muted text-xs leading-snug flex-1">{blurb}</p>
      <span className="text-accent text-xs font-medium group-hover:underline mt-auto">
        {cta} →
      </span>
    </Link>
  );
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!t) return '';
  const diff = Date.now() - t;
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diff < min) return 'just now';
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
