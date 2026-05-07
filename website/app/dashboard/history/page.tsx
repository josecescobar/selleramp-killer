'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useHistory, HistoryEntry } from '@/lib/history';

type SortKey = 'recent' | 'oldest' | 'title';

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: '#3b82f6',
  'Home & Kitchen': '#f59e0b',
  'Kitchen & Dining': '#f59e0b',
  'Toys & Games': '#ec4899',
  'Clothing, Shoes & Jewelry': '#8b5cf6',
};

export default function HistoryPage() {
  const { entries, clearHistory } = useHistory();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [category, setCategory] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) if (e.category) set.add(e.category);
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let out = entries;
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.asin.toLowerCase().includes(q) ||
          (e.upc && e.upc.includes(search)),
      );
    }
    if (category) out = out.filter((e) => e.category === category);
    out = [...out].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return sort === 'recent' ? tb - ta : ta - tb;
    });
    return out;
  }, [entries, search, category, sort]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-text-primary mb-1">History</h1>
          <p className="text-text-muted text-sm">
            Every product you&apos;ve looked up, with quick re-analyze links.
          </p>
        </div>
        {entries.length > 0 && (
          <div className="shrink-0">
            {showConfirmClear ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    clearHistory();
                    setShowConfirmClear(false);
                  }}
                  className="text-white text-xs font-medium bg-rose-500 px-3 py-1.5 hover:bg-rose-600 transition-colors"
                >
                  Confirm clear
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="text-text-dim text-xs px-2 py-1.5 hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="text-text-dim text-xs font-medium hover:text-rose-500 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toolbar: search + sort */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, ASIN, or UPC"
            className="w-full bg-card border border-card-border pl-8 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="bg-card border border-card-border px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
          aria-label="Sort"
        >
          <option value="recent">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="title">A → Z</option>
        </select>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setCategory(null)}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              category === null
                ? 'bg-accent text-white border-accent'
                : 'border-card-border text-text-muted hover:text-text-primary'
            }`}
          >
            All ({entries.length})
          </button>
          {categories.map((c) => {
            const active = c === category;
            const count = entries.filter((e) => e.category === c).length;
            const dot = CATEGORY_COLORS[c] ?? '#9ca3af';
            return (
              <button
                key={c}
                onClick={() => setCategory(active ? null : c)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'bg-accent text-white border-accent'
                    : 'border-card-border text-text-muted hover:text-text-primary'
                }`}
              >
                <span
                  aria-hidden
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: active ? '#ffffff' : dot }}
                />
                {c} <span className="text-text-dim">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      <div className="text-text-dim text-xs mb-2">
        {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        {search && (
          <button
            onClick={() => setSearch('')}
            className="ml-2 text-accent hover:underline"
          >
            clear search
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-card-border p-10 text-center bg-card">
          <p className="text-text-dim text-sm">
            {search || category
              ? 'No products match these filters.'
              : 'No products analyzed yet — try the dashboard search.'}
          </p>
        </div>
      ) : (
        <div className="border border-card-border bg-card divide-y divide-card-border">
          {filtered.map((entry) => (
            <HistoryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const dot =
    (entry.category && CATEGORY_COLORS[entry.category]) ?? '#9ca3af';
  return (
    <div className="group flex items-center gap-4 px-3 py-2.5 hover:bg-accent-glow transition-colors">
      <Link
        href={`/dashboard/result?q=${encodeURIComponent(entry.asin)}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        {/* Thumbnail tile — first 4 chars of ASIN as identity */}
        <div
          className="w-12 h-12 flex flex-col items-center justify-center shrink-0 text-white text-[10px] font-mono font-semibold"
          style={{ background: dot }}
          aria-hidden
        >
          {entry.asin.slice(0, 4)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-text-primary text-sm font-semibold truncate group-hover:text-accent transition-colors">
            {entry.title}
          </div>
          <div className="text-text-dim text-[11px] flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
            <span className="font-mono">{entry.asin}</span>
            {entry.upc && <span className="font-mono">UPC {entry.upc}</span>}
            {entry.category && (
              <span className="inline-flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: dot }}
                />
                {entry.category}
              </span>
            )}
          </div>
        </div>

        <div className="text-text-dim text-[11px] text-right shrink-0 hidden sm:block">
          <div className="font-medium text-text-muted">
            {relativeTime(entry.timestamp)}
          </div>
          <div>
            {new Date(entry.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={`/dashboard/result?q=${encodeURIComponent(entry.asin)}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium text-accent border border-accent px-2 py-0.5 hover:bg-accent hover:text-white"
        >
          View
        </Link>
        <a
          href={`https://amazon.com/dp/${entry.asin}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-dim hover:text-accent transition-colors p-1"
          title="View on Amazon"
          onClick={(e) => e.stopPropagation()}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M11 7.5V11.5C11 12.05 10.55 12.5 10 12.5H2.5C1.95 12.5 1.5 12.05 1.5 11.5V4C1.5 3.45 1.95 3 2.5 3H6.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 1.5H12.5V5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5.5 8.5L12.5 1.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </div>
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
    year: 'numeric',
  });
}
