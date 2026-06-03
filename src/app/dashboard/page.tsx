"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import Dashboard from "@/components/dashboard/Dashboard";
import { canAccessDashboardOverview } from "@/lib/rbac";

export default function DashboardPage() {
  return (
    <ProtectedRoute authorize={canAccessDashboardOverview}>
      <AppShell>
        <Dashboard />
      </AppShell>
    </ProtectedRoute>
  );
}
