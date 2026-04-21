import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import MoveBatchForm from "@/components/cold-storage/MoveBatchForm";

export default function MoveBatchPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <MoveBatchForm />
      </AppShell>
    </ProtectedRoute>
  );
}
