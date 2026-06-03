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

export type QualityGrade = "A" | "B" | "C" | "REJECT";

/** Batch di loading bay (belum ada lokasi rack; API assignable-batches). */
export interface LoadingBayBatchRow {
  batchId: number;
  batchNumber: string;
  inboundReceiptId?: string | null;
  inboundReceiptCode?: string | null;
  lokasiPenerimaan?: string | null;
  fishSpeciesId?: number | null;
  fishSpeciesName?: string | null;
  currentQuantity?: number | string | null;
  unit?: string | null;
  status?: BatchStatus | null;
  tanggalMasuk?: string | null;
  umurSimpanDays?: number | null;
  umurSimpanBulan?: number | null;
  kategoriStatus?: StockCategoryStatus | null;
  qualityGrade?: QualityGrade | null;
  inboundRejectBatch?: boolean | null;
  updatedAt?: string | null;
}

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

export interface AssignLocationContextResponse {
  batchId: number;
  fishSpeciesId: number | null;
  fishSpeciesName: string | null;
  inboundColdStorageId: number | null;
  inboundColdStorageCode: string | null;
  inboundColdStorageName: string | null;
  warehouseLocked: boolean;
  /** ISO date (yyyy-MM-dd) — tanggal penerimaan inbound; tanggal masuk tidak boleh lebih awal. */
  inboundReceiptDate?: string | null;
}

export interface ColdStorageStructureSummary {
  coldStorageId: number;
  csCode: string;
  csName: string;
  branchCode: string | null;
  branchName: string | null;
  isActive: boolean | null;
  blockCount: number;
  rackCount: number;
  positionCount: number;
  positionCountByStatus: Record<string, number>;
  totalStockKg?: number | string | null;
  totalStockTon?: number | string | null;
  occupiedPositionCount?: number | null;
  availablePositionCount?: number | null;
  positionOccupancyRatePct?: number | null;
  capacityTon?: number | string | null;
  stockUtilizationPct?: number | null;
}

export interface ColdStorageStructureDetail {
  coldStorageId: number;
  csCode: string;
  csName: string;
  branchCode: string | null;
  branchName: string | null;
  isActive: boolean | null;
  blockCount: number;
  rackCount: number;
  positionCount: number;
  positionCountByStatus: Record<string, number>;
  totalStockKg?: number | string | null;
  totalStockTon?: number | string | null;
  occupiedPositionCount?: number | null;
  availablePositionCount?: number | null;
  positionOccupancyRatePct?: number | null;
  capacityTon?: number | string | null;
  stockUtilizationPct?: number | null;
  blocks: {
    blockId: number;
    blockCode: string;
    blockName: string;
    blockCapacity: number | null;
    isActive: boolean | null;
    racks: {
      rackId: number;
      rackCode: string;
      isActive: boolean | null;
      positions: {
        positionId: number;
        positionCode: string;
        status: string | null;
        isActive: boolean | null;
        occupantBatchId?: number | null;
        occupantBatchNumber?: string | null;
        occupantStockKg?: number | string | null;
      }[];
    }[];
  }[];
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
  inboundReceiptCode?: string | null;
  tanggalPenerimaan?: string | null;
  fishSkuCode?: string | null;
  gradeLabel?: string | null;
  umurSimpanDays: number;
  umurSimpanBulan: number;
  kategoriStatus: StockCategoryStatus;
  batchStatus: BatchStatus | null;
  qualityGrade: QualityGrade | null;
  inboundRejectBatch?: boolean | null;
  jumlahStok: number | string | null;
  unit: UnitType | null;
  expirationDate: string | null;
  daysToExpire: number;
  kandangMacanCode?: string | null;
  kandangNominalCapacityKg?: number | string | null;
  kandangUnderCapacity?: boolean | null;
  kandangUtilizationPct?: number | string | null;
  lastActivityAt?: string | null;
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
  disposedByName?: string | null;
  beritaAcaraStoredName?: string | null;
}

export type ColdStorageApprovalOperationType =
  | "MOVE_BATCH"
  | "DISPOSAL"
  | "BATCH_MERGE"
  | "STOCK_OPNAME_POST";

