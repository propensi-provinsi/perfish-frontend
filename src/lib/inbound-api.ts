import apiClient from "@/lib/api";
import type { ApiResponse } from "@/types";

export type InboundStatus = "DRAFT" | "WEIGHING" | "QC_CHECK" | "IN_PROGRESS" | "PENDING" | "APPROVED" | "REJECTED";

/** Filter ringkas di dashboard (5 kartu status). */
export type InboundStatusFilter = "" | "DRAFT" | "INPUT_IN_PROGRESS" | "PENDING" | "APPROVED" | "REJECTED";

export const INBOUND_INPUT_IN_PROGRESS_STATUSES: InboundStatus[] = ["WEIGHING", "QC_CHECK", "IN_PROGRESS"];

export function isInputInProgressStatus(status: InboundStatus): boolean {
  return INBOUND_INPUT_IN_PROGRESS_STATUSES.includes(status);
}

export function inboundStatusDisplayLabel(status: InboundStatus): string {
  if (status === "DRAFT") return "Draft";
  if (status === "PENDING") return "Waiting for Approval";
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Rejected";
  if (isInputInProgressStatus(status)) return "Input In Progress";
  return status;
}

const STATUS_BADGE_CLS: Record<InboundStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  WEIGHING: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  QC_CHECK: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  IN_PROGRESS: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  PENDING: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

export function inboundStatusBadgeClass(status: InboundStatus): string {
  return STATUS_BADGE_CLS[status] ?? STATUS_BADGE_CLS.DRAFT;
}

/** Perbandingan total net inbound vs total berat PO. */
export type PoReceiveComparison = "UNDER_RECEIVE" | "OK" | "OVER_RECEIVE";

export function comparePoInboundKg(
  orderedKg: number,
  inboundKg: number,
  toleranceRatio = 0.02,
  minToleranceKg = 2,
): PoReceiveComparison | null {
  if (orderedKg <= 0) return null;
  const diff = inboundKg - orderedKg;
  const tol = Math.max(orderedKg * toleranceRatio, minToleranceKg);
  if (diff < -tol) return "UNDER_RECEIVE";
  if (diff > tol) return "OVER_RECEIVE";
  return "OK";
}

export function poReceiveComparisonLabel(status: PoReceiveComparison): string {
  if (status === "UNDER_RECEIVE") return "Under Receive";
  if (status === "OVER_RECEIVE") return "Over Receive";
  return "OK";
}

export function poReceiveComparisonBadgeClass(status: PoReceiveComparison): string {
  if (status === "UNDER_RECEIVE") return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200";
  if (status === "OVER_RECEIVE") return "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200";
  return "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200";
}

export function poReceiveComparisonMessage(status: PoReceiveComparison): string {
  if (status === "UNDER_RECEIVE") {
    return "Total net batch kurang dari total berat PO (under receive).";
  }
  if (status === "OVER_RECEIVE") {
    return "Total net batch melebihi total berat PO (over receive).";
  }
  return "Total net batch selaras dengan total berat PO (dalam toleransi).";
}

export type InboundLineRow = {
  id: string;
  speciesId: number;
  speciesCode: string;
  speciesName: string;
  size: string;
  bentuk: string;
  formId: number | null;
  resolvedSkuId: number | null;
  resolvedSkuCode: string | null;
  qcGradeId: number | null;
  qcGrade: string | null;
  qcTotalBeratKg: number | string | null;
  rejectedWeight: number | string | null;
  rejectReasonId: number | null;
  acceptedWeightKg: number | string | null;
  qcSuhuPenerimaan: number | string | null;
  qcSuhuSesuaiStandar: boolean | null;
};

export type InboundReceiptRow = {
  id: string;
  batchCode: string;
  status: InboundStatus;
  supplierId?: string;
  supplierName: string;
  coldStorageLabel: string;
  tanggalPenerimaan: string;
  quantityKg?: number | null;
  poId?: number | null;
  poCode?: string | null;
  supplierDeliveryNote?: string | null;
  temperatureC?: number | null;
  createdAt: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  rejectedReason?: string | null;
  palletized?: boolean;
  lines: InboundLineRow[];
};

export type PurchaseOrderDetailRow = {
  poDetailId: number;
  fishSkuId: number | null;
  fishSkuCode: string | null;
  speciesId: number | null;
  speciesCode: string | null;
  speciesName: string | null;
  formId: number | null;
  formCode: string | null;
  formName: string | null;
  itemSize: string | null;
  orderedWeightKg: number | null;
};

export type PurchaseOrderRow = {
  poId: number;
  poCode: string;
  supplierId: string;
  supplierName: string;
  expectedArrivalDate: string;
  status: string;
  details: PurchaseOrderDetailRow[];
};

export type WeighingSummaryRow = {
  lineId: string;
  speciesId: number;
  speciesCode: string;
  speciesName: string;
  size: string;
  bentuk: string;
  basketCount: number;
  totalNetWeightKg: number | string;
};

