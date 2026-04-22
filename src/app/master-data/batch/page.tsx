"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import MasterDataShell, {
  type EntityConfig,
} from "@/components/master-data/MasterDataShell";
import { useMasterBatch } from "@/hooks/useMasterBatch";
import { useFishSpecies } from "@/hooks/useFishMaster";
import { useSupplier } from "@/hooks/useSupplier";
import { BATCH_STATUS_OPTIONS, QUALITY_GRADE_OPTIONS, UNIT_TYPE_OPTIONS } from "@/types/batch";

export default function MasterBatchPage() {
  const batch = useMasterBatch();
  const species = useFishSpecies();
  const supplier = useSupplier();

  const batchEntity: EntityConfig = {
    key: "master-batch",
    label: "Master Batch",
    idField: "batchId",
    codeField: "batchNumber",
    nameField: "batchNumber",
    columns: [
      { key: "batchNumber", label: "Nomor Batch" },
      { key: "batchDate", label: "Tgl Batch" },
      { key: "fishSpeciesName", label: "Species" },
      { key: "totalQuantity", label: "Total Kuantitas" },
      { key: "unit", label: "Satuan" },
      { key: "inboundReceiptCode", label: "Ref Inbound" },
      { key: "supplierName", label: "Supplier" },
      { key: "status", label: "Status" },
      { key: "qualityGrade", label: "Grade" },
    ],
    data: batch.data,
    loading: batch.loading || species.loading || supplier.loading,
    isMock: batch.isMock,
    error: batch.error,
    filterFields: [
      { key: "batchNumber", label: "No. Batch", type: "text" },
      {
        key: "fishSpeciesId",
        label: "Species",
        type: "select",
      },
      {
        key: "supplierId",
        label: "Supplier",
        type: "select",
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: BATCH_STATUS_OPTIONS,
      },
      {
        key: "qualityGrade",
        label: "Grade",
        type: "select",
        options: QUALITY_GRADE_OPTIONS,
      },
    ],
    formFields: [
      { key: "batchNumber", label: "Nomor Batch", type: "text", required: true, placeholder: "Contoh: BATCH-202310-001" },
      { key: "batchDate", label: "Tanggal Batch", type: "text", required: true, placeholder: "YYYY-MM-DD" }, // TODO: Better use date picker but text is fine for EntityFormModal for now
      {
        key: "inboundReceiptCode",
        label: "Ref Inbound (Penerimaan)",
        type: "text",
      },
      {
        key: "fishSpeciesId",
        label: "Species Ikan",
        type: "select",
        required: true,
        options: species.data.filter((s) => s.isActive).map((s) => ({ value: s.speciesId, label: s.speciesName })),
      },
      { key: "totalQuantity", label: "Total Kuantitas", type: "number", required: true, min: 0.1, step: 0.1 },
      { key: "currentQuantity", label: "Kuantitas Saat Ini", type: "number", min: 0, step: 0.1 },
      {
        key: "unit",
        label: "Satuan",
        type: "select",
        required: true,
        options: UNIT_TYPE_OPTIONS,
      },
      { key: "productionDate", label: "Tanggal Produksi", type: "text", placeholder: "YYYY-MM-DD" },
      { key: "expirationDate", label: "Tanggal Kadaluarsa", type: "text", placeholder: "YYYY-MM-DD" },
      {
        key: "supplierId",
        label: "Supplier",
        type: "select",
        options: supplier.data.filter((s) => s.active).map((s) => ({ value: s.id, label: s.supplierName })),
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        required: true,
        options: BATCH_STATUS_OPTIONS,
      },
      {
        key: "qualityGrade",
        label: "Grade Kualitas",
        type: "select",
        options: QUALITY_GRADE_OPTIONS,
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getFormData: (row: any) => ({
      batchNumber: row.batchNumber,
      batchDate: row.batchDate,
      fishSpeciesId: row.fishSpeciesId,
      totalQuantity: row.totalQuantity,
      currentQuantity: row.currentQuantity,
      unit: row.unit,
      productionDate: row.productionDate,
      expirationDate: row.expirationDate,
      supplierId: row.supplierId,
      status: row.status,
      qualityGrade: row.qualityGrade,
      inboundReceiptCode: row.inboundReceiptCode,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => batch.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => batch.update(Number(id), data as any),
    onDelete: async () => {
      throw new Error("Master Batch tidak memiliki operasi hapus secara hard-delete. Ubah status menjadi BLOCKED atau EXPIRED.");
    }, // Batch doesn't implement delete in typical systems due to tracking
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <MasterDataShell
          title="Master Batch"
          subtitle="Kelola dan pantau seluruh data batch ikan yang tersedia dari inbound maupun inisialisasi master data"
          entities={[batchEntity]}
        />
      </AppShell>
    </ProtectedRoute>
  );
}
