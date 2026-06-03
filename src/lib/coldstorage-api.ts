/**
 * Cold Storage Business Flow — API service untuk E05-PBI-01/02/03/05.
 *
 * Lihat backend: `com.perfish.backend.coldstorage.controller.ColdStorageController`.
 */

import apiClient from "./api";
import type { ApiResponse } from "@/types/api";
import type { PagedResponse } from "@/types/report";
import type {
  AssignLocationContextResponse,
  AssignLocationRequest,
  AssignLocationResponse,
  BatchDetailResponse,
  BatchHistoryResponse,
  BatchMergePayload,
  BatchMergeResponseData,
  ColdStorageApprovalRequest,
  ColdStorageStockRow,
  ColdStorageStructureDetail,
  ColdStorageStructureSummary,
  DisposalResponse,
  MoveBatchRequest,
  MoveBatchResponse,
  StorageAreaOption,
  StockCategoryStatus,
  StockOpnameCreatePayload,
  StockOpnameLinesUpdatePayload,
  StockOpnameSessionResponse,
  LoadingBayBatchRow,
} from "@/types/coldstorage";

const BASE = "/v1/coldstorage";

export const COLD_STORAGE_PENDING_APPROVAL_MSG =
  "Permintaan dikirim, menunggu persetujuan Warehouse Admin";

export type ColdStorageMutationResult<T> =
  | { status: "pending"; message: string }
  | { status: "ok"; data: T };

function unwrap<T>(resp: { data: ApiResponse<T> }) {
  return resp.data.data;
}

function mutationResult<T>(resp: {
  status: number;
  data: ApiResponse<T>;
}): ColdStorageMutationResult<T> {
  if (resp.status === 202) {
    return {
      status: "pending",
      message: resp.data.message ?? COLD_STORAGE_PENDING_APPROVAL_MSG,
    };
  }
  return { status: "ok", data: resp.data.data };
}

export async function listLoadingBayBatches(search = "") {
  const resp = await apiClient.get<ApiResponse<LoadingBayBatchRow[]>>(
    `${BASE}/assignable-batches`,
    { params: search ? { search } : undefined }
  );
  return unwrap(resp);
}

export async function assignLocation(payload: AssignLocationRequest) {
  const resp = await apiClient.post<ApiResponse<AssignLocationResponse>>(
    `${BASE}/assign-location`,
    payload
  );
  return unwrap(resp);
}

export async function listActiveLocations(warehouseId?: number) {
  const resp = await apiClient.get<ApiResponse<AssignLocationResponse[]>>(
    `${BASE}/locations`,
    { params: warehouseId ? { warehouseId } : undefined }
  );
  return unwrap(resp);
}

export async function listStorageAreaOptions(warehouseId: number, batchId?: number) {
  const resp = await apiClient.get<ApiResponse<StorageAreaOption[]>>(
    `${BASE}/storage-areas`,
    {
      params: {
        warehouseId,
        ...(batchId !== undefined && batchId !== null ? { batchId } : {}),
      },
    }
  );
  return unwrap(resp);
}

export async function getAssignLocationContext(batchId: number) {
  const resp = await apiClient.get<ApiResponse<AssignLocationContextResponse>>(
    `${BASE}/batches/${batchId}/assign-context`
  );
  return unwrap(resp);
}

export async function listColdStorageStocks(params?: {
  warehouseId?: number;
  kategoriStatus?: StockCategoryStatus;
}) {
  const queryParams: Record<string, number | StockCategoryStatus> = {};

  if (params?.warehouseId !== undefined) {
    queryParams.warehouseId = params.warehouseId;
  }

  if (params?.kategoriStatus !== undefined) {
    queryParams.kategoriStatus = params.kategoriStatus;
  }

  const resp = await apiClient.get<ApiResponse<ColdStorageStockRow[]>>(
    `${BASE}/stocks`,
    {
      params: queryParams,
    }
  );
  return unwrap(resp);
}

/** Disposal wajib menyertakan Berita Acara Pemusnahan (multipart). */
export async function disposeBatchMultipart(params: {
  batchId: number;
  jumlahDibuang: number | string;
  alasan: string;
  beritaAcara: File;
}) {
  const form = new FormData();
  form.append("batchId", String(params.batchId));
  form.append("jumlahDibuang", String(params.jumlahDibuang));
  form.append("alasan", params.alasan);
  form.append("beritaAcara", params.beritaAcara);
  const resp = await apiClient.post<ApiResponse<DisposalResponse>>(`${BASE}/disposal`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    validateStatus: (s) => (s >= 200 && s < 300) || s === 202,
  });
  return mutationResult(resp);
}

/** Unduh file BAP yang tersimpan untuk disposal (blob + nama file dari header). */
export async function downloadDisposalBeritaAcara(disposalId: number) {
  const resp = await apiClient.get<Blob>(`${BASE}/disposals/${disposalId}/berita-acara`, {
    responseType: "blob",
  });
  const cd = resp.headers["content-disposition"] as string | undefined;
  let filename = `berita-acara-${disposalId}`;
  if (cd) {
    const m = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i) ?? cd.match(/filename="([^"]+)"/);
    if (m?.[1]) filename = decodeURIComponent(m[1].trim());
  }
  return { blob: resp.data, filename };
}

export async function listDisposalHistory(batchId?: number) {
  const resp = await apiClient.get<ApiResponse<DisposalResponse[]>>(
    `${BASE}/disposals`,
    { params: batchId ? { batchId } : undefined }
  );
  return unwrap(resp);
}

