'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useHistory, HistoryEntry } from '@/lib/history';

export default function DashboardPage() {
  const { user } = useAuth();
  const { entries } = useHistory();
  const [query, setQuery] = useState('');

  const recent = entries.slice(0, 5);
  const stats = {
    total: entries.length,
    today: entries.filter(
      (e) => new Date(e.timestamp).toDateString() === new Date().toDateString()
    ).length,
  };

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    // TODO: wire up real product lookup
    alert(`Search for: ${query}\n\nProduct analysis will be available when connected to the extension API.`);
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">
          Welcome back, <span className="gradient-text">{user?.name}</span>
        </h1>
        <p className="text-text-muted text-sm">
          Search for a product to get started with your analysis.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-10">
        <label className="block text-text-muted text-xs font-medium mb-2">
          Search Products
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter ASIN, UPC, ISBN, or keyword..."
            className="flex-1 bg-card border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            className="btn-gradient text-white font-semibold px-6 py-3 rounded-xl text-sm shrink-0"
          >
            Search
          </button>
        </div>
        <p className="text-text-dim text-xs mt-2">
          For best results use specific keywords, UPC code, ASIN or ISBN code.
        </p>
      </form>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Products Analyzed" value={String(stats.total)} />
        <StatCard label="Analyzed Today" value={String(stats.today)} />
        <StatCard label="Extension Status" value="Active" accent />
      </div>

      {/* Recent History */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">Recent Lookups</h2>
          {entries.length > 0 && (
            <Link
              href="/dashboard/history"
              className="text-accent text-sm font-medium hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="bg-card border border-card-border rounded-xl p-10 text-center">
            <p className="text-text-dim text-sm mb-1">No products analyzed yet.</p>
            <p className="text-text-dim text-xs">
              Use the search bar above or browse Amazon with the extension installed.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickLink
          title="Install Extension"
          description="Get SourceTool on Chrome to analyze products while you browse."
          href="https://chrome.google.com/webstore"
          external
          cta="Install on Chrome"
        />
        <QuickLink
          title="Configure Settings"
          description="Set your marketplace, fulfillment type, buying criteria, and costs."
          href="/dashboard/settings"
          cta="Open Settings"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className={`text-2xl font-bold mb-1 ${accent ? 'text-accent' : 'text-text-primary'}`}>
        {value}
      </div>
      <div className="text-text-muted text-sm">{label}</div>
    </div>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  return (
    <div className="bg-card border border-card-border rounded-xl px-5 py-4 flex items-center gap-4">
      <div className="w-12 h-12 bg-bg rounded-lg flex items-center justify-center text-text-dim text-xs shrink-0">
        IMG
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-text-primary text-sm font-medium truncate">{entry.title}</div>
        <div className="text-text-dim text-xs flex items-center gap-3 mt-0.5">
          <span>ASIN: {entry.asin}</span>
          {entry.upc && <span>UPC: {entry.upc}</span>}
        </div>
      </div>
      <div className="text-text-dim text-xs shrink-0">
        {new Date(entry.timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
}

function QuickLink({
  title,
  description,
  href,
  cta,
  external,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  external?: boolean;
}) {
  const Tag = external ? 'a' : Link;
  const extraProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <div className="bg-card border border-card-border rounded-xl p-6">
      <h3 className="text-text-primary font-semibold mb-2">{title}</h3>
      <p className="text-text-muted text-sm mb-4">{description}</p>
      <Tag
        href={href}
        {...extraProps}
        className="btn-gradient inline-flex text-white text-sm font-semibold px-5 py-2 rounded-lg"
      >
        {cta}
      </Tag>
    </div>
  );
}
