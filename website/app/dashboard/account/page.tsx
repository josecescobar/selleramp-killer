'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

type Tab = 'details' | 'subscription' | 'devices';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('details');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'subscription', label: 'Subscription' },
    { key: 'devices', label: 'Devices' },
  ];

  function handleDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      // Clear all user data
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
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Account</h1>
        <p className="text-text-muted text-sm">
          Manage your account details, subscription, and connected devices.
        </p>
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

      {tab === 'details' && <DetailsTab user={user} />}
      {tab === 'subscription' && <SubscriptionTab />}
      {tab === 'devices' && <DevicesTab />}

      {/* Danger zone */}
      <div className="mt-12 bg-card border border-red-400/20 rounded-xl p-6">
        <h3 className="text-red-400 text-sm font-semibold mb-2">Danger Zone</h3>
        <p className="text-text-muted text-sm mb-4">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="text-red-400 text-sm font-medium bg-red-400/10 px-4 py-2 rounded-lg hover:bg-red-400/20 transition-colors"
        >
          Delete Account
        </button>
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
    // In a real app this would call an API
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleResetPassword() {
    setPasswordMsg('Password reset instructions would be sent to your email.');
    setTimeout(() => setPasswordMsg(''), 3000);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Account Details */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="bg-surface px-5 py-3 border-b border-card-border">
          <h3 className="text-text-primary text-sm font-semibold">Account Details</h3>
        </div>
        <form onSubmit={handleSaveDetails} className="p-5 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <label className="text-text-muted text-sm shrink-0 w-28">Name</label>
            <input
              type="text"
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              className="flex-1 bg-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <label className="text-text-muted text-sm shrink-0 w-28">Email</label>
            <div className="flex-1 flex gap-2">
              <input
                type="email"
                value={emailVal}
                onChange={(e) => setEmailVal(e.target.value)}
                className="flex-1 bg-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <label className="text-text-muted text-sm shrink-0 w-28">Password</label>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="password"
                value="************"
                disabled
                className="flex-1 bg-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-dim"
              />
              <button
                type="button"
                onClick={handleResetPassword}
                className="bg-accent text-white text-xs font-medium px-3 py-2 rounded-lg shrink-0"
              >
                Reset
              </button>
            </div>
          </div>
          {passwordMsg && (
            <p className="text-accent text-xs">{passwordMsg}</p>
          )}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="btn-gradient text-white text-sm font-semibold px-5 py-2 rounded-lg"
            >
              Save Changes
            </button>
            {saved && (
              <span className="text-accent text-sm font-medium animate-fade-in-up">
                Saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Member since */}
      <div className="text-text-dim text-xs">
        Member since{' '}
        {user?.createdAt
          ? new Date(user.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })
          : '—'}
      </div>
    </div>
  );
}

function SubscriptionTab() {
  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      <div className="bg-surface px-5 py-3 border-b border-card-border">
        <h3 className="text-text-primary text-sm font-semibold">Subscription</h3>
      </div>
      <div className="p-8 text-center">
        <div className="w-12 h-12 bg-accent-glow rounded-full flex items-center justify-center text-accent text-xl mx-auto mb-4">
          &#x2713;
        </div>
        <h4 className="text-text-primary font-semibold text-lg mb-1">Free Plan</h4>
        <p className="text-text-muted text-sm mb-6">
          You&apos;re currently on the free plan with access to all features.
        </p>
        <div className="bg-bg border border-card-border rounded-xl p-4 max-w-sm mx-auto text-left">
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
        <p className="text-text-dim text-xs mt-6">
          Premium plans with advanced features coming soon.
        </p>
      </div>
    </div>
  );
}

function DevicesTab() {
  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      <div className="bg-surface px-5 py-3 border-b border-card-border">
        <h3 className="text-text-primary text-sm font-semibold">Connected Devices</h3>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-4 p-4 bg-bg rounded-xl">
          <div className="w-10 h-10 bg-accent-glow rounded-lg flex items-center justify-center text-accent text-lg">
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
      </div>
    </div>
  );
}
