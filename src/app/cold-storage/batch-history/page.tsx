"use client";

import { ColdStoragePageGuard } from "@/components/cold-storage/ColdStorageModuleShell";
import AppShell from "@/components/layout/AppShell";
import BatchHistoryPanel from "@/components/cold-storage/BatchHistoryPanel";

export default function BatchHistoryPage() {
  return (
    <ColdStoragePageGuard>
      <AppShell>
        <BatchHistoryPanel />
      </AppShell>
    </ColdStoragePageGuard>
  );
}
