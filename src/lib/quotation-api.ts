import apiClient from "./api";
import type { ApiResponse } from "@/types/api";
import type {
  QuotationData,
  SalesOrderData,
  CreateQuotationPayload,
  UpdateQuotationStatusPayload,
  RejectQuotationPayload,
  SalesRekapData,
  QuotationStatus,
} from "@/types/quotation";

const BASE = "/v1/quotations";

export const quotationApi = {
  getAll: (status?: QuotationStatus) =>
    apiClient.get<ApiResponse<QuotationData[]>>(BASE, {
      params: status ? { status } : undefined,
    }),

  create: (data: CreateQuotationPayload) =>
    apiClient.post<ApiResponse<QuotationData>>(BASE, data),

  updateStatus: (id: number, data: UpdateQuotationStatusPayload) =>
    apiClient.patch<ApiResponse<QuotationData>>(`${BASE}/${id}/status`, data),

  approve: (id: number) =>
    apiClient.patch<ApiResponse<QuotationData>>(`${BASE}/${id}/approve`),

  reject: (id: number, data: RejectQuotationPayload) =>
    apiClient.patch<ApiResponse<QuotationData>>(`${BASE}/${id}/reject`, data),

  convert: (id: number) =>
    apiClient.post<ApiResponse<SalesOrderData>>(`${BASE}/${id}/convert`),
};

export const salesRekapApi = {
  getRekap: (params?: { start_date?: string; end_date?: string; customer_id?: number }) =>
    apiClient.get<ApiResponse<SalesRekapData[]>>("/v1/sales/rekap", { params }),
};