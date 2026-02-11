'use client';

import { useState } from 'react';
import { useHistory, HistoryEntry } from '@/lib/history';

export default function HistoryPage() {
  const { entries, clearHistory, removeEntry } = useHistory();
  const [search, setSearch] = useState('');
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
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">History</h1>
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
                  className="text-red-400 text-xs font-medium bg-red-400/10 px-3 py-1.5 rounded-lg hover:bg-red-400/20 transition-colors"
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

      {/* Filter bar */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search history by title, ASIN, or UPC..."
          className="flex-1 bg-card border border-card-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors"
        />
        <div className="text-text-dim text-xs flex items-center shrink-0 px-2">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* History list */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-10 text-center">
          <p className="text-text-dim text-sm">
            {search ? 'No products match your search.' : 'No products analyzed yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((entry) => (
            <HistoryRow key={entry.id} entry={entry} onRemove={removeEntry} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryRow({
  entry,
  onRemove,
}: {
  entry: HistoryEntry;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl px-5 py-4 flex items-center gap-4 group">
      {/* Image placeholder */}
      <div className="w-14 h-14 bg-bg rounded-lg flex items-center justify-center text-text-dim text-xs shrink-0">
        IMG
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="text-text-primary text-sm font-medium truncate">{entry.title}</div>
        <div className="text-text-dim text-xs flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
          <span>ASIN: {entry.asin}</span>
          {entry.upc && <span>UPC: {entry.upc}</span>}
          {entry.category && (
            <span className="text-text-dim">{entry.category}</span>
          )}
        </div>
      </div>

      {/* Timestamp + actions */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-text-dim text-xs text-right">
          {new Date(entry.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
          <br />
          <span className="text-text-dim/60">
            {new Date(entry.timestamp).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        </div>
        <button
          onClick={() => onRemove(entry.id)}
          className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-red-400 text-sm transition-all"
          title="Remove"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
