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
        className="w-7 h-7 rounded flex items-center justify-center text-white font-bold text-sm"
        style={{ backgroundColor: '#e67e22' }}
      >
        S
      </span>
      <span className="text-text-primary font-semibold text-sm">SourceTool</span>
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
    alert(`Search for: ${navQuery}\n\nProduct analysis will be available when connected to the extension API.`);
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
        <form onSubmit={handleNavSearch} className="flex-1 flex justify-center mx-4">
          <input
            type="text"
            value={navQuery}
            onChange={(e) => setNavQuery(e.target.value)}
            placeholder="Search Products"
            className="w-full max-w-sm bg-card border border-card-border px-3 py-1.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors"
          />
        </form>

        {/* Right nav items */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/dashboard/history"
            className="text-sm text-text-primary hover:text-accent transition-colors px-2 py-1"
          >
            History
          </Link>
          <NavDropdown label="Sheets" items={sheetsItems} />
          <NavDropdown label="Help" items={helpItems} />
          <NavDropdown
            label={<>My Account{user?.name ? ` - ${user.name}` : ''}</>}
            items={accountItems}
          />
        </div>
      </nav>

      <main className="flex-1">{children}</main>
    </div>
  );
}
