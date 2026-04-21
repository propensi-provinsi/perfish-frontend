import apiClient from "@/lib/api";
import type { ApiResponse } from "@/types";
import type {
  GenerateReportRequest,
  GenerateReportResponse,
  ReportHistoryItem,
  ReportTypeInfo,
  ReportFormat,
  ReportType,
  PagedResponse,
} from "@/types/report";

const BASE = "/v1/reports";

export const reportApi = {
  /**
   * GET /v1/reports/types
   * Daftar jenis laporan yang diizinkan untuk role user yang sedang login.
   */
  getTypes: () =>
    apiClient.get<ApiResponse<ReportTypeInfo[]>>(`${BASE}/types`),

  /**
   * POST /v1/reports/generate
   * Generate laporan PDF atau Excel.
   */
  generate: (data: GenerateReportRequest) =>
    apiClient.post<ApiResponse<GenerateReportResponse>>(`${BASE}/generate`, data),

  /**
   * GET /v1/reports/history
   * Riwayat laporan milik user yang login.
   */
  getHistory: (params: {
    reportType?: ReportType;
    format?: ReportFormat;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }) =>
    apiClient.get<ApiResponse<PagedResponse<ReportHistoryItem>>>(
      `${BASE}/history`,
      { params }
    ),

  /**
   * GET /v1/reports/download/{historyId}
   * Download file laporan. Return blob untuk trigger download di browser.
   */
  download: (historyId: number) =>
    apiClient.get(`${BASE}/download/${historyId}`, {
      responseType: "blob",
    }),
};

/**
 * Helper: trigger browser download dari blob response
 */
export function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Helper: format ukuran file
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}