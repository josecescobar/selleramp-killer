'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { NavDropdown, DropdownItem } from './NavDropdown';

function DashboardLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
      <span
        className="w-7 h-7 rounded flex items-center justify-center text-white font-bold text-sm bg-brand"
      >
        S
      </span>
      <span className="hidden sm:inline text-text-primary font-semibold text-sm">SourceTool</span>
    </Link>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [navQuery, setNavQuery] = useState('');

  function handleNavSearch(e: FormEvent) {
    e.preventDefault();
    if (!navQuery.trim()) return;
    router.push(`/dashboard/result?q=${encodeURIComponent(navQuery.trim())}`);
  }

  function handleLogout() {
    logout();
    router.push('/');
  }

  const sheetsItems: DropdownItem[] = [
    { type: 'link', label: 'Sheets', href: '/dashboard/sheets' },
  ];

  const helpItems: DropdownItem[] = [
    { type: 'link', label: 'Install Apps', href: 'https://chrome.google.com/webstore', external: true },
    { type: 'link', label: 'YouTube', href: 'https://youtube.com', external: true },
    { type: 'link', label: 'Contact Us', href: '/contact' },
  ];

  const accountItems: DropdownItem[] = [
    { type: 'link', label: 'Account', href: '/dashboard/account' },
    { type: 'link', label: 'Settings', href: '/dashboard/settings' },
    { type: 'link', label: 'Integrations', href: '/dashboard/integrations' },
    { type: 'divider' },
    { type: 'action', label: 'Logout', onClick: handleLogout },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <nav className="sticky top-0 z-40 bg-surface border-b border-divider h-[50px] flex items-center px-4">
        <DashboardLogo />

        {/* Center search */}
        <form onSubmit={handleNavSearch} className="flex-1 hidden sm:flex justify-center mx-4">
          <input
            type="text"
            value={navQuery}
            onChange={(e) => setNavQuery(e.target.value)}
            placeholder="Search Products"
            className="w-full max-w-sm bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
          />
        </form>

        {/* Right nav items */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/dashboard/history"
            className="flex items-center gap-1 text-sm text-text-primary hover:text-accent transition-colors px-2 py-1"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="hidden md:inline">History</span>
          </Link>
          <NavDropdown
            label={
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-sm bg-[#0f9d58] text-white text-[10px] font-bold flex items-center justify-center leading-none">G</span>
                <span className="hidden md:inline">Sheets</span>
              </span>
            }
            items={sheetsItems}
          />
          <NavDropdown
            label={
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                </svg>
                <span className="hidden md:inline">Help</span>
              </span>
            }
            items={helpItems}
          />
          <NavDropdown
            label={
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <span className="hidden md:inline">My Account{user?.name ? ` - ${user.name}` : ''}</span>
              </span>
            }
            items={accountItems}
          />
        </div>
      </nav>

      <main className="flex-1">{children}</main>
    </div>
  );
}
