import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import ColdStorageDashboard from "@/components/cold-storage/ColdStorageDashboard";

export default function ColdStoragePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ColdStorageDashboard />
      </AppShell>
    </ProtectedRoute>
  );
}
