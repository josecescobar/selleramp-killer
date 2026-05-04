'use client';

import { useState, useEffect, useMemo, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CollapsiblePanel } from '@/components/dashboard/CollapsiblePanel';
import { generateMockResult, MockResult } from '@/lib/mock-data';
import { useHistory } from '@/lib/history';
import { fetchKeepaProduct, type KeepaProductResult } from '@shared/api/keepa';
import {
  PriceHistoryChart,
  buildKeepaSeries,
} from '@shared/components/PriceHistoryChart';
import { getKeepaKey } from '@/lib/batch-keys';

function ResultPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(q);
  const [copied, setCopied] = useState(false);
  const { addEntry } = useHistory();
  const [historyAdded, setHistoryAdded] = useState(false);

  const data = useMemo(() => (q ? generateMockResult(q) : null), [q]);

  // Add to history on mount if it looks like an ASIN
  useEffect(() => {
    if (!data || historyAdded) return;
    const isAsin = /^B0[A-Z0-9]{8}$/i.test(q);
    if (isAsin) {
      addEntry({ title: data.product.title, asin: data.product.asin, upc: data.product.upc, category: data.product.category });
      setHistoryAdded(true);
    }
  }, [q, data, addEntry, historyAdded]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    router.push(`/dashboard/result?q=${encodeURIComponent(searchInput.trim())}`);
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-text-dim text-sm">
        No query provided. Use the search bar to look up a product.
      </div>
    );
  }

  return (
    <div className="px-3 py-3">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 mb-3">
        <label className="text-sm font-semibold text-text-primary shrink-0">Search:</label>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
        />
        <button type="submit" className="p-1.5 text-text-dim hover:text-accent transition-colors" title="Search" aria-label="Search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
        <button
          type="button"
          className="relative p-1.5 text-text-dim hover:text-accent transition-colors"
          title="Copy ASIN"
          aria-label="Copy ASIN"
          onClick={() => { navigator.clipboard?.writeText(data.product.asin); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied && <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-accent font-medium whitespace-nowrap">Copied!</span>}
        </button>
      </form>

      {/* Icon toolbar */}
      <div className="flex items-center gap-2 mb-3">
        {[
          { color: '#337ab7', label: 'Product' },
          { color: '#5cb85c', label: 'Quick Info' },
          { color: '#f0ad4e', label: 'Alerts' },
          { color: '#5bc0de', label: 'Offers' },
          { color: '#d9534f', label: 'Charts' },
          { color: '#8b5cf6', label: 'Profit' },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1 text-xs text-text-dim">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left column */}
        <div className="col-span-full lg:col-span-3 space-y-3">
          <ProductCard product={data.product} />
          <QuickInfoPanel quickInfo={data.quickInfo} />
          <AlertsPanel alerts={data.alerts} />
        </div>

        {/* Center column */}
        <div className="col-span-full lg:col-span-6 space-y-3">
          <OffersPanel offers={data.offers} />
          <ChartsPanel asin={data.product.asin} />
        </div>

        {/* Right column */}
        <div className="col-span-full lg:col-span-3 space-y-3">
          <ProfitCalculator initialCalc={data.profitCalc} />
          <LookupDetails asin={data.product.asin} />
          <Discounts />
          <SellerCentral />
          <GoogleSheets />
          <NotesAndTags />
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-text-dim text-sm">Loading...</div>}>
      <ResultPageContent />
    </Suspense>
  );
}

/* ─── Product Card ─── */

function ProductCard({ product }: { product: MockResult['product'] }) {
  const [copiedProduct, setCopiedProduct] = useState(false);
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(product.rating));
  return (
    <CollapsiblePanel
      title="Product"
      icon={<span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#337ab7' }} />}
    >
      {/* Image placeholder */}
      <div className="w-full aspect-square bg-surface border border-card-border flex items-center justify-center text-text-dim text-xs mb-3">
        No Image
      </div>
      <div className="text-text-primary text-sm font-bold leading-tight mb-2">{product.title}</div>
      <div className="space-y-1 text-xs text-text-muted">
        <div className="flex justify-between">
          <span className="text-text-dim">Brand</span>
          <span className="text-text-primary">{product.brand}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-dim">Category</span>
          <span className="text-text-primary truncate ml-2">{product.category}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-dim">ASIN</span>
          <span className="text-text-primary font-mono">{product.asin}</span>
        </div>
        {product.upc && (
          <div className="flex justify-between">
            <span className="text-text-dim">UPC</span>
            <span className="text-text-primary font-mono">{product.upc}</span>
          </div>
        )}
      </div>
      {/* Rating */}
      <div className="flex items-center gap-1 mt-2">
        {stars.map((filled, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
        <span className="text-xs text-text-dim ml-1">({product.reviewCount.toLocaleString()})</span>
      </div>
      {/* Action icons */}
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-card-border">
        <a
          href={`https://amazon.com/dp/${product.asin}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-dim hover:text-accent transition-colors"
          title="View on Amazon"
          aria-label="View on Amazon"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11 7.5V11.5C11 12.05 10.55 12.5 10 12.5H2.5C1.95 12.5 1.5 12.05 1.5 11.5V4C1.5 3.45 1.95 3 2.5 3H6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 1.5H12.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.5 8.5L12.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <button className="relative text-text-dim hover:text-accent transition-colors" title="Copy ASIN" aria-label="Copy ASIN" onClick={() => { navigator.clipboard?.writeText(product.asin); setCopiedProduct(true); setTimeout(() => setCopiedProduct(false), 1500); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copiedProduct && <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-accent font-medium whitespace-nowrap">Copied!</span>}
        </button>
      </div>
    </CollapsiblePanel>
  );
}

/* ─── Quick Info Panel ─── */

function QuickInfoPanel({ quickInfo }: { quickInfo: MockResult['quickInfo'] }) {
  return (
    <CollapsiblePanel
      title="Quick Info"
      icon={<span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#5cb85c' }} />}
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <InfoRow label="Eligible" value={quickInfo.eligible ? 'Yes' : 'No'} color={quickInfo.eligible ? '#5cb85c' : '#d9534f'} />
        <InfoRow label="Alerts" value={String(quickInfo.alertCount)} color={quickInfo.alertCount > 0 ? '#f0ad4e' : '#5cb85c'} />
        <InfoRow label="BSR" value={`${quickInfo.bsr.rank.toLocaleString()} (${quickInfo.bsr.percentage}%)`} />
        <InfoRow label="Est. Sales" value={`${quickInfo.estSales}/mo`} />
        <InfoRow label="Max Cost" value={`$${quickInfo.maxCost.toFixed(2)}`} />
        <InfoRow label="Cost Price" value={`$${quickInfo.costPrice.toFixed(2)}`} />
        <InfoRow label="Sale Price" value={`$${quickInfo.salePrice.toFixed(2)}`} />
        <InfoRow label="Profit" value={`$${quickInfo.profit.toFixed(2)}`} color={quickInfo.profit > 0 ? '#5cb85c' : '#d9534f'} />
        <InfoRow label="ROI" value={`${quickInfo.roi}%`} color={quickInfo.roi > 0 ? '#5cb85c' : '#d9534f'} />
      </div>
    </CollapsiblePanel>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-text-dim">{label}</span>
      <span className="font-semibold" style={color ? { color } : undefined}>{value}</span>
    </div>
  );
}

/* ─── Alerts Panel ─── */

function AlertsPanel({ alerts }: { alerts: MockResult['alerts'] }) {
  const statusColors: Record<string, string> = {
    safe: '#5cb85c',
    warn: '#f0ad4e',
    danger: '#d9534f',
    neutral: '#999999',
  };
  const statusBg: Record<string, string> = {
    safe: 'rgba(92,184,92,0.1)',
    warn: 'rgba(240,173,78,0.1)',
    danger: 'rgba(217,83,79,0.1)',
    neutral: 'rgba(153,153,153,0.1)',
  };

  return (
    <CollapsiblePanel
      title="Alerts"
      icon={<span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#f0ad4e' }} />}
    >
      <div className="space-y-1.5">
        {alerts.map((alert) => (
          <div key={alert.label} className="flex justify-between items-center text-xs">
            <span className="text-text-dim">{alert.label}</span>
            <span
              className="px-2 py-0.5 rounded text-[11px] font-medium"
              style={{ backgroundColor: statusBg[alert.status], color: statusColors[alert.status] }}
            >
              {alert.value}
            </span>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  );
}

/* ─── Offers Panel ─── */

function OffersPanel({ offers }: { offers: MockResult['offers'] }) {
  const [tab, setTab] = useState<'live' | 'all'>('live');
  const [showAll, setShowAll] = useState(false);

  const displayOffers = showAll ? offers : offers.slice(0, 5);

  const fulfillmentBadge: Record<string, { bg: string; text: string }> = {
    FBA: { bg: '#e8f5e9', text: '#2e7d32' },
    SFP: { bg: '#fff3e0', text: '#e65100' },
    FBM: { bg: '#e3f2fd', text: '#1565c0' },
  };

  return (
    <CollapsiblePanel
      title="Offers"
      icon={<span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#5bc0de' }} />}
    >
      {/* Tabs */}
      <div className="flex gap-0 mb-3 border-b border-card-border">
        <button
          onClick={() => setTab('live')}
          className={`px-4 py-1.5 text-xs font-semibold border-b-2 transition-colors ${tab === 'live' ? 'border-accent text-accent' : 'border-transparent text-text-dim hover:text-text-muted'}`}
        >
          Live Offers
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-1.5 text-xs font-semibold border-b-2 transition-colors ${tab === 'all' ? 'border-accent text-accent' : 'border-transparent text-text-dim hover:text-text-muted'}`}
        >
          All Offers
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-card-border text-text-dim">
              <th className="text-left py-1.5 pr-2 font-medium">#</th>
              <th className="text-left py-1.5 pr-2 font-medium">Seller</th>
              <th className="text-left py-1.5 pr-2 font-medium">Type</th>
              <th className="text-right py-1.5 pr-2 font-medium">Stock</th>
              <th className="text-right py-1.5 pr-2 font-medium">Price</th>
              <th className="text-right py-1.5 pr-2 font-medium">Profit</th>
              <th className="text-right py-1.5 font-medium">ROI</th>
            </tr>
          </thead>
          <tbody>
            {displayOffers.map((offer, i) => {
              const badge = fulfillmentBadge[offer.fulfillment];
              return (
                <tr key={offer.id} className={`border-b border-card-border ${i % 2 === 0 ? '' : 'bg-surface'}`}>
                  <td className="py-1.5 pr-2 text-text-dim">{i + 1}</td>
                  <td className="py-1.5 pr-2 text-text-primary font-medium max-w-[140px] truncate">{offer.seller}</td>
                  <td className="py-1.5 pr-2">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {offer.fulfillment}
                    </span>
                  </td>
                  <td className="py-1.5 pr-2 text-right text-text-muted">{offer.stock}</td>
                  <td className="py-1.5 pr-2 text-right text-text-primary">${offer.price.toFixed(2)}</td>
                  <td className="py-1.5 pr-2 text-right" style={{ color: offer.profit > 0 ? '#5cb85c' : '#d9534f' }}>
                    ${offer.profit.toFixed(2)}
                  </td>
                  <td className="py-1.5 text-right" style={{ color: offer.roi > 0 ? '#5cb85c' : '#d9534f' }}>
                    {offer.roi}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!showAll && offers.length > 5 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-2 py-1.5 text-xs text-accent hover:underline"
        >
          Load More ({offers.length - 5} remaining)
        </button>
      )}
    </CollapsiblePanel>
  );
}

/* ─── Charts Panel ─── */

const ASIN_RE = /^B0[A-Z0-9]{8}$/i;
const WINDOW_OPTIONS: { label: string; days: number | null }[] = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'ALL', days: null },
];

function ChartsPanel({ asin }: { asin: string }) {
  const [keepa, setKeepa] = useState<KeepaProductResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [windowDays, setWindowDays] = useState<number | null>(90);

  const isRealAsin = ASIN_RE.test(asin);

  useEffect(() => {
    if (!isRealAsin) return;
    const apiKey = getKeepaKey();
    if (!apiKey) {
      setHasKey(false);
      return;
    }
    setHasKey(true);
    setLoading(true);
    setError(null);
    fetchKeepaProduct({ apiKey, asin })
      .then((data) => setKeepa(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err)),
      )
      .finally(() => setLoading(false));
  }, [asin, isRealAsin]);

  const series = useMemo(
    () =>
      keepa
        ? buildKeepaSeries({
            amazon: keepa.series.amazon,
            newPrice: keepa.series.newPrice,
            buyBox: keepa.series.buyBox,
            salesRank: keepa.series.salesRank,
            offerCountNew: keepa.series.offerCountNew,
          })
        : [],
    [keepa],
  );

  return (
    <CollapsiblePanel
      title="Charts"
      icon={<span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#d9534f' }} />}
    >
      {/* Range selector */}
      <div className="flex gap-1 mb-3">
        {WINDOW_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => setWindowDays(opt.days)}
            className={`flex-1 text-xs py-1 border ${windowDays === opt.days ? 'bg-accent text-white border-accent' : 'border-card-border text-text-muted hover:text-accent'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {!isRealAsin && (
        <div className="w-full h-32 bg-surface border border-card-border flex items-center justify-center text-text-dim text-xs">
          Search a real ASIN to load Keepa data.
        </div>
      )}

      {isRealAsin && hasKey === false && (
        <div className="w-full p-4 bg-surface border border-card-border text-text-dim text-xs">
          Add a Keepa API key in{' '}
          <a href="/dashboard/integrations" className="text-accent hover:underline">
            Integrations
          </a>{' '}
          to load real price history.
        </div>
      )}

      {isRealAsin && hasKey && loading && (
        <div className="w-full h-32 bg-surface border border-card-border flex items-center justify-center text-text-dim text-xs">
          Loading Keepa history...
        </div>
      )}

      {isRealAsin && hasKey && error && !loading && (
        <div className="w-full p-3 bg-surface border border-card-border text-red-500 text-xs">
          {error}
        </div>
      )}

      {isRealAsin && hasKey && keepa && !loading && (
        <>
          <PriceHistoryChart
            series={series}
            windowDays={windowDays}
            width={520}
            height={240}
            axisColor="#e5e7eb"
            textColor="#111827"
            textColorDim="#9ca3af"
            emptyMessage="No history points in this window."
          />
          {keepa.tokensLeft !== undefined && (
            <div className="mt-2 text-[10px] text-text-dim text-right">
              Keepa tokens left: {keepa.tokensLeft}
            </div>
          )}
        </>
      )}
    </CollapsiblePanel>
  );
}

/* ─── Profit Calculator ─── */

function ProfitCalculator({ initialCalc }: { initialCalc: MockResult['profitCalc'] }) {
  const [costPrice, setCostPrice] = useState(initialCalc.costPrice);
  const [salePrice, setSalePrice] = useState(initialCalc.salePrice);
  const [fulfillment, setFulfillment] = useState<'FBA' | 'FBM'>('FBA');
  const [storageMonths, setStorageMonths] = useState(1);

  const feeRate = fulfillment === 'FBA' ? 0.32 : 0.18;
  const storageFee = fulfillment === 'FBA' ? storageMonths * 0.87 : 0;
  const totalFees = Math.round((salePrice * feeRate + storageFee) * 100) / 100;
  const profit = Math.round((salePrice - costPrice - totalFees) * 100) / 100;
  const roi = costPrice > 0 ? Math.round((profit / costPrice) * 100) : 0;
  const maxCost = Math.round((salePrice - totalFees) * 100) / 100;
  const profitMargin = salePrice > 0 ? Math.round((profit / salePrice) * 100) : 0;
  const breakevenPrice = Math.round((costPrice + totalFees) * 100) / 100;
  const estPayout = Math.round((salePrice - totalFees) * 100) / 100;

  return (
    <CollapsiblePanel
      title="Profit Calculator"
      icon={<span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#8b5cf6' }} />}
    >
      {/* FBA/FBM toggle */}
      <div className="flex gap-0 mb-3">
        <button
          onClick={() => setFulfillment('FBA')}
          className={`flex-1 py-1.5 text-xs font-semibold border transition-colors ${fulfillment === 'FBA' ? 'bg-accent text-white border-accent' : 'bg-card border-card-border text-text-dim hover:text-text-muted'}`}
        >
          FBA
        </button>
        <button
          onClick={() => setFulfillment('FBM')}
          className={`flex-1 py-1.5 text-xs font-semibold border border-l-0 transition-colors ${fulfillment === 'FBM' ? 'bg-accent text-white border-accent' : 'bg-card border-card-border text-text-dim hover:text-text-muted'}`}
        >
          FBM
        </button>
      </div>

      {/* Editable inputs */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs">
          <label className="text-text-dim">Cost Price</label>
          <div className="flex items-center gap-1">
            <span className="text-text-dim">$</span>
            <input
              type="number"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(Number(e.target.value))}
              className="w-20 bg-card border border-card-border px-2 py-1 text-xs text-text-primary text-right focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <label className="text-text-dim">Sale Price</label>
          <div className="flex items-center gap-1">
            <span className="text-text-dim">$</span>
            <input
              type="number"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(Number(e.target.value))}
              className="w-20 bg-card border border-card-border px-2 py-1 text-xs text-text-primary text-right focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
            />
          </div>
        </div>
        {fulfillment === 'FBA' && (
          <div className="flex items-center justify-between text-xs">
            <label className="text-text-dim">Storage Months</label>
            <input
              type="number"
              min="1"
              max="12"
              value={storageMonths}
              onChange={(e) => setStorageMonths(Math.max(1, Math.min(12, Number(e.target.value))))}
              className="w-20 bg-card border border-card-border px-2 py-1 text-xs text-text-primary text-right focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
            />
          </div>
        )}
      </div>

      {/* Calculated rows */}
      <div className="space-y-1.5 border-t border-card-border pt-2">
        <CalcRow label="Profit" value={`$${profit.toFixed(2)}`} color={profit > 0 ? '#5cb85c' : '#d9534f'} expandable />
        <CalcRow label="ROI" value={`${roi}%`} color={roi > 0 ? '#5cb85c' : '#d9534f'} />
        <CalcRow label="Max Cost" value={`$${maxCost.toFixed(2)}`} expandable />
        <CalcRow label="Total Fees" value={`$${totalFees.toFixed(2)}`} expandable />
        <CalcRow label="Discount" value="$0.00" />
        <CalcRow label="Profit Margin" value={`${profitMargin}%`} />
        <CalcRow label="Breakeven" value={`$${breakevenPrice.toFixed(2)}`} />
        <CalcRow label="Est. Amz Payout" value={`$${estPayout.toFixed(2)}`} expandable />
        <CalcRow label="Quantity" value="1" />
      </div>
    </CollapsiblePanel>
  );
}

function CalcRow({ label, value, color, expandable }: { label: string; value: string; color?: string; expandable?: boolean }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-text-dim flex items-center gap-1">
        {label}
        {expandable && (
          <svg width="8" height="5" viewBox="0 0 8 5" fill="none" className="text-text-dim">
            <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="font-semibold" style={color ? { color } : undefined}>{value}</span>
    </div>
  );
}

/* ─── Lookup Details ─── */

function LookupDetails({ asin }: { asin: string }) {
  return (
    <CollapsiblePanel title="Lookup Details" defaultOpen={false}>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <label className="text-text-dim shrink-0">Source</label>
          <input
            type="text"
            defaultValue={`https://amazon.com/dp/${asin}`}
            className="flex-1 bg-card border border-card-border px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex-1 text-xs border border-card-border px-2 py-1.5 text-text-dim hover:text-accent hover:border-accent hover:bg-surface transition-colors">
            Open Source
          </button>
          <button className="flex-1 text-xs border border-card-border px-2 py-1.5 text-text-dim hover:text-accent hover:border-accent hover:bg-surface transition-colors">
            Google It
          </button>
        </div>
      </div>
    </CollapsiblePanel>
  );
}

/* ─── Discounts ─── */

function Discounts() {
  const discounts = ['5%', '10%', '15%', '20%', '25%', '30%', '50%', '3for2'];
  return (
    <CollapsiblePanel title="Discounts" defaultOpen={false}>
      <div className="grid grid-cols-4 gap-1.5">
        {discounts.map((d) => (
          <button
            key={d}
            className="text-xs border border-card-border px-1 py-1.5 text-text-dim hover:text-accent hover:border-accent hover:bg-surface transition-colors text-center"
          >
            {d}
          </button>
        ))}
      </div>
    </CollapsiblePanel>
  );
}

/* ─── Seller Central ─── */

function SellerCentral() {
  const actions = ['Home', 'Add Product', 'Inventory', 'Orders'];
  return (
    <CollapsiblePanel title="Seller Central" defaultOpen={false}>
      <div className="grid grid-cols-2 gap-1.5">
        {actions.map((a) => (
          <button
            key={a}
            className="text-xs border border-card-border px-2 py-1.5 text-text-dim hover:text-accent hover:border-accent hover:bg-surface transition-colors text-center"
          >
            {a}
          </button>
        ))}
      </div>
    </CollapsiblePanel>
  );
}

/* ─── Google Sheets ─── */

function GoogleSheets() {
  return (
    <CollapsiblePanel title="Google Sheets" defaultOpen={false}>
      <p className="text-xs text-text-dim">Connect your Google Sheets account to export product data directly.</p>
      <button className="mt-2 w-full text-xs border border-card-border px-2 py-1.5 text-text-dim hover:text-accent hover:border-accent hover:bg-surface transition-colors">
        Connect Sheets
      </button>
    </CollapsiblePanel>
  );
}

/* ─── Notes and Tags ─── */

function NotesAndTags() {
  return (
    <CollapsiblePanel title="Notes & Tags" defaultOpen={false}>
      <div className="flex gap-2">
        <button className="flex-1 text-xs border border-card-border px-2 py-1.5 text-text-dim hover:text-accent hover:border-accent hover:bg-surface transition-colors flex items-center justify-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Star
        </button>
        <button className="flex-1 text-xs border border-card-border px-2 py-1.5 text-text-dim hover:text-accent hover:border-accent hover:bg-surface transition-colors flex items-center justify-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Note
        </button>
      </div>
    </CollapsiblePanel>
  );
}
