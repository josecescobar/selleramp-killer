'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Fieldset } from '@/components/dashboard/Fieldset';

type Tab = 'details' | 'subscription' | 'devices' | 'billing' | 'tags';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('details');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'subscription', label: 'Subscription' },
    { key: 'devices', label: 'Devices' },
    { key: 'billing', label: 'Billing' },
    { key: 'tags', label: 'Tags' },
  ];

  function handleDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      localStorage.removeItem('sourcetool_users');
      localStorage.removeItem('sourcetool_session');
      localStorage.removeItem('sourcetool_seeded');
      localStorage.removeItem('sourcetool_history');
      localStorage.removeItem('sourcetool_history_seeded');
      localStorage.removeItem('sourcetool_settings');
      logout();
      router.push('/');
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary mb-1">Account</h1>
        <p className="text-text-muted text-sm">
          Manage your account details, subscription, and connected devices.
        </p>
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

      {tab === 'details' && <DetailsTab user={user} />}
      {tab === 'subscription' && <SubscriptionTab />}
      {tab === 'devices' && <DevicesTab />}
      {tab === 'billing' && <BillingTab />}
      {tab === 'tags' && <TagsTab />}

      {/* Danger zone */}
      <div className="mt-10 border border-card-border">
        <div className="bg-surface px-4 py-2.5 border-b border-card-border">
          <h3 className="text-red-500 text-sm font-semibold">Danger Zone</h3>
        </div>
        <div className="bg-card p-4">
          <p className="text-text-muted text-sm mb-4">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="text-white text-sm font-medium bg-red-500 px-4 py-2 hover:bg-red-600 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailsTab({ user }: { user: { name: string; email: string; createdAt: string } | null }) {
  const [nameVal, setNameVal] = useState(user?.name || '');
  const [emailVal, setEmailVal] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  function handleSaveDetails(e: FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleResetPassword() {
    setPasswordMsg('Password reset instructions would be sent to your email.');
    setTimeout(() => setPasswordMsg(''), 3000);
  }

  return (
    <div className="flex flex-col gap-6">
      <Fieldset title="Account Details">
        <form onSubmit={handleSaveDetails} className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <label className="text-text-muted text-sm shrink-0 w-28">Username</label>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                className="flex-1 bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                className="btn-gradient text-white text-xs font-medium px-3 py-1.5 shrink-0"
              >
                Change
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <label className="text-text-muted text-sm shrink-0 w-28">Email</label>
            <div className="flex-1 flex gap-2">
              <input
                type="email"
                value={emailVal}
                onChange={(e) => setEmailVal(e.target.value)}
                className="flex-1 bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                className="btn-gradient text-white text-xs font-medium px-3 py-1.5 shrink-0"
              >
                Change
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <label className="text-text-muted text-sm shrink-0 w-28">Password</label>
            <div className="flex-1 flex gap-2">
              <input
                type="password"
                value="************"
                disabled
                className="flex-1 bg-card border border-card-border px-3 py-1.5 text-sm text-text-dim"
              />
              <button
                type="button"
                onClick={handleResetPassword}
                className="btn-gradient text-white text-xs font-medium px-3 py-1.5 shrink-0"
              >
                Reset
              </button>
            </div>
          </div>
          {passwordMsg && (
            <p className="text-accent text-xs">{passwordMsg}</p>
          )}
          {saved && (
            <span className="text-accent text-sm font-medium">Saved!</span>
          )}
        </form>
      </Fieldset>

      <div className="text-text-dim text-xs">
        Member since{' '}
        {user?.createdAt
          ? new Date(user.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })
          : '\u2014'}
      </div>
    </div>
  );
}

function SubscriptionTab() {
  return (
    <Fieldset title="Subscription">
      <div className="py-6 text-center">
        <h4 className="text-text-primary font-semibold text-lg mb-1">Free Plan</h4>
        <p className="text-text-muted text-sm mb-4">
          You&apos;re currently on the free plan with access to all features.
        </p>
        <div className="border border-card-border p-4 max-w-sm mx-auto text-left">
          <div className="flex flex-col gap-2">
            {[
              'Unlimited product lookups',
              'All analysis panels',
              'Price & BSR history',
              'eBay cross-marketplace',
              'Risk alerts & deal scoring',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <span className="text-accent">&#x2713;</span>
                <span className="text-text-muted">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-text-dim text-xs mt-4">
          Premium plans with advanced features coming soon.
        </p>
      </div>
    </Fieldset>
  );
}

function DevicesTab() {
  return (
    <Fieldset title="Connected Devices">
      <div className="flex items-center gap-4 p-3 bg-surface border border-card-border">
        <div className="w-10 h-10 bg-accent-glow flex items-center justify-center text-accent text-lg">
          &#x1F4BB;
        </div>
        <div className="flex-1">
          <div className="text-text-primary text-sm font-medium">Chrome Browser</div>
          <div className="text-text-dim text-xs">This device &middot; Active now</div>
        </div>
        <span className="w-2 h-2 rounded-full bg-green-400" />
      </div>
      <p className="text-text-dim text-xs mt-4">
        Mobile apps for iOS and Android are coming soon. Your account will sync
        across all devices.
      </p>
    </Fieldset>
  );
}

function BillingTab() {
  return (
    <Fieldset title="Billing">
      <div className="py-6 text-center">
        <p className="text-text-muted text-sm mb-2">No billing information on file.</p>
        <p className="text-text-dim text-xs">
          Billing settings will be available when premium plans launch.
        </p>
      </div>
    </Fieldset>
  );
}

function TagsTab() {
  return (
    <Fieldset title="Tags">
      <div className="py-6 text-center">
        <p className="text-text-muted text-sm mb-2">No tags created yet.</p>
        <p className="text-text-dim text-xs">
          Create tags to organize your product lookups and notes.
        </p>
      </div>
    </Fieldset>
  );
}
