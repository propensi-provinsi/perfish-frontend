export type ReportFormat = "PDF" | "EXCEL";

export type ReportType =
  | "INBOUND_FISH"
  | "BATCH_STOCK"
  | "EXPIRY_STATUS"
  | "SALES_QUOTATION"
  | "SALES_ORDER"
  | "SALES_REKAP"
  | "DISTRIBUTION"
  | "CERTIFICATION";

export interface EnumOption {
  value: string;
  label: string;
}

export interface FilterDefinition {
  key: string;
  label: string;
  inputType: "select" | "multi_select" | "text";
  dataSource: string | null; // URL endpoint untuk fetch options
  options: EnumOption[] | null; // untuk enum (status dll)
}

export interface ReportTypeInfo {
  type: ReportType;
  displayName: string;
  description: string;
  filters: FilterDefinition[];
}

export interface GenerateReportRequest {
  reportType: ReportType;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
  format: ReportFormat;
  filters?: Record<string, string>;
}

export interface GenerateReportResponse {
  historyId: number;
  reportType: ReportType;
  reportName: string;
  startDate: string;
  endDate: string;
  format: ReportFormat;
  fileName: string;
  downloadUrl: string;
  fileSizeBytes: number;
  createdAt: string;
  expiredAt: string;
  hasData: boolean;
}

export interface ReportHistoryItem {
  historyId: number;
  reportType: ReportType;
  reportName: string;
  periodDisplay: string;
  startDate: string;
  endDate: string;
  format: ReportFormat;
  fileName: string;
  downloadUrl: string;
  fileSizeBytes: number;
  createdAt: string;
  expiredAt: string;
  isExpired: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}