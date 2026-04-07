import apiClient from "./api";
import type { ApiResponse } from "@/types/api";
import type { SupplierData, CreateSupplierPayload } from "@/types/supplier";

const BASE = "/v1/suppliers";

export const supplierApi = {
  getAll: () => apiClient.get<ApiResponse<SupplierData[]>>(`${BASE}`),
  getActive: () => apiClient.get<ApiResponse<SupplierData[]>>(`${BASE}/active`),
  getById: (id: string) => apiClient.get<ApiResponse<SupplierData>>(`${BASE}/${id}`),
  create: (data: CreateSupplierPayload) => apiClient.post<ApiResponse<SupplierData>>(`${BASE}`, data),
  updateStatus: (id: string, active: boolean) => apiClient.patch<ApiResponse<SupplierData>>(`${BASE}/${id}`, { active }),
};
