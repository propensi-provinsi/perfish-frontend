/**
 * Fish Master Data — API service layer
 *
 * All functions return the raw AxiosResponse so callers can access
 * `.data.data` (the backend ApiResponse<T>.data field).
 */

import apiClient from "./api";
import type { ApiResponse } from "@/types/api";
import type {
  FishSpeciesResponse,
  FishSpeciesRequest,
  FishFormResponse,
  FishFormRequest,
  FishGradeResponse,
  FishGradeRequest,
  PackagingTypeResponse,
  PackagingTypeRequest,
  FishSkuResponse,
  FishSkuRequest,
} from "@/types/fish";

const BASE = "/v1/master/fish";

// ── Fish Species ──────────────────────────────────────────────────

export const fishSpeciesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<FishSpeciesResponse[]>>(`${BASE}/species`),

  getById: (id: number) =>
    apiClient.get<ApiResponse<FishSpeciesResponse>>(`${BASE}/species/${id}`),

  create: (data: FishSpeciesRequest) =>
    apiClient.post<ApiResponse<FishSpeciesResponse>>(`${BASE}/species`, data),

  update: (id: number, data: FishSpeciesRequest) =>
    apiClient.put<ApiResponse<FishSpeciesResponse>>(`${BASE}/species/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`${BASE}/species/${id}`),
};

// ── Fish Form ─────────────────────────────────────────────────────

export const fishFormApi = {
  getAll: () =>
    apiClient.get<ApiResponse<FishFormResponse[]>>(`${BASE}/forms`),

  getById: (id: number) =>
    apiClient.get<ApiResponse<FishFormResponse>>(`${BASE}/forms/${id}`),

  create: (data: FishFormRequest) =>
    apiClient.post<ApiResponse<FishFormResponse>>(`${BASE}/forms`, data),

  update: (id: number, data: FishFormRequest) =>
    apiClient.put<ApiResponse<FishFormResponse>>(`${BASE}/forms/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`${BASE}/forms/${id}`),
};

// ── Fish Grade ────────────────────────────────────────────────────

export const fishGradeApi = {
  getAll: () =>
    apiClient.get<ApiResponse<FishGradeResponse[]>>(`${BASE}/grades`),

  getById: (id: number) =>
    apiClient.get<ApiResponse<FishGradeResponse>>(`${BASE}/grades/${id}`),

  create: (data: FishGradeRequest) =>
    apiClient.post<ApiResponse<FishGradeResponse>>(`${BASE}/grades`, data),

  update: (id: number, data: FishGradeRequest) =>
    apiClient.put<ApiResponse<FishGradeResponse>>(`${BASE}/grades/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`${BASE}/grades/${id}`),
};

// ── Packaging Type ────────────────────────────────────────────────

export const packagingTypeApi = {
  getAll: () =>
    apiClient.get<ApiResponse<PackagingTypeResponse[]>>(`${BASE}/packaging-types`),

  getById: (id: number) =>
    apiClient.get<ApiResponse<PackagingTypeResponse>>(`${BASE}/packaging-types/${id}`),

  create: (data: PackagingTypeRequest) =>
    apiClient.post<ApiResponse<PackagingTypeResponse>>(`${BASE}/packaging-types`, data),

  update: (id: number, data: PackagingTypeRequest) =>
    apiClient.put<ApiResponse<PackagingTypeResponse>>(`${BASE}/packaging-types/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`${BASE}/packaging-types/${id}`),
};

// ── Fish SKU ──────────────────────────────────────────────────────

export const fishSkuApi = {
  getAll: () =>
    apiClient.get<ApiResponse<FishSkuResponse[]>>(`${BASE}/skus`),

  getById: (id: number) =>
    apiClient.get<ApiResponse<FishSkuResponse>>(`${BASE}/skus/${id}`),

  create: (data: FishSkuRequest) =>
    apiClient.post<ApiResponse<FishSkuResponse>>(`${BASE}/skus`, data),

  update: (id: number, data: FishSkuRequest) =>
    apiClient.put<ApiResponse<FishSkuResponse>>(`${BASE}/skus/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`${BASE}/skus/${id}`),
};
