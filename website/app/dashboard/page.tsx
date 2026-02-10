'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <main>
        <DashboardContent />
      </main>
      <Footer />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  return (
    <section className="pt-28 pb-20 px-5">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Welcome back, <span className="gradient-text">{user?.name}</span>
          </h1>
          <p className="text-text-muted text-lg">
            Here&apos;s your SourceTool dashboard.
          </p>
        </div>

        {/* Stats placeholder */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {[
            { label: 'Products Analyzed', value: '—' },
            { label: 'Deals Found', value: '—' },
            { label: 'Time Saved', value: '—' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-card-border rounded-xl p-6 text-center"
            >
              <div className="text-2xl font-bold text-text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-text-muted text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <h2 className="text-lg font-bold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h3 className="text-text-primary font-semibold mb-2">Install Extension</h3>
            <p className="text-text-muted text-sm mb-4">
              Get SourceTool on your browser to start analyzing products.
            </p>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gradient inline-flex text-white text-sm font-semibold px-5 py-2 rounded-lg"
            >
              Install on Chrome
            </a>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h3 className="text-text-primary font-semibold mb-2">Account Settings</h3>
            <p className="text-text-muted text-sm mb-4">
              Manage your profile, preferences, and subscription.
            </p>
            <span className="text-text-dim text-sm font-medium">Coming soon</span>
          </div>
        </div>
      </div>
    </section>
  );
}
