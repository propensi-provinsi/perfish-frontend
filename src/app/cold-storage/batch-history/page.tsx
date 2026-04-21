import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import BatchHistoryPanel from "@/components/cold-storage/BatchHistoryPanel";

export default function BatchHistoryPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <BatchHistoryPanel />
      </AppShell>
    </ProtectedRoute>
  );
}
