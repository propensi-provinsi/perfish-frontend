import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import DisposalPanel from "@/components/cold-storage/DisposalPanel";

export default function ColdStorageDisposalPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <DisposalPanel />
      </AppShell>
    </ProtectedRoute>
  );
}
