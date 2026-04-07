import apiClient from "./api";
import type { ApiResponse } from "@/types/api";
import type {
  CurrencyResponse,
  CurrencyRequest,
  BankAccountResponse,
  BankAccountRequest,
  TaxResponse,
  TaxRequest,
  PaymentTermResponse,
  PaymentTermRequest,
} from "@/types/sales";

const BASE = "/v1/master";

export const currencyApi = {
  getAll: () => apiClient.get<ApiResponse<CurrencyResponse[]>>(`${BASE}/currencies`),
  create: (data: CurrencyRequest) => apiClient.post<ApiResponse<CurrencyResponse>>(`${BASE}/currencies`, data),
  update: (id: number, data: CurrencyRequest) => apiClient.put<ApiResponse<CurrencyResponse>>(`${BASE}/currencies/${id}`, data),
  delete: (id: number) => apiClient.delete<ApiResponse<void>>(`${BASE}/currencies/${id}`),
};

export const bankAccountApi = {
  getAll: () => apiClient.get<ApiResponse<BankAccountResponse[]>>(`${BASE}/bank-accounts`),
  create: (data: BankAccountRequest) => apiClient.post<ApiResponse<BankAccountResponse>>(`${BASE}/bank-accounts`, data),
  update: (id: number, data: BankAccountRequest) => apiClient.put<ApiResponse<BankAccountResponse>>(`${BASE}/bank-accounts/${id}`, data),
  delete: (id: number) => apiClient.delete<ApiResponse<void>>(`${BASE}/bank-accounts/${id}`),
};

export const taxApi = {
  getAll: () => apiClient.get<ApiResponse<TaxResponse[]>>(`${BASE}/taxes`),
  create: (data: TaxRequest) => apiClient.post<ApiResponse<TaxResponse>>(`${BASE}/taxes`, data),
  update: (id: number, data: TaxRequest) => apiClient.put<ApiResponse<TaxResponse>>(`${BASE}/taxes/${id}`, data),
  delete: (id: number) => apiClient.delete<ApiResponse<void>>(`${BASE}/taxes/${id}`),
};

export const paymentTermApi = {
  getAll: () => apiClient.get<ApiResponse<PaymentTermResponse[]>>(`${BASE}/payment-terms`),
  create: (data: PaymentTermRequest) => apiClient.post<ApiResponse<PaymentTermResponse>>(`${BASE}/payment-terms`, data),
  update: (id: number, data: PaymentTermRequest) => apiClient.put<ApiResponse<PaymentTermResponse>>(`${BASE}/payment-terms/${id}`, data),
  delete: (id: number) => apiClient.delete<ApiResponse<void>>(`${BASE}/payment-terms/${id}`),
};
