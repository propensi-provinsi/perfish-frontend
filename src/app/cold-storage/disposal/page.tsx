import { ColdStoragePageGuard } from "@/components/cold-storage/ColdStorageModuleShell";
import AppShell from "@/components/layout/AppShell";
import DisposalPanel from "@/components/cold-storage/DisposalPanel";

export default function ColdStorageDisposalPage() {
  return (
    <ColdStoragePageGuard>
      <AppShell>
        <DisposalPanel />
      </AppShell>
    </ColdStoragePageGuard>
  );
}
