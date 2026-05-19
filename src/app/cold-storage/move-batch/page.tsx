import { ColdStoragePageGuard } from "@/components/cold-storage/ColdStorageModuleShell";
import AppShell from "@/components/layout/AppShell";
import MoveBatchForm from "@/components/cold-storage/MoveBatchForm";

export default function MoveBatchPage() {
  return (
    <ColdStoragePageGuard>
      <AppShell>
        <MoveBatchForm />
      </AppShell>
    </ColdStoragePageGuard>
  );
}
