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
import type { PagedResponse } from "@/types/report";

const BASE = "/v1/quotations";

export const quotationApi = {
  /**
   * List paginated + search — dipakai halaman list quotation.
   */
  getPaged: (params: {
    status?: QuotationStatus | "";
    search?: string;
    page?: number;
    size?: number;
  }) =>
    apiClient.get<ApiResponse<PagedResponse<QuotationData>>>(BASE, {
      params: {
        paged: true,
        status: params.status || undefined,
        search: params.search || undefined,
        page:   params.page ?? 0,
        size:   params.size ?? 10,
      },
    }),

  /**
   * List tanpa pagination — dipakai internal (report, dll).
   */
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

  downloadPdf: (id: number) =>
    apiClient.get<Blob>(`${BASE}/${id}/download`, { responseType: 'blob' }),
};

export const salesRekapApi = {
  getRekap: (params?: { start_date?: string; end_date?: string; customer_id?: number }) =>
    apiClient.get<ApiResponse<SalesRekapData[]>>("/v1/sales/rekap", { params }),
};