"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import MasterDataShell, {
  type EntityConfig,
} from "@/components/master-data/MasterDataShell";
import { useMasterBatch } from "@/hooks/useMasterBatch";
import { useFishSpecies } from "@/hooks/useFishMaster";
import { useSupplier } from "@/hooks/useSupplier";
import {
  BATCH_STATUS_OPTIONS,
  QUALITY_GRADE_OPTIONS,
  UNIT_TYPE_OPTIONS,
  type BatchStatus,
  type MasterBatchRequest,
  type MasterBatchResponse,
  type QualityGrade,
  type UnitType,
} from "@/types/batch";

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}

function toBatchPayload(data: Record<string, unknown>): MasterBatchRequest {
  return {
    batchNumber: String(data.batchNumber ?? ""),
    batchDate: String(data.batchDate ?? ""),
    fishSpeciesId: Number(data.fishSpeciesId),
    totalQuantity: Number(data.totalQuantity),
    currentQuantity:
      data.currentQuantity === undefined || data.currentQuantity === null || data.currentQuantity === ""
        ? undefined
        : Number(data.currentQuantity),
    unit: data.unit as UnitType,
    productionDate: optionalString(data.productionDate),
    expirationDate: optionalString(data.expirationDate),
    supplierId: optionalString(data.supplierId),
    status: data.status as BatchStatus,
    qualityGrade: data.qualityGrade ? (data.qualityGrade as QualityGrade) : undefined,
  };
}

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
      { key: "fishSkuCode", label: "SKU" },
      { key: "kandangMacanCode", label: "Kandang Macan" },
      { key: "totalQuantity", label: "Total Kuantitas" },
      { key: "currentQuantity", label: "Sisa" },
      { key: "unit", label: "Satuan" },
      { key: "poCode", label: "PO" },
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
      { key: "batchNumber", label: "Nomor Batch", type: "text", required: true, placeholder: "Contoh: BATCH-202310-001", disabled: true },
      { key: "batchDate", label: "Tanggal Batch", type: "text", required: true, placeholder: "YYYY-MM-DD", disabled: true },
      {
        key: "poCode",
        label: "Purchase Order",
        type: "text",
        disabled: true,
      },
      {
        key: "inboundReceiptCode",
        label: "Ref Inbound (Penerimaan)",
        type: "text",
        disabled: true,
      },
      {
        key: "kandangMacanCode",
        label: "Kandang Macan",
        type: "text",
        disabled: true,
      },
      {
        key: "fishSkuCode",
        label: "SKU / Komposisi Utama",
        type: "text",
        disabled: true,
      },
      {
        key: "weighingLogId",
        label: "Ref Timbang",
        type: "text",
        disabled: true,
      },
      {
        key: "fishSpeciesId",
        label: "Species Ikan",
        type: "select",
        required: true,
        disabled: true,
        options: species.data.filter((s) => s.isActive).map((s) => ({ value: s.speciesId, label: s.speciesName })),
      },
      { key: "totalQuantity", label: "Total Kuantitas", type: "number", required: true, min: 0.1, step: 0.1, disabled: true },
      { key: "currentQuantity", label: "Kuantitas Saat Ini", type: "number", min: 0, step: 0.1 },
      {
        key: "unit",
        label: "Satuan",
        type: "select",
        required: true,
        disabled: true,
        options: UNIT_TYPE_OPTIONS,
      },
      { key: "productionDate", label: "Tanggal Produksi", type: "text", placeholder: "YYYY-MM-DD" },
      { key: "expirationDate", label: "Tanggal Kadaluarsa", type: "text", placeholder: "YYYY-MM-DD" },
      {
        key: "supplierId",
        label: "Supplier",
        type: "select",
        disabled: true,
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
        disabled: true,
        options: QUALITY_GRADE_OPTIONS,
      },
    ],
    getFormData: (row) => {
      const batchRow = row as MasterBatchResponse;
      return {
        batchNumber: batchRow.batchNumber,
        batchDate: batchRow.batchDate,
        fishSpeciesId: batchRow.fishSpeciesId,
        totalQuantity: batchRow.totalQuantity,
        currentQuantity: batchRow.currentQuantity,
        unit: batchRow.unit,
        productionDate: batchRow.productionDate,
        expirationDate: batchRow.expirationDate,
        supplierId: batchRow.supplierId,
        status: batchRow.status,
        qualityGrade: batchRow.qualityGrade,
        poCode: batchRow.poCode,
        inboundReceiptCode: batchRow.inboundReceiptCode,
        kandangMacanCode: batchRow.kandangMacanCode,
        fishSkuCode: batchRow.fishSkuCode,
        weighingLogId: batchRow.weighingLogId,
      };
    },
    canCreate: false,
    createDisabledReason: "Batch dibuat dari inbound/QC/palletisasi, bukan manual dari Master Data.",
    onCreate: async () => {
      throw new Error("Batch dibuat dari inbound/QC/palletisasi, bukan manual dari Master Data.");
    },
    onUpdate: (id, data) => batch.update(Number(id), toBatchPayload(data)),
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
