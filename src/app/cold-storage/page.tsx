import { ColdStoragePageGuard } from "@/components/cold-storage/ColdStorageModuleShell";
import AppShell from "@/components/layout/AppShell";
import ColdStorageDashboard from "@/components/cold-storage/ColdStorageDashboard";

export default function ColdStoragePage() {
  return (
    <ColdStoragePageGuard>
      <AppShell>
        <ColdStorageDashboard />
      </AppShell>
    </ColdStoragePageGuard>
  );
}
