/* ─────────────────────────────────────────────────────────────────
   Cold Storage Domain — TypeScript types untuk E05-PBI-01/02/03/05
   ───────────────────────────────────────────────────────────────── */

export type StockCategoryStatus =
  | "FRESH"
  | "WARNING"
  | "EXPIRED"
  | "QUARANTINE"
  | "DISPOSED";

export type UnitType = "KG" | "TON";

export type BatchStatus = "QUARANTINE" | "AVAILABLE" | "EXPIRED" | "BLOCKED";

export type QualityGrade = "PREMIUM" | "STANDARD" | "LOW" | "REJECT";

// ── E05-PBI-01: Assign Location ───────────────────────────────────

export interface AssignLocationRequest {
  batchId: number;
  warehouseId: number;
  storageAreaId: number;
  tanggalMasuk?: string;
  notes?: string;
}

export interface AssignLocationResponse {
  locationId: number;
  batchId: number;
  batchNumber: string;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  branchId: number | null;
  branchName: string | null;
  storageAreaId: number | null;
  storageArea: string;
  tanggalMasuk: string;
  umurSimpanDays: number | null;
  isActive: boolean;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

// ── E05-PBI-02: Monitoring Stock ──────────────────────────────────

export interface ColdStorageStockRow {
  batchId: number;
  batchNumber: string;
  speciesId: number | null;
  speciesName: string | null;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  storageArea: string;
  tanggalMasuk: string;
  umurSimpanDays: number;
  umurSimpanBulan: number;
  kategoriStatus: StockCategoryStatus;
  batchStatus: BatchStatus | null;
  qualityGrade: QualityGrade | null;
  jumlahStok: number | string | null;
  unit: UnitType | null;
  expirationDate: string | null;
  daysToExpire: number;
}

// ── E05-PBI-05: Disposal ──────────────────────────────────────────

export interface DisposalRequest {
  batchId: number;
  jumlahDibuang: number;
  alasan: string;
}

export interface DisposalResponse {
  disposalId: number;
  batchId: number;
  batchNumber: string;
  speciesName: string | null;
  jumlahDibuang: number | string;
  unit: UnitType | null;
  alasan: string;
  remainingAfterDisposal: number | string;
  disposedAt: string;
  disposedBy: string | null;
}

export interface StorageAreaOption {
  positionId: number;
  rackId: number;
  blockId: number;
  warehouseId: number;
  storageAreaCode: string;
  displayName: string;
}
