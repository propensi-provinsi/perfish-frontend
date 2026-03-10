/**
 * Cold Storage Master Data — API service layer
 *
 * All functions return the raw AxiosResponse so callers can access
 * `.data.data` (the backend ApiResponse<T>.data field).
 */

import apiClient from "./api";
import type { ApiResponse } from "@/types/api";
import type {
  BranchResponse,
  BranchRequest,
  ColdStorageResponse,
  ColdStorageRequest,
  StorageBlockResponse,
  StorageBlockRequest,
  StorageRackResponse,
  StorageRackRequest,
  StoragePositionResponse,
  StoragePositionRequest,
} from "@/types/cold-storage";

const BASE = "/v1/master/cold-storage";

// ── Branch ────────────────────────────────────────────────────────

export const branchApi = {
  getAll: () =>
    apiClient.get<ApiResponse<BranchResponse[]>>(`${BASE}/branches`),

  getById: (id: number) =>
    apiClient.get<ApiResponse<BranchResponse>>(`${BASE}/branches/${id}`),

  create: (data: BranchRequest) =>
    apiClient.post<ApiResponse<BranchResponse>>(`${BASE}/branches`, data),

  update: (id: number, data: BranchRequest) =>
    apiClient.put<ApiResponse<BranchResponse>>(`${BASE}/branches/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`${BASE}/branches/${id}`),
};

// ── Cold Storage ──────────────────────────────────────────────────

export const coldStorageApi = {
  getAll: (branchId?: number) =>
    apiClient.get<ApiResponse<ColdStorageResponse[]>>(`${BASE}/storages`, {
      params: branchId ? { branchId } : undefined,
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<ColdStorageResponse>>(`${BASE}/storages/${id}`),

  create: (data: ColdStorageRequest) =>
    apiClient.post<ApiResponse<ColdStorageResponse>>(`${BASE}/storages`, data),

  update: (id: number, data: ColdStorageRequest) =>
    apiClient.put<ApiResponse<ColdStorageResponse>>(`${BASE}/storages/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`${BASE}/storages/${id}`),
};

// ── Storage Block ─────────────────────────────────────────────────

export const storageBlockApi = {
  getAll: (coldStorageId?: number) =>
    apiClient.get<ApiResponse<StorageBlockResponse[]>>(`${BASE}/blocks`, {
      params: coldStorageId ? { coldStorageId } : undefined,
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<StorageBlockResponse>>(`${BASE}/blocks/${id}`),

  create: (data: StorageBlockRequest) =>
    apiClient.post<ApiResponse<StorageBlockResponse>>(`${BASE}/blocks`, data),

  update: (id: number, data: StorageBlockRequest) =>
    apiClient.put<ApiResponse<StorageBlockResponse>>(`${BASE}/blocks/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`${BASE}/blocks/${id}`),
};

// ── Storage Rack ──────────────────────────────────────────────────

export const storageRackApi = {
  getAll: (blockId?: number) =>
    apiClient.get<ApiResponse<StorageRackResponse[]>>(`${BASE}/racks`, {
      params: blockId ? { blockId } : undefined,
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<StorageRackResponse>>(`${BASE}/racks/${id}`),

  create: (data: StorageRackRequest) =>
    apiClient.post<ApiResponse<StorageRackResponse>>(`${BASE}/racks`, data),

  update: (id: number, data: StorageRackRequest) =>
    apiClient.put<ApiResponse<StorageRackResponse>>(`${BASE}/racks/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`${BASE}/racks/${id}`),
};

// ── Storage Position ──────────────────────────────────────────────

export const storagePositionApi = {
  getAll: (rackId?: number) =>
    apiClient.get<ApiResponse<StoragePositionResponse[]>>(`${BASE}/positions`, {
      params: rackId ? { rackId } : undefined,
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<StoragePositionResponse>>(`${BASE}/positions/${id}`),

  create: (data: StoragePositionRequest) =>
    apiClient.post<ApiResponse<StoragePositionResponse>>(`${BASE}/positions`, data),

  update: (id: number, data: StoragePositionRequest) =>
    apiClient.put<ApiResponse<StoragePositionResponse>>(`${BASE}/positions/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`${BASE}/positions/${id}`),
};
