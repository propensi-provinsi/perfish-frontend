import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import ExpiredAlertDashboard from "@/components/expiry/ExpiredAlertDashboard";

export default function ExpiredAlertPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ExpiredAlertDashboard />
      </AppShell>
    </ProtectedRoute>
  );
}
