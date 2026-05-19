"use client";

import { useParams } from "next/navigation";
import { ColdStoragePageGuard } from "@/components/cold-storage/ColdStorageModuleShell";
import AppShell from "@/components/layout/AppShell";
import BatchDetailView from "@/components/cold-storage/BatchDetailView";

export default function BatchDetailPage() {
  const params = useParams<{ batchNumber: string }>();
  const batchNumber = decodeURIComponent(params.batchNumber ?? "");

  return (
    <ColdStoragePageGuard>
      <AppShell>
        <BatchDetailView batchNumber={batchNumber} />
      </AppShell>
    </ColdStoragePageGuard>
  );
}
