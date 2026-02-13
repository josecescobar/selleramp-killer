'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="dashboard-light">
        <DashboardShell>{children}</DashboardShell>
      </div>
    </ProtectedRoute>
  );
}
