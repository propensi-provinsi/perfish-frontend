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

// ── E05-PBI-04: Move Batch ───────────────────────────────────────

export interface MoveBatchRequest {
  batch_id: number;
  lokasi_asal: number;
  lokasi_tujuan: number;
  notes?: string;
}

export interface MoveBatchResponse {
  batchId: number;
  batchNumber: string;
  lokasiAsal: number;
  lokasiAsalLabel: string;
  warehouseAsalId: number | null;
  warehouseAsalCode: string | null;
  warehouseAsalName: string | null;
  lokasiTujuan: number;
  lokasiTujuanLabel: string;
  warehouseTujuanId: number;
  warehouseTujuanCode: string;
  warehouseTujuanName: string;
  tanggalMasuk: string;
  umurSimpanDays: number | null;
  newLocationId: number;
  movedAt: string;
  movedBy: string | null;
}

export interface BatchStatusHistoryItem {
  timestamp: string;
  oldStatus: string | null;
  newStatus: string | null;
  changedBy: string | null;
  actionType: string | null;
}

export interface BatchMovementHistoryItem {
  locationId: number;
  warehouseId: number | null;
  warehouseCode: string | null;
  warehouseName: string | null;
  storageArea: string | null;
  tanggalMasuk: string | null;
  umurSimpanDays: number | null;
  isActive: boolean;
  movedAt: string | null;
  movedBy: string | null;
}

export interface BatchDisposalHistoryItem {
  disposalId: number;
  disposedAt: string;
  disposedBy: string | null;
  jumlahDibuang: string;
  unit: string | null;
  alasan: string;
  remainingAfterDisposal: string | null;
}

export interface BatchTimelineItem {
  timestamp: string;
  type: "MOVEMENT" | "STATUS" | "DISPOSAL" | string;
  title: string;
  description: string;
  actor: string | null;
}

export interface BatchHistoryResponse {
  batchId: number;
  batchNumber: string;
  currentStatus: string | null;
  tanggalMasuk: string | null;
  statusChanges: BatchStatusHistoryItem[];
  movementHistory: BatchMovementHistoryItem[];
  disposalHistory: BatchDisposalHistoryItem[];
  timeline: BatchTimelineItem[];
}