export type ColdStorageApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ColdStorageApprovalRequest {
  requestId: string;
  operationType: ColdStorageApprovalOperationType;
  status: ColdStorageApprovalStatus;
  summaryText: string | null;
  requestedBy: string | null;
  requestedByName?: string | null;
  requestedAt: string;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  pendingApproval?: boolean;
  beritaAcaraStoredName?: string | null;
  traceabilityBatchId?: number | null;
  traceabilityBatchNumber?: string | null;
  relatedSessionId?: number | null;
}

export interface StorageAreaOption {
  positionId: number;
  rackId: number;
  blockId: number;
  warehouseId: number;
  storageAreaCode: string;
  displayName: string;
}

// ── Stock opname & gabung batch ───────────────────────────────────

export interface StockOpnameLineResponse {
  lineId: number;
  batchId?: number | null;
  batchNumber?: string | null;
  kandangMacanCode?: string | null;
  speciesId?: number | null;
  speciesName?: string | null;
  fishSkuId?: number | null;
  fishSkuCode?: string | null;
  qualityGrade?: string | null;
  gradeLabel?: string | null;
  systemQtyKg: number | string;
  countedQtyKg?: number | string | null;
  varianceKg?: number | string | null;
  shrinkagePct?: number | string | null;
  targetStorageTempC?: number | string | null;
  countedTempC?: number | string | null;
  /** OK | WARNING | NO_TARGET | NOT_MEASURED */
  temperatureStatus?: string | null;
  underKandangNominalKg?: boolean | null;
}

export interface StockOpnameSessionResponse {
  sessionId: number;
  coldStorageId: number | null;
  coldStorageCode: string | null;
  coldStorageName: string | null;
  periodYyyymm: number;
  status: string;
  notes: string | null;
  postedAt: string | null;
  postedBy: string | null;
  lines: StockOpnameLineResponse[];
}

export interface StockOpnameCreatePayload {
  coldStorageId: number;
  periodYyyymm: number;
  notes?: string;
}

export interface StockOpnameLinesUpdatePayload {
  lines: { lineId: number; countedQtyKg: number; countedTempC?: number | null }[];
}

export interface BatchMergePayload {
  survivorBatchId: number;
  donorBatchIds: number[];
}

export interface BatchMergeLineageItem {
  donorBatchId: number;
  donorBatchNumber: string;
  donorInboundReceiptId: string | null;
  transferredQtyKg: number | string;
}

export interface BatchMergeResponseData {
  survivorBatchId: number;
  survivorBatchNumber: string;
  survivorTotalQtyKg: number | string;
  survivorFishSkuId?: number | null;
  survivorFishSkuCode?: string | null;
  warnings: string[];
  lineage: BatchMergeLineageItem[];
}

// ── E05-PBI-04: Move Batch ───────────────────────────────────────

export interface MoveBatchRequest {
  batch_id: number;
  lokasi_asal: number;
  destination_type?: "LOADING_BAY" | "COLD_STORAGE";
  lokasi_tujuan?: number;
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
  beritaAcaraStoredName?: string | null;
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

/** Detail lengkap batch (monitor, loading bay, scan QR). */
export interface MasterBatchDetail {
  batchId: number;
  batchNumber: string;
  batchDate?: string | null;
  fishSpeciesId?: number | null;
  fishSpeciesName?: string | null;
  totalQuantity?: number | string | null;
  currentQuantity?: number | string | null;
  unit?: UnitType | null;
  productionDate?: string | null;
  expirationDate?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  status?: BatchStatus | null;
  qualityGrade?: QualityGrade | null;
  inboundReceiptId?: string | null;
  inboundReceiptCode?: string | null;
  lokasiPenerimaan?: string | null;
  tanggalMasuk?: string | null;
  umurSimpanDays?: number | null;
  umurSimpanBulan?: number | null;
  kategoriStatus?: StockCategoryStatus | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

export interface BatchDetailResponse {
  batch: MasterBatchDetail;
  inLoadingBay: boolean;
  currentStock: ColdStorageStockRow | null;
  assignContext: AssignLocationContextResponse | null;
  history: BatchHistoryResponse;
  /** Suhu penerimaan inbound (°C). */
  receptionTempC?: number | string | null;
  /** Suhu tampilan: terakhir stock opname, atau suhu penerimaan. */
  storageTempC?: number | string | null;
  /** SKU dari inbound (batch atau weighing log). */
  fishSkuCode?: string | null;
  gradeLabel?: string | null;
  /** Catatan alasan reject mutu inbound (Sizing & Grading). */
  inboundRejectReason?: string | null;
}
