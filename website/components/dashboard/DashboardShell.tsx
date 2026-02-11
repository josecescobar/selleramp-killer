'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth-context';

const NAV_ITEMS = [
  { label: 'Search', href: '/dashboard', icon: '\uD83D\uDD0D' },
  { label: 'History', href: '/dashboard/history', icon: '\uD83D\uDD53' },
  { label: 'Settings', href: '/dashboard/settings', icon: '\u2699\uFE0F' },
  { label: 'Account', href: '/dashboard/account', icon: '\uD83D\uDC64' },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-surface border-r border-divider flex flex-col fixed top-0 left-0 bottom-0 z-40">
        <div className="p-5 border-b border-divider">
          <Logo size={24} />
        </div>

        <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-accent-glow text-accent'
                    : 'text-text-muted hover:text-text-primary hover:bg-card'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-divider">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent-glow flex items-center justify-center text-accent text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-text-primary text-sm font-medium truncate">
                {user?.name}
              </div>
              <div className="text-text-dim text-xs truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-text-dim text-xs hover:text-text-muted transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56">
        {children}
      </main>
    </div>
  );
}
