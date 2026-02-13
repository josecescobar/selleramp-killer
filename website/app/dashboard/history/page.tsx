'use client';

import { useState } from 'react';
import { useHistory, HistoryEntry } from '@/lib/history';

export default function HistoryPage() {
  const { entries, clearHistory } = useHistory();
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const filtered = search.trim()
    ? entries.filter(
        (e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.asin.toLowerCase().includes(search.toLowerCase()) ||
          (e.upc && e.upc.includes(search))
      )
    : entries;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary mb-1">History</h1>
          <p className="text-text-muted text-sm">
            All products you&apos;ve analyzed, including multiple lookups of the same ASIN.
          </p>
        </div>
        {entries.length > 0 && (
          <div>
            {showConfirmClear ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { clearHistory(); setShowConfirmClear(false); }}
                  className="text-white text-xs font-medium bg-red-500 px-3 py-1.5 hover:bg-red-600 transition-colors"
                >
                  Confirm Clear
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="text-text-dim text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="text-text-dim text-xs font-medium hover:text-text-muted transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Filter */}
      <div className="border border-card-border mb-6">
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className="w-full bg-surface px-4 py-2.5 flex items-center justify-between text-sm font-semibold text-text-primary border-b border-card-border"
        >
          <span>Filter</span>
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`}
          >
            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {filterOpen && (
          <div className="bg-card p-4 flex gap-2 items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history by title, ASIN, or UPC..."
              className="flex-1 bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors"
            />
            <button className="border border-card-border px-3 py-1.5 text-sm text-text-dim hover:text-accent transition-colors">
              &#9733;
            </button>
            <button className="btn-gradient text-white text-sm font-medium px-4 py-1.5">
              Search
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-text-dim text-xs mb-2">
        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* History list */}
      {filtered.length === 0 ? (
        <div className="border border-card-border p-10 text-center bg-card">
          <p className="text-text-dim text-sm">
            {search ? 'No products match your search.' : 'No products analyzed yet.'}
          </p>
        </div>
      ) : (
        <div>
          {filtered.map((entry, i) => (
            <HistoryRow key={entry.id} entry={entry} even={i % 2 === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryRow({ entry, even }: { entry: HistoryEntry; even: boolean }) {
  return (
    <div className={`flex items-center gap-4 px-4 py-3 ${even ? 'bg-card' : 'bg-surface'}`}>
      {/* Thumbnail placeholder */}
      <div className="w-[60px] h-[60px] bg-surface border border-card-border flex items-center justify-center text-text-dim text-xs shrink-0">
        IMG
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="text-text-primary text-sm font-bold truncate">{entry.title}</div>
        <div className="text-text-dim text-xs flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
          <span>ASIN: {entry.asin}</span>
          {entry.upc && <span>UPC: {entry.upc}</span>}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-text-dim text-xs text-right shrink-0">
        {new Date(entry.timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
        <br />
        {new Date(entry.timestamp).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })}
      </div>

      {/* External link icon */}
      <a
        href={`https://amazon.com/dp/${entry.asin}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-text-dim hover:text-accent transition-colors shrink-0"
        title="View on Amazon"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M11 7.5V11.5C11 12.05 10.55 12.5 10 12.5H2.5C1.95 12.5 1.5 12.05 1.5 11.5V4C1.5 3.45 1.95 3 2.5 3H6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 1.5H12.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.5 8.5L12.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  );
}
