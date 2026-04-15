import apiClient from "@/lib/api";
import type { ApiResponse } from "@/types";

export type InboundStatus = "DRAFT" | "WEIGHING" | "QC_CHECK" | "COMPLETED";

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
  weighedAt: string;
  weighedBy: string;
};

export type PalletizationBatch = {
  batchId: number;
  batchNumber: string;
  speciesName: string;
  netWeightKg: number;
  grossWeightKg: number;
  tareWeightKg: number;
};

export type PalletizationResponseData = {
  batches: PalletizationBatch[];
};

export async function getInboundReceipts(filters?: {
  status?: InboundStatus | "";
  supplierId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await apiClient.get<ApiResponse<InboundReceiptRow[]>>("/inbound-ikan", {
    params: {
      status: filters?.status || undefined,
      supplierId: filters?.supplierId || undefined,
      startDate: filters?.startDate || undefined,
      endDate: filters?.endDate || undefined,
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

export async function getWeighingLogs(receiptId: string, lineId?: string) {
  const params = lineId ? { lineId } : {};
  const { data } = await apiClient.get<ApiResponse<WeighingLogRow[]>>(`/inbound-ikan/${receiptId}/weighing-log`, { params });
  return data.data ?? [];
}

export async function getWeighingSummary(receiptId: string) {
  const { data } = await apiClient.get<ApiResponse<WeighingSummaryRow[]>>(`/inbound-ikan/${receiptId}/weighing-summary`);
  return data.data ?? [];
}

export async function submitWeighingLog(receiptId: string, payload: { lineId: string; grossWeight: number; tareWeight: number }) {
  const { data } = await apiClient.post<ApiResponse<WeighingLogRow>>(`/inbound-ikan/${receiptId}/weighing-log`, {
    line_id: payload.lineId,
    gross_weight: payload.grossWeight,
    tare_weight: payload.tareWeight,
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

export async function palletize(receiptId: string, lines: { lineId: string; pallets: { grossWeightKg: number; tareWeightKg: number }[] }[]) {
  const { data } = await apiClient.post<ApiResponse<PalletizationResponseData>>(`/inbound-ikan/${receiptId}/palletize`, { lines });
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
