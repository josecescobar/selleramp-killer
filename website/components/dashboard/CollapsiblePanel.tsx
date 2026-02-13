'use client';

import { useState, ReactNode } from 'react';

interface CollapsiblePanelProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsiblePanel({
  title,
  icon,
  defaultOpen = true,
  children,
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-card-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-surface px-3 py-2 flex items-center justify-between text-sm font-semibold text-text-primary border-b border-card-border"
      >
        <span className="flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && <div className="bg-card p-3">{children}</div>}
    </div>
  );
}
