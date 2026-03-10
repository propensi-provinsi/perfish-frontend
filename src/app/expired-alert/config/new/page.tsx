import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import ExpiryShelfLifeConfigEditor from "@/components/expiry/ExpiryShelfLifeConfigEditor";

export default function ExpiredAlertConfigNewPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ExpiryShelfLifeConfigEditor />
      </AppShell>
    </ProtectedRoute>
  );
}