export type WeighingLogRow = {
  id: string;
  inboundReceiptId: string;
  lineId: string;
  speciesName: string;
  basketNo: number;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  fishSkuId?: number | null;
  fishSkuCode?: string | null;
  gradeId?: number | null;
  gradeCode?: string | null;
  suhuPenerimaan?: number | string | null;
  itemSize?: string | null;
  isRejectBasket?: boolean | null;
  rejectedWeightKg?: number | string | null;
  rejectReasonId?: number | null;
  rejectReasonNote?: string | null;
  qcSuhuSesuaiStandar?: boolean | null;
  weighedAt: string;
  weighedBy: string;
};

export type BatchBasketAllocation = {
  weighingLogId: string;
  netKg: number;
};

export type PalletizationBatch = {
  batchId: number;
  batchNumber: string;
  speciesName: string;
  netWeightKg: number;
  grossWeightKg: number | null;
  tareWeightKg: number | null;
  kandangMacanCode?: string | null;
  fishSkuId?: number | null;
  fishSkuCode?: string | null;
  /** Grade QC / dari SKU mayoritas (mis. A, B, REJECT) */
  qualityGrade?: string | null;
  /** Batch dari basket reject (Sizing & Grading), terpisah dari kode grade SKU */
  inboundRejectBatch?: boolean | null;
  /** Basket referensi untuk memuat ulang form paletisasi */
  weighingLogId?: string | null;
  /** Alokasi per basket (kg) */
  basketAllocations?: BatchBasketAllocation[];
};

export type PalletizationResponseData = {
  batches: PalletizationBatch[];
};

export async function getInboundReceipts(filters?: {
  status?: InboundStatus | "";
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  receiptCode?: string;
  poCode?: string;
}) {
  const { data } = await apiClient.get<ApiResponse<InboundReceiptRow[]>>("/inbound-ikan", {
    params: {
      status: filters?.status || undefined,
      supplierId: filters?.supplierId || undefined,
      startDate: filters?.startDate || undefined,
      endDate: filters?.endDate || undefined,
      receiptCode: filters?.receiptCode?.trim() || undefined,
      poCode: filters?.poCode?.trim() || undefined,
    },
  });
  return data.data ?? [];
}

export async function getInboundReceipt(id: string) {
  const { data } = await apiClient.get<ApiResponse<InboundReceiptRow>>(`/inbound-ikan/${id}`);
  return data.data;
}

export async function getOpenPurchaseOrders() {
  const { data } = await apiClient.get<ApiResponse<PurchaseOrderRow[]>>("/inbound-ikan/purchase-orders");
  return data.data ?? [];
}

export async function finishWeighing(id: string) {
  return apiClient.patch(`/inbound-ikan/${id}/finish-weighing`);
}

export async function reopenWeighing(id: string) {
  const { data } = await apiClient.patch<ApiResponse<InboundReceiptRow>>(`/inbound-ikan/${id}/reopen-weighing`);
  return data.data;
}

export async function updateWeighingLog(
  receiptId: string,
  logId: string,
  payload: {
    lineId: string;
    grossWeight: number;
    tareWeight: number;
    gradeId: number;
    suhuPenerimaan: number;
    itemSize: string;
    isRejectBasket: boolean;
    rejectReasonNote?: string | null;
  }
) {
  const { data } = await apiClient.put<ApiResponse<WeighingLogRow>>(`/inbound-ikan/${receiptId}/weighing-log/${logId}`, {
    line_id: payload.lineId,
    gross_weight: payload.grossWeight,
    tare_weight: payload.tareWeight,
    grade_id: payload.gradeId,
    suhu_penerimaan: payload.suhuPenerimaan,
    item_size: payload.itemSize.trim(),
    is_reject_basket: payload.isRejectBasket,
    reject_reason_note: payload.isRejectBasket ? (payload.rejectReasonNote?.trim() || null) : null,
  });
  return data.data;
}

export async function deleteWeighingLog(receiptId: string, logId: string) {
  await apiClient.delete(`/inbound-ikan/${receiptId}/weighing-log/${logId}`);
}

export async function getWeighingLogs(receiptId: string, lineId?: string) {
  const params = lineId ? { lineId } : {};
  const { data } = await apiClient.get<ApiResponse<WeighingLogRow[]>>(`/inbound-ikan/${receiptId}/weighing-log`, { params });
  return data.data ?? [];
}

export async function getWeighingSummary(receiptId: string) {
  const { data } = await apiClient.get<ApiResponse<WeighingSummaryRow[]>>(`/inbound-ikan/${receiptId}/weighing-summary`);
  return data.data ?? [];
}

export async function submitWeighingLog(
  receiptId: string,
  payload: {
    lineId: string;
    grossWeight: number;
    tareWeight: number;
    gradeId: number;
    suhuPenerimaan: number;
    itemSize: string;
    isRejectBasket: boolean;
    rejectReasonNote?: string | null;
  }
) {
  const { data } = await apiClient.post<ApiResponse<WeighingLogRow>>(`/inbound-ikan/${receiptId}/weighing-log`, {
    line_id: payload.lineId,
    gross_weight: payload.grossWeight,
    tare_weight: payload.tareWeight,
    grade_id: payload.gradeId,
    suhu_penerimaan: payload.suhuPenerimaan,
    item_size: payload.itemSize.trim(),
    is_reject_basket: payload.isRejectBasket,
    reject_reason_note: payload.isRejectBasket ? (payload.rejectReasonNote?.trim() || null) : null,
  });
  return data.data;
}

