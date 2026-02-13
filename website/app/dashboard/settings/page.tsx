'use client';

import { useState } from 'react';
import { useSettings } from '@/lib/settings';
import { Fieldset } from '@/components/dashboard/Fieldset';

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
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary mb-1">Settings</h1>
          <p className="text-text-muted text-sm">
            Configure your sourcing preferences and analysis defaults.
          </p>
        </div>
        <button
          onClick={() => { resetSettings(); showSaved(); }}
          className="text-white text-xs font-medium px-3 py-1.5 bg-red-500 hover:bg-red-600 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Underline tabs */}
      <div className="flex gap-0 border-b border-divider mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {saved && (
        <div className="mb-4 text-accent text-sm font-medium">Settings saved.</div>
      )}

      {tab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <Fieldset title="Amazon Specific">
              <div className="flex flex-col gap-4">
                <SettingsRow label="Home Marketplace">
                  <select
                    value={settings.marketplace}
                    onChange={(e) => { updateSettings({ marketplace: e.target.value }); showSaved(); }}
                    className="bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary w-48"
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
                      className="bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary w-20 text-right"
                    />
                    <span className="text-text-dim text-sm">/ pound</span>
                  </div>
                </SettingsRow>
                <SettingsRow label="Inbound Placement">
                  <select
                    value={settings.inboundPlacement}
                    onChange={(e) => { updateSettings({ inboundPlacement: e.target.value }); showSaved(); }}
                    className="bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary w-48"
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
                      className="bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary w-16 text-right"
                    />
                    <span className="text-text-dim text-sm">months</span>
                  </div>
                </SettingsRow>
                <SettingsRow label="Local Fulfillment">
                  <FbaFbmToggle
                    value={settings.fulfillmentType}
                    onChange={(v) => { updateSettings({ fulfillmentType: v }); showSaved(); }}
                  />
                </SettingsRow>
              </div>
            </Fieldset>

            <Fieldset title="VAT">
              <p className="text-text-dim text-sm">VAT settings coming soon.</p>
            </Fieldset>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            <Fieldset title="Buying Criteria">
              <div className="flex flex-col gap-4">
                <SettingsRow label="Minimum BSR (%)">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={settings.minBsr}
                      onChange={(e) => { updateSettings({ minBsr: e.target.value }); showSaved(); }}
                      className="bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary w-16 text-right"
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
                      className="bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary w-16 text-right"
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
                      className="bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary w-20 text-right"
                    />
                  </div>
                </SettingsRow>
                <SettingsRow label="Minimum ROI">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={settings.minRoi}
                      onChange={(e) => { updateSettings({ minRoi: e.target.value }); showSaved(); }}
                      className="bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary w-16 text-right"
                    />
                    <span className="text-text-dim text-sm">%</span>
                  </div>
                </SettingsRow>
              </div>
            </Fieldset>

            <Fieldset title="Additional Costs">
              <div className="flex flex-col gap-4">
                <SettingsRow label="Prep Fee">
                  <div className="flex items-center gap-1">
                    <span className="text-text-dim text-sm">$</span>
                    <input
                      type="text"
                      value={settings.prepFee}
                      onChange={(e) => { updateSettings({ prepFee: e.target.value }); showSaved(); }}
                      className="bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary w-20 text-right"
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
                      className="bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary w-20 text-right"
                    />
                  </div>
                </SettingsRow>
                <SettingsRow label="Misc Fee (%)">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={settings.miscFeePercent}
                      onChange={(e) => { updateSettings({ miscFeePercent: e.target.value }); showSaved(); }}
                      className="bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary w-16 text-right"
                    />
                    <span className="text-text-dim text-sm">%</span>
                  </div>
                </SettingsRow>
              </div>
            </Fieldset>

            <Fieldset title="Default Values">
              <p className="text-text-dim text-sm">Default value settings coming soon.</p>
            </Fieldset>
          </div>
        </div>
      )}

      {tab === 'display' && (
        <Fieldset title="Appearance">
          <div className="flex flex-col gap-4">
            <SettingsRow label="Theme">
              <div className="flex gap-0 border border-card-border">
                {(['dark', 'light'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { updateSettings({ theme: t }); showSaved(); }}
                    className={`px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                      settings.theme === t
                        ? 'bg-accent text-white'
                        : 'bg-card text-text-muted'
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
          </div>
        </Fieldset>
      )}

      {tab === 'panels' && (
        <Fieldset title="Visible Panels">
          <p className="text-text-dim text-xs mb-4">
            Choose which analysis panels appear when viewing a product.
          </p>
          <div className="flex flex-col gap-4">
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
          </div>
        </Fieldset>
      )}
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
      className={`relative w-10 rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-card-border'
      }`}
      style={{ height: 22 }}
    >
      <span
        className={`absolute top-0.5 left-0.5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-[18px]' : ''
        }`}
        style={{ width: 18, height: 18 }}
      />
    </button>
  );
}

function FbaFbmToggle({ value, onChange }: { value: string; onChange: (v: 'FBA' | 'FBM') => void }) {
  return (
    <div className="flex gap-0 border border-card-border">
      {(['FBA', 'FBM'] as const).map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${
            value === type
              ? 'bg-accent text-white'
              : 'bg-card text-text-muted'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
