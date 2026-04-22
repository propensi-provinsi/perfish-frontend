/**
 * Batch Management — TypeScript types
 *
 * Matches backend DTOs:
 *   MasterBatchResponse, MasterBatchRequest
 *   PalletResponse, PalletRequest
 */

// ── Enums ────────────────────────────────────────────────────────

export type BatchStatus = "QUARANTINE" | "AVAILABLE" | "EXPIRED" | "BLOCKED";
export type QualityGrade = "A" | "B" | "C" | "REJECT";
export type UnitType = "KG" | "TON";

// ── Master Batch ─────────────────────────────────────────────────

export interface MasterBatchResponse {
  batchId: number;
  batchNumber: string;
  batchDate: string;          // LocalDate → ISO string
  fishSpeciesId: number;
  fishSpeciesName: string;
  totalQuantity: number;
  currentQuantity: number;
  unit: UnitType;
  productionDate: string;     // LocalDate
  expirationDate: string;     // LocalDate
  supplierId: string;         // UUID
  supplierName: string;
  status: BatchStatus;
  qualityGrade: QualityGrade;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface MasterBatchRequest {
  batchNumber: string;
  batchDate: string;
  fishSpeciesId: number;
  totalQuantity: number;
  currentQuantity?: number;
  unit: UnitType;
  productionDate?: string;
  expirationDate?: string;
  supplierId?: string;
  status: BatchStatus;
  qualityGrade?: QualityGrade;
}

// ── Enum option helpers (for dropdowns) ──────────────────────────

export const BATCH_STATUS_OPTIONS = [
  { value: "QUARANTINE", label: "Karantina" },
  { value: "AVAILABLE",  label: "Tersedia" },
  { value: "EXPIRED",    label: "Kadaluarsa" },
  { value: "BLOCKED",    label: "Diblokir" },
];

export const QUALITY_GRADE_OPTIONS = [
  { value: "A",      label: "Grade A" },
  { value: "B",      label: "Grade B" },
  { value: "C",      label: "Grade C" },
  { value: "REJECT", label: "Reject" },
];

export const UNIT_TYPE_OPTIONS = [
  { value: "KG",  label: "Kilogram (Kg)" },
  { value: "TON", label: "Ton" },
];

// ── Traceability ─────────────────────────────────────────────────

export interface TraceabilityNode {
  id: string;
  nodeType: string; // INBOUND_RECEIPT, SALES_ALLOCATION, dll
  referenceNo: string;
  date: string;
  partnerName: string;
  quantityStr: string;
  status: string;
}

export interface BatchEventLog {
  logId: string;
  timestamp: string;
  actionType: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  actorName: string;
}

export interface BatchTraceabilityResponse {
  batchDetails: MasterBatchResponse;
  upstream: TraceabilityNode[];
  downstream: TraceabilityNode[];
  eventLogs: BatchEventLog[];
}