export async function submitQcInspection(receiptId: string, barisQc: { lineId: string; gradeId: number; suhuPenerimaan: number; rejectedWeight?: number; rejectReasonId?: number | null }[]) {
  const { data } = await apiClient.post<ApiResponse<InboundReceiptRow>>(`/inbound-ikan/${receiptId}/qc`, {
    barisQc: barisQc.map((q) => ({
      lineId: q.lineId,
      gradeId: q.gradeId,
      suhuPenerimaan: q.suhuPenerimaan,
      rejectedWeight: q.rejectedWeight ?? 0,
      rejectReasonId: q.rejectReasonId ?? null,
    })),
  });
  return data.data;
}

export type KandangMacanPalletizePayload = {
  /** Opsional — identitas utama stok memakai nomor batch sistem. */
  code?: string | null;
  pallet_gross_weight_kg: number;
  pallet_tare_weight_kg: number;
  /** Alokasi parsial (kg) per basket; diprioritaskan oleh backend */
  basket_allocations?: { weighing_log_id: string; net_kg: number }[];
  /** Legacy: seluruh net basket masuk satu kandang */
  weighing_log_ids?: string[];
};

export async function palletize(
  receiptId: string,
  body:
    | { lines: { lineId: string; pallets: { grossWeightKg: number; tareWeightKg: number }[] }[] }
    | { kandang_macan: KandangMacanPalletizePayload[] }
) {
  const { data } = await apiClient.post<ApiResponse<PalletizationResponseData>>(`/inbound-ikan/${receiptId}/palletize`, body);
  return data.data;
}

export async function addLineToReceipt(receiptId: string, payload: {
  jenisIkan: number;
  size: string;
  bentuk: string;
  formId?: number | null;
}) {
  const { data } = await apiClient.post<ApiResponse<InboundReceiptRow>>(`/inbound-ikan/${receiptId}/add-line`, {
    jenis_ikan: payload.jenisIkan,
    size: payload.size,
    bentuk: payload.bentuk,
    form_id: payload.formId ?? null,
  });
  return data.data;
}

export async function getAllPurchaseOrders() {
  const { data } = await apiClient.get<ApiResponse<PurchaseOrderRow[]>>("/inbound-ikan/purchase-orders/all");
  return data.data ?? [];
}

export async function getPurchaseOrder(poId: number) {
  const { data } = await apiClient.get<ApiResponse<PurchaseOrderRow>>(`/inbound-ikan/purchase-orders/${poId}`);
  return data.data;
}

export async function getReceiptBatches(receiptId: string) {
  const { data } = await apiClient.get<ApiResponse<PalletizationBatch[]>>(`/inbound-ikan/${receiptId}/batches`);
  return data.data ?? [];
}

export async function createPurchaseOrder(payload: {
  supplierId: string;
  expectedArrivalDate: string;
  lines: {
    speciesId: number;
    formId?: number | null;
    itemSize?: string;
    orderedWeightKg?: number | null;
  }[];
}) {
  const { data } = await apiClient.post<ApiResponse<PurchaseOrderRow>>("/inbound-ikan/purchase-orders", payload);
  return data.data;
}

export async function updatePurchaseOrder(poId: number, payload: {
  supplierId: string;
  expectedArrivalDate: string;
  lines: {
    speciesId: number;
    formId?: number | null;
    itemSize?: string;
    orderedWeightKg?: number | null;
  }[];
}) {
  const { data } = await apiClient.put<ApiResponse<PurchaseOrderRow>>(`/inbound-ikan/purchase-orders/${poId}`, payload);
  return data.data;
}

export async function deletePurchaseOrder(poId: number) {
  await apiClient.delete(`/inbound-ikan/purchase-orders/${poId}`);
}

export async function lockPurchaseOrder(poId: number) {
  const { data } = await apiClient.post<ApiResponse<PurchaseOrderRow>>(`/inbound-ikan/purchase-orders/${poId}/lock`);
  return data.data;
}

export async function submitForApproval(id: string) {
  const { data } = await apiClient.patch<ApiResponse<InboundReceiptRow>>(`/inbound-ikan/${id}/submit-for-approval`);
  return data.data;
}

export async function approveInbound(id: string) {
  const { data } = await apiClient.patch<ApiResponse<InboundReceiptRow>>(`/inbound-ikan/${id}/approve`);
  return data.data;
}

export async function rejectInbound(id: string, reason: string) {
  const { data } = await apiClient.patch<ApiResponse<InboundReceiptRow>>(`/inbound-ikan/${id}/reject`, { reason });
  return data.data;
}