export async function listDisposalHistoryPaged(page = 0, size = 5, batchId?: number) {
  const resp = await apiClient.get<ApiResponse<PagedResponse<DisposalResponse>>>(`${BASE}/disposals`, {
    params: { paged: true, page, size, batchId: batchId ?? undefined },
  });
  return unwrap(resp);
}

export async function moveBatch(payload: MoveBatchRequest) {
  const resp = await apiClient.post<ApiResponse<MoveBatchResponse>>(`${BASE}/move`, payload, {
    validateStatus: (s) => (s >= 200 && s < 300) || s === 202,
  });
  return mutationResult(resp);
}

export async function listBatchesWithMovementHistory() {
  const resp = await apiClient.get<
    ApiResponse<{ batchId: number; batchNumber: string; fishSpeciesName?: string | null; status?: string }[]>
  >(`${BASE}/batches-with-movement-history`);
  return unwrap(resp);
}

export async function listBatchMoveHistory(batchId: number) {
  const resp = await apiClient.get<ApiResponse<AssignLocationResponse[]>>(
    `${BASE}/batches/${batchId}/move-history`
  );
  return unwrap(resp);
}

export async function getBatchHistory(batchId: number) {
  const resp = await apiClient.get<ApiResponse<BatchHistoryResponse>>(
    `${BASE}/batch/${batchId}/history`
  );
  return unwrap(resp);
}

export async function getBatchDetailById(batchId: number) {
  const resp = await apiClient.get<ApiResponse<BatchDetailResponse>>(
    `${BASE}/batches/${batchId}/detail`
  );
  return unwrap(resp);
}

export async function getBatchDetailByNumber(batchNumber: string) {
  const encoded = encodeURIComponent(batchNumber.trim());
  const resp = await apiClient.get<ApiResponse<BatchDetailResponse>>(
    `${BASE}/batches/by-number/${encoded}/detail`
  );
  return unwrap(resp);
}

export async function listColdStorageStructureSummaries() {
  const resp = await apiClient.get<ApiResponse<ColdStorageStructureSummary[]>>(
    `${BASE}/structure`
  );
  return unwrap(resp);
}

export async function getColdStorageStructureDetail(coldStorageId: number) {
  const resp = await apiClient.get<ApiResponse<ColdStorageStructureDetail>>(
    `${BASE}/structure/${coldStorageId}`
  );
  return unwrap(resp);
}

export async function listStockOpnameSessions(coldStorageId?: number) {
  const resp = await apiClient.get<ApiResponse<StockOpnameSessionResponse[]>>(
    `${BASE}/stock-opname/sessions`,
    { params: coldStorageId != null ? { coldStorageId } : undefined }
  );
  return unwrap(resp);
}

export async function getStockOpnameSession(sessionId: number) {
  const resp = await apiClient.get<ApiResponse<StockOpnameSessionResponse>>(
    `${BASE}/stock-opname/sessions/${sessionId}`
  );
  return unwrap(resp);
}

export async function createStockOpnameSession(payload: StockOpnameCreatePayload) {
  const resp = await apiClient.post<ApiResponse<StockOpnameSessionResponse>>(
    `${BASE}/stock-opname/sessions`,
    payload
  );
  return unwrap(resp);
}

export async function updateStockOpnameLines(sessionId: number, payload: StockOpnameLinesUpdatePayload) {
  const resp = await apiClient.patch<ApiResponse<StockOpnameSessionResponse>>(
    `${BASE}/stock-opname/sessions/${sessionId}/lines`,
    payload
  );
  return unwrap(resp);
}

export async function finalizeStockOpnameSession(sessionId: number) {
  const resp = await apiClient.post<ApiResponse<StockOpnameSessionResponse>>(
    `${BASE}/stock-opname/sessions/${sessionId}/finalize`,
    undefined,
    { validateStatus: (s) => (s >= 200 && s < 300) || s === 202 }
  );
  return mutationResult(resp);
}

export async function deleteStockOpnameSession(sessionId: number) {
  await apiClient.delete(`${BASE}/stock-opname/sessions/${sessionId}`);
}

export async function mergeColdStorageBatches(payload: BatchMergePayload) {
  const resp = await apiClient.post<ApiResponse<BatchMergeResponseData>>(`${BASE}/batch-merge`, payload, {
    validateStatus: (s) => (s >= 200 && s < 300) || s === 202,
  });
  return mutationResult(resp);
}

export async function downloadPendingApprovalBeritaAcara(requestId: string) {
  const resp = await apiClient.get<Blob>(`${BASE}/approval-requests/${requestId}/berita-acara`, {
    responseType: "blob",
  });
  const cd = resp.headers["content-disposition"] as string | undefined;
  let filename = `berita-acara-pending-${requestId}`;
  if (cd) {
    const m = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i) ?? cd.match(/filename="([^"]+)"/);
    if (m?.[1]) filename = decodeURIComponent(m[1].trim());
  }
  return { blob: resp.data, filename };
}

export async function listPendingColdStorageApprovals() {
  const resp = await apiClient.get<ApiResponse<ColdStorageApprovalRequest[]>>(
    `${BASE}/approval-requests/pending`
  );
  return unwrap(resp);
}

export async function approveColdStorageRequest(requestId: string, note?: string) {
  const resp = await apiClient.post<ApiResponse<ColdStorageApprovalRequest>>(
    `${BASE}/approval-requests/${requestId}/approve`,
    null,
    { params: note ? { note } : undefined }
  );
  return unwrap(resp);
}

export async function rejectColdStorageRequest(requestId: string, note?: string) {
  const resp = await apiClient.post<ApiResponse<ColdStorageApprovalRequest>>(
    `${BASE}/approval-requests/${requestId}/reject`,
    null,
    { params: note ? { note } : undefined }
  );
  return unwrap(resp);
}
