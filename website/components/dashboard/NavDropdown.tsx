'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export type DropdownItem =
  | { type: 'link'; label: string; href: string; external?: boolean }
  | { type: 'action'; label: string; onClick: () => void }
  | { type: 'divider' };

interface NavDropdownProps {
  label: React.ReactNode;
  items: DropdownItem[];
}

export function NavDropdown({ label, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm text-text-primary hover:text-accent transition-colors px-2 py-1"
      >
        {label}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="ml-0.5">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-card-border shadow-lg min-w-[180px] py-1 z-50">
          {items.map((item, i) => {
            if (item.type === 'divider') {
              return <div key={i} className="border-t border-divider my-1" />;
            }
            if (item.type === 'link') {
              if (item.external) {
                return (
                  <a
                    key={i}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-sm text-text-primary hover:bg-surface transition-colors"
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <Link
                  key={i}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm text-text-primary hover:bg-surface transition-colors"
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                key={i}
                onClick={() => { item.onClick(); setOpen(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface transition-colors"
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
