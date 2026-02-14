'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/dashboard/result?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-xl font-bold text-text-primary mb-3">
        SourceTool - Sourcing Analysis Simplified
      </h1>
      <p className="text-text-muted text-sm mb-2">
        Welcome to SourceTool! Search for any product by ASIN, UPC, ISBN, or keyword to get
        instant sourcing analysis including profit calculations, BSR data, and marketplace insights.
      </p>
      <p className="text-text-dim text-xs mb-6">
        For best results use specific keywords, UPC code, ASIN or ISBN code.
      </p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter ASIN, UPC, ISBN, or keyword..."
          className="flex-1 bg-card border border-card-border px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
        />
        <button
          type="submit"
          className="btn-gradient text-white font-medium px-5 py-2 text-sm shrink-0"
        >
          Search
        </button>
      </form>

      <div className="space-y-2 text-sm text-text-muted mb-8">
        <p>
          You can now see Keepa charts on your search results page, switch it on in your{' '}
          <Link href="/dashboard/settings" className="text-accent hover:underline">
            SAS settings
          </Link>
          .
        </p>
        <p>
          View your{' '}
          <Link href="/dashboard/history" className="text-accent hover:underline">
            SAS History
          </Link>
          .
        </p>
        <p>
          To get the Mobile Apps or Chrome Extension visit the appropriate{' '}
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            App Store
          </a>
          .
        </p>
      </div>

      <div className="border-t border-divider pt-4 flex items-center justify-between text-xs text-text-dim">
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        <span>v1.0.0</span>
      </div>
    </div>
  );
}
