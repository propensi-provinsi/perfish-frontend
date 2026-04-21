/**
 * Cold Storage Business Flow — API service untuk E05-PBI-01/02/03/05.
 *
 * Lihat backend: `com.perfish.backend.coldstorage.controller.ColdStorageController`.
 */

import apiClient from "./api";
import type { ApiResponse } from "@/types/api";
import type {
  AssignLocationRequest,
  AssignLocationResponse,
  ColdStorageStockRow,
  DisposalRequest,
  DisposalResponse,
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
