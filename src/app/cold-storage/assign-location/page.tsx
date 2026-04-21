import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import AssignLocationForm from "@/components/cold-storage/AssignLocationForm";

export default function AssignLocationPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <AssignLocationForm />
      </AppShell>
    </ProtectedRoute>
  );
}
