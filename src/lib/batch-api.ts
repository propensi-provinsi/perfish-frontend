/**
 * Batch Management — API service layer
 *
 * Endpoints match:
 *   MasterBatchController  → /v1/batch/master-batches
 */

import apiClient from "./api";
import type { ApiResponse } from "@/types/api";
import type { MasterBatchResponse, MasterBatchRequest } from "@/types/batch";

const BASE = "/v1/batch/master-batches";

// ── Master Batch ─────────────────────────────────────────────────

export const masterBatchApi = {
  getAll: (search?: string) =>
    apiClient.get<ApiResponse<MasterBatchResponse[]>>(BASE, {
      params: search ? { search } : undefined,
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<MasterBatchResponse>>(`${BASE}/${id}`),

  create: (data: MasterBatchRequest) =>
    apiClient.post<ApiResponse<MasterBatchResponse>>(BASE, data),

  update: (id: number, data: MasterBatchRequest) =>
    apiClient.put<ApiResponse<MasterBatchResponse>>(`${BASE}/${id}`, data),

  getTraceability: (id: number) =>
    apiClient.get<ApiResponse<import("@/types/batch").BatchTraceabilityResponse>>(`${BASE}/${id}/traceability`),
};
