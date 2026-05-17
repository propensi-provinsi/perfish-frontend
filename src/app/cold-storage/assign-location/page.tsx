import { Suspense } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import AssignLocationForm from "@/components/cold-storage/AssignLocationForm";

export default function AssignLocationPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={<p className="p-4 text-sm text-gray-500 dark:text-gray-400">Memuat form…</p>}>
          <AssignLocationForm />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
