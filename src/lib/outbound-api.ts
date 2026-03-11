/**
 * Outbound Master Data — API service layer
 *
 * All functions return the raw AxiosResponse so callers can access
 * `.data.data` (the backend ApiResponse<T>.data field).
 */

import apiClient from "./api";
import type { ApiResponse } from "@/types/api";
import type {
  OutboundTypeResponse,
  OutboundTypeRequest,
  TransportModeResponse,
  TransportModeRequest,
  PortResponse,
  PortRequest,
  ExportDocumentResponse,
  ExportDocumentRequest,
  OutboundChannelResponse,
  OutboundChannelRequest,
} from "@/types/outbound";

const BASE = "/v1/master/outbound";

// ── Outbound Type ─────────────────────────────────────────────────

export const outboundTypeApi = {
  getAll: () =>
    apiClient.get<ApiResponse<OutboundTypeResponse[]>>(`${BASE}/types`),

  getById: (id: number) =>
    apiClient.get<ApiResponse<OutboundTypeResponse>>(`${BASE}/types/${id}`),

  create: (data: OutboundTypeRequest) =>
    apiClient.post<ApiResponse<OutboundTypeResponse>>(`${BASE}/types`, data),

  update: (id: number, data: OutboundTypeRequest) =>
    apiClient.put<ApiResponse<OutboundTypeResponse>>(`${BASE}/types/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`${BASE}/types/${id}`),
};

// ── Transport Mode ────────────────────────────────────────────────

export const transportModeApi = {
  getAll: () =>
    apiClient.get<ApiResponse<TransportModeResponse[]>>(`${BASE}/transport-modes`),

  getById: (id: number) =>
    apiClient.get<ApiResponse<TransportModeResponse>>(`${BASE}/transport-modes/${id}`),

  create: (data: TransportModeRequest) =>
    apiClient.post<ApiResponse<TransportModeResponse>>(`${BASE}/transport-modes`, data),

  update: (id: number, data: TransportModeRequest) =>
    apiClient.put<ApiResponse<TransportModeResponse>>(`${BASE}/transport-modes/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`${BASE}/transport-modes/${id}`),
};

// ── Port ──────────────────────────────────────────────────────────

export const portApi = {
  getAll: (country?: string) =>
    apiClient.get<ApiResponse<PortResponse[]>>(`${BASE}/ports`, {
      params: country ? { country } : undefined,
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<PortResponse>>(`${BASE}/ports/${id}`),

  create: (data: PortRequest) =>
    apiClient.post<ApiResponse<PortResponse>>(`${BASE}/ports`, data),

  update: (id: number, data: PortRequest) =>
    apiClient.put<ApiResponse<PortResponse>>(`${BASE}/ports/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`${BASE}/ports/${id}`),
};

// ── Export Document ───────────────────────────────────────────────

export const exportDocumentApi = {
  getAll: () =>
    apiClient.get<ApiResponse<ExportDocumentResponse[]>>(`${BASE}/export-documents`),

  getById: (id: number) =>
    apiClient.get<ApiResponse<ExportDocumentResponse>>(`${BASE}/export-documents/${id}`),

  create: (data: ExportDocumentRequest) =>
    apiClient.post<ApiResponse<ExportDocumentResponse>>(`${BASE}/export-documents`, data),

  update: (id: number, data: ExportDocumentRequest) =>
    apiClient.put<ApiResponse<ExportDocumentResponse>>(`${BASE}/export-documents/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`${BASE}/export-documents/${id}`),
};

// ── Outbound Channel ──────────────────────────────────────────────

export const outboundChannelApi = {
  getAll: (outboundTypeId?: number) =>
    apiClient.get<ApiResponse<OutboundChannelResponse[]>>(`${BASE}/channels`, {
      params: outboundTypeId ? { outboundTypeId } : undefined,
    }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<OutboundChannelResponse>>(`${BASE}/channels/${id}`),

  create: (data: OutboundChannelRequest) =>
    apiClient.post<ApiResponse<OutboundChannelResponse>>(`${BASE}/channels`, data),

  update: (id: number, data: OutboundChannelRequest) =>
    apiClient.put<ApiResponse<OutboundChannelResponse>>(`${BASE}/channels/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`${BASE}/channels/${id}`),
};
