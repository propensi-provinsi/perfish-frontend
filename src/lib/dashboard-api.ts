import apiClient from "@/lib/api";
import type { ApiResponse } from "@/types";

export type AnalyticsPayload = Record<string, unknown>;

function cleanParams<T extends object>(params: T) {
  return Object.fromEntries(
    Object.entries(params as Record<string, unknown>).filter(([, value]) => value !== undefined && value !== "")
  );
}

async function getData(path: string, params?: Record<string, unknown>) {
  const { data } = await apiClient.get<ApiResponse<AnalyticsPayload>>(path, {
    params: cleanParams(params ?? {}),
  });
  return data.data;
}

export const dashboardApi = {
  stockSummary: (params?: { coldStorageId?: number; area?: string; storageType?: string }) =>
    getData("/v1/dashboard/stock/summary", params),

  stockBreakdown: (params?: {
    groupBy?: string;
    coldStorageId?: number;
    area?: string;
    storageType?: string;
    speciesId?: number;
    size?: string;
    quality?: string;
    productForm?: string;
  }) => getData("/v1/dashboard/stock/breakdown", params),

  stockBatchDetail: (params?: {
    coldStorageId?: number;
    area?: string;
    storageType?: string;
    speciesId?: number;
    size?: string;
    quality?: string;
    productForm?: string;
    keyword?: string;
  }) => getData("/v1/dashboard/stock/batch-detail", params),

  dailySummary: (params?: { date?: string }) => getData("/v1/dashboard/daily-summary", params),

  dailySummaryTrend: (params?: { from?: string; to?: string }) =>
    getData("/v1/dashboard/daily-summary/trend", params),

  aging: (params?: { coldStorageId?: number; speciesId?: number; thresholdDays?: number }) =>
    getData("/v1/dashboard/aging", params),

  agingCritical: (params?: { coldStorageId?: number; speciesId?: number; thresholdDays?: number }) =>
    getData("/v1/dashboard/aging/critical", params),

  coldStorageUtilization: () => getData("/v1/dashboard/cold-storage/utilization"),

  coldStorageUtilizationTrend: (params?: { from?: string; to?: string }) =>
    getData("/v1/dashboard/cold-storage/utilization/trend", params),

  meetingSummary: (params?: { period?: "weekly" | "monthly" }) =>
    getData("/v1/dashboard/meeting-summary", params),

  meetingSummaryDivision: (divisionCode: string) =>
    getData(`/v1/dashboard/meeting-summary/division/${encodeURIComponent(divisionCode)}`),

  executive: (params?: { period?: string; from?: string; to?: string }) =>
    getData("/v1/dashboard/executive", params),

  executiveAlerts: () => getData("/v1/dashboard/executive/alerts"),
};

export const reportApi = {
  soFulfillment: (params?: {
    from?: string;
    to?: string;
    buyer?: string;
    fish?: string;
    destination?: string;
    status?: string;
  }) => getData("/v1/report/so-fulfillment", params),

  distribution: (params?: {
    from?: string;
    to?: string;
    buyer?: string;
    fish?: string;
    destination?: string;
    status?: string;
  }) => getData("/v1/report/distribution", params),

  export: (params?: { from?: string; to?: string; country?: string }) =>
    getData("/v1/report/export", params),

  certificationSummary: () => getData("/v1/report/certification/summary"),

  weightDiscrepancy: (params?: {
    from?: string;
    to?: string;
    speciesId?: number;
    threshold?: number;
  }) => getData("/v1/report/weight-discrepancy", params),

  weightDiscrepancyTrend: (params?: { from?: string; to?: string; threshold?: number }) =>
    getData("/v1/report/weight-discrepancy/trend", params),
};
