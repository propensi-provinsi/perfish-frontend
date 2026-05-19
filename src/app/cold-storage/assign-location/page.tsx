import { Suspense } from "react";
import { ColdStoragePageGuard } from "@/components/cold-storage/ColdStorageModuleShell";
import AppShell from "@/components/layout/AppShell";
import AssignLocationForm from "@/components/cold-storage/AssignLocationForm";

export default function AssignLocationPage() {
  return (
    <ColdStoragePageGuard>
      <AppShell>
        <Suspense fallback={<p className="p-4 text-sm text-gray-500 dark:text-gray-400">Memuat form…</p>}>
          <AssignLocationForm />
        </Suspense>
      </AppShell>
    </ColdStoragePageGuard>
  );
}
