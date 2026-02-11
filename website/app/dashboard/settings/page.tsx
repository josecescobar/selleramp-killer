'use client';

import { useState } from 'react';
import { useSettings } from '@/lib/settings';

type Tab = 'general' | 'display' | 'panels';

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [tab, setTab] = useState<Tab>('general');
  const [saved, setSaved] = useState(false);

  function showSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'display', label: 'Display' },
    { key: 'panels', label: 'Panels' },
  ];

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">Settings</h1>
          <p className="text-text-muted text-sm">
            Configure your sourcing preferences and analysis defaults.
          </p>
        </div>
        <button
          onClick={() => { resetSettings(); showSaved(); }}
          className="text-text-dim text-xs font-medium border border-card-border px-3 py-1.5 rounded-lg hover:border-red-400 hover:text-red-400 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 mb-8 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-accent text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Save indicator */}
      {saved && (
        <div className="mb-4 text-accent text-sm font-medium animate-fade-in-up">
          Settings saved.
        </div>
      )}

      {tab === 'general' && (
        <div className="flex flex-col gap-8">
          {/* Amazon Specific */}
          <SettingsGroup title="Amazon Specific">
            <SettingsRow label="Home Marketplace">
              <select
                value={settings.marketplace}
                onChange={(e) => { updateSettings({ marketplace: e.target.value }); showSaved(); }}
                className="bg-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary w-48"
              >
                <option value="amazon.com">amazon.com</option>
                <option value="amazon.co.uk">amazon.co.uk</option>
                <option value="amazon.ca">amazon.ca</option>
                <option value="amazon.de">amazon.de</option>
                <option value="amazon.fr">amazon.fr</option>
                <option value="amazon.it">amazon.it</option>
                <option value="amazon.es">amazon.es</option>
              </select>
            </SettingsRow>
            <SettingsRow label="Inbound FBA Shipping">
              <div className="flex items-center gap-1">
                <span className="text-text-dim text-sm">$</span>
                <input
                  type="text"
                  value={settings.inboundFbaShipping}
                  onChange={(e) => { updateSettings({ inboundFbaShipping: e.target.value }); showSaved(); }}
                  className="bg-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary w-20 text-right"
                />
                <span className="text-text-dim text-sm">/ pound</span>
              </div>
            </SettingsRow>
            <SettingsRow label="Inbound Placement">
              <select
                value={settings.inboundPlacement}
                onChange={(e) => { updateSettings({ inboundPlacement: e.target.value }); showSaved(); }}
                className="bg-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary w-48"
              >
                <option value="optimized">Amazon Optimized Splits</option>
                <option value="minimal">Minimal Shipment Splits</option>
                <option value="partial">Partial Inventory Placement</option>
              </select>
            </SettingsRow>
            <SettingsRow label="Use Peak Storage Fees">
              <Toggle
                checked={settings.usePeakStorageFees}
                onChange={(v) => { updateSettings({ usePeakStorageFees: v }); showSaved(); }}
              />
            </SettingsRow>
            <SettingsRow label="Storage Time">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={settings.storageMonths}
                  onChange={(e) => { updateSettings({ storageMonths: e.target.value }); showSaved(); }}
                  className="bg-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary w-16 text-right"
                />
                <span className="text-text-dim text-sm">months</span>
              </div>
            </SettingsRow>
            <SettingsRow label="Local Fulfillment">
              <div className="flex gap-0.5 bg-bg rounded-lg p-0.5 border border-card-border">
                {(['FBA', 'FBM'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => { updateSettings({ fulfillmentType: type }); showSaved(); }}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      settings.fulfillmentType === type
                        ? 'bg-accent text-white'
                        : 'text-text-muted'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </SettingsRow>
          </SettingsGroup>

          {/* Buying Criteria */}
          <SettingsGroup title="Buying Criteria">
            <SettingsRow label="Minimum BSR (%)">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={settings.minBsr}
                  onChange={(e) => { updateSettings({ minBsr: e.target.value }); showSaved(); }}
                  className="bg-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary w-16 text-right"
                />
                <span className="text-text-dim text-sm">%</span>
              </div>
            </SettingsRow>
            <SettingsRow label="Maximum BSR (%)">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={settings.maxBsr}
                  onChange={(e) => { updateSettings({ maxBsr: e.target.value }); showSaved(); }}
                  className="bg-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary w-16 text-right"
                />
                <span className="text-text-dim text-sm">%</span>
              </div>
            </SettingsRow>
            <SettingsRow label="Minimum Profit">
              <div className="flex items-center gap-1">
                <span className="text-text-dim text-sm">$</span>
                <input
                  type="text"
                  value={settings.minProfit}
                  onChange={(e) => { updateSettings({ minProfit: e.target.value }); showSaved(); }}
                  className="bg-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary w-20 text-right"
                />
              </div>
            </SettingsRow>
            <SettingsRow label="Minimum ROI">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={settings.minRoi}
                  onChange={(e) => { updateSettings({ minRoi: e.target.value }); showSaved(); }}
                  className="bg-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary w-16 text-right"
                />
                <span className="text-text-dim text-sm">%</span>
              </div>
            </SettingsRow>
          </SettingsGroup>

          {/* Additional Costs */}
          <SettingsGroup title="Additional Costs">
            <SettingsRow label="Prep Fee">
              <div className="flex items-center gap-1">
                <span className="text-text-dim text-sm">$</span>
                <input
                  type="text"
                  value={settings.prepFee}
                  onChange={(e) => { updateSettings({ prepFee: e.target.value }); showSaved(); }}
                  className="bg-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary w-20 text-right"
                />
              </div>
            </SettingsRow>
            <SettingsRow label="Misc Fee">
              <div className="flex items-center gap-1">
                <span className="text-text-dim text-sm">$</span>
                <input
                  type="text"
                  value={settings.miscFee}
                  onChange={(e) => { updateSettings({ miscFee: e.target.value }); showSaved(); }}
                  className="bg-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary w-20 text-right"
                />
              </div>
            </SettingsRow>
            <SettingsRow label="Misc Fee (%)">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={settings.miscFeePercent}
                  onChange={(e) => { updateSettings({ miscFeePercent: e.target.value }); showSaved(); }}
                  className="bg-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary w-16 text-right"
                />
                <span className="text-text-dim text-sm">%</span>
              </div>
            </SettingsRow>
          </SettingsGroup>
        </div>
      )}

      {tab === 'display' && (
        <div className="flex flex-col gap-8">
          <SettingsGroup title="Appearance">
            <SettingsRow label="Theme">
              <div className="flex gap-0.5 bg-bg rounded-lg p-0.5 border border-card-border">
                {(['dark', 'light'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { updateSettings({ theme: t }); showSaved(); }}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                      settings.theme === t
                        ? 'bg-accent text-white'
                        : 'text-text-muted'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </SettingsRow>
            <SettingsRow label="Compact Mode">
              <Toggle
                checked={settings.compactMode}
                onChange={(v) => { updateSettings({ compactMode: v }); showSaved(); }}
              />
            </SettingsRow>
          </SettingsGroup>
        </div>
      )}

      {tab === 'panels' && (
        <div className="flex flex-col gap-8">
          <SettingsGroup title="Visible Panels">
            <p className="text-text-dim text-xs mb-4">
              Choose which analysis panels appear when viewing a product.
            </p>
            {([
              { key: 'showQuickInfo' as const, label: 'Quick Info' },
              { key: 'showAlerts' as const, label: 'Alerts' },
              { key: 'showOffers' as const, label: 'Offers' },
              { key: 'showCharts' as const, label: 'Charts' },
              { key: 'showRanksPrices' as const, label: 'Ranks & Prices' },
              { key: 'showProfitCalc' as const, label: 'Profit Calculator' },
              { key: 'showNotesTags' as const, label: 'Notes & Tags' },
            ]).map((panel) => (
              <SettingsRow key={panel.key} label={panel.label}>
                <Toggle
                  checked={settings[panel.key]}
                  onChange={(v) => { updateSettings({ [panel.key]: v }); showSaved(); }}
                />
              </SettingsRow>
            ))}
          </SettingsGroup>
        </div>
      )}
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      <div className="bg-surface px-5 py-3 border-b border-card-border">
        <h3 className="text-text-primary text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-text-muted text-sm">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-card-border'
      }`}
      style={{ height: 22 }}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-[18px]' : ''
        }`}
        style={{ width: 18, height: 18 }}
      />
    </button>
  );
}
