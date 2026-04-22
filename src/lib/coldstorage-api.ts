/**
 * Cold Storage Business Flow — API service untuk E05-PBI-01/02/03/05.
 *
 * Lihat backend: `com.perfish.backend.coldstorage.controller.ColdStorageController`.
 */

import apiClient from "./api";
import type { ApiResponse } from "@/types/api";
import type {
  AssignLocationContextResponse,
  AssignLocationRequest,
  AssignLocationResponse,
  BatchHistoryResponse,
  ColdStorageStockRow,
  ColdStorageStructureDetail,
  ColdStorageStructureSummary,
  DisposalRequest,
  DisposalResponse,
  MoveBatchRequest,
  MoveBatchResponse,
  StorageAreaOption,
  StockCategoryStatus,
} from "@/types/coldstorage";

const BASE = "/v1/coldstorage";

function unwrap<T>(resp: { data: ApiResponse<T> }) {
  return resp.data.data;
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
  const resp = await apiClient.get<ApiResponse<ColdStorageStockRow[]>>(
    `${BASE}/stocks`,
    {
      params: Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== "")
      ),
    }
  );
  return unwrap(resp);
}

export async function disposeBatch(payload: DisposalRequest) {
  const resp = await apiClient.post<ApiResponse<DisposalResponse>>(
    `${BASE}/disposal`,
    payload
  );
  return unwrap(resp);
}

export async function listDisposalHistory(batchId?: number) {
  const resp = await apiClient.get<ApiResponse<DisposalResponse[]>>(
    `${BASE}/disposals`,
    { params: batchId ? { batchId } : undefined }
  );
  return unwrap(resp);
}

export async function moveBatch(payload: MoveBatchRequest) {
  const resp = await apiClient.post<ApiResponse<MoveBatchResponse>>(
    "/storage/move",
    payload
  );
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
