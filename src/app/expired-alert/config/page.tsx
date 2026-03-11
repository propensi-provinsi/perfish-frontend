import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import ExpiryShelfLifeConfig from "@/components/expiry/ExpiryShelfLifeConfig";

export default function ExpiredAlertConfigPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ExpiryShelfLifeConfig />
      </AppShell>
    </ProtectedRoute>
  );
}
