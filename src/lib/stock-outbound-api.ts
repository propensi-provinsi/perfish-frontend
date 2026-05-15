import apiClient from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  AllocateStockPayload,
  AllocationSummary,
  Certification,
  CertificationAlert,
  CertificationPayload,
  CertificationStatusSummary,
  CountryReadiness,
  CreateShipmentPayload,
  DistributionAudit,
  DistributionHistory,
  ExportReadiness,
  FefoBatchStock,
  PdfUploadResponse,
  SalesOrderOutboundSummary,
  Shipment,
  ShipmentDocumentChecklist,
  ShipmentDocumentPayload,
  ShipmentStatus,
  TransportModeOption,
  UpdateShipmentDetailsPayload,
} from "@/types/stock-outbound";

const soBase = "/v1/so";
const shipmentBase = "/v1/shipment";

export const stockOutboundApi = {
  getSalesOrders: () =>
    apiClient.get<ApiResponse<SalesOrderOutboundSummary[]>>(soBase),

  allocateStock: (soId: number, payload?: AllocateStockPayload) =>
    apiClient.post<ApiResponse<AllocationSummary>>(`${soBase}/${soId}/allocate`, payload ?? { autoAllocate: true }),

  deallocateStock: (soId: number, allocationId: number) =>
    apiClient.delete<ApiResponse<AllocationSummary>>(`${soBase}/${soId}/allocation/${allocationId}`),

  getAllocationSummary: (soId: number) =>
    apiClient.get<ApiResponse<AllocationSummary>>(`${soBase}/${soId}/allocation`),

  getFefoBatches: (search = "") =>
    apiClient.get<ApiResponse<FefoBatchStock[]>>(`${soBase}/fefo-batches`, {
      params: { search },
    }),

  getTransportModes: () =>
    apiClient.get<ApiResponse<TransportModeOption[]>>("/v1/master/outbound/transport-modes"),

  getShipments: (params?: {
    status?: ShipmentStatus;
    salesOrderId?: number;
    buyer?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    apiClient.get<ApiResponse<Shipment[]>>(shipmentBase, { params }),

  getShipmentById: (shipmentId: number) =>
    apiClient.get<ApiResponse<Shipment>>(`${shipmentBase}/${shipmentId}`),

  createShipment: (payload: CreateShipmentPayload) =>
    apiClient.post<ApiResponse<Shipment>>(shipmentBase, payload),

  updateShipmentStatus: (shipmentId: number, payload: { status: ShipmentStatus; note?: string; qrCode?: string }) =>
    apiClient.put<ApiResponse<Shipment>>(`${shipmentBase}/${shipmentId}/status`, payload),

  updateShipmentDetails: (shipmentId: number, payload: UpdateShipmentDetailsPayload) =>
    apiClient.put<ApiResponse<Shipment>>(`${shipmentBase}/${shipmentId}/details`, payload),

  getShipmentDocuments: (shipmentId: number) =>
    apiClient.get<ApiResponse<ShipmentDocumentChecklist>>(`${shipmentBase}/${shipmentId}/documents`),

  createShipmentDocument: (payload: ShipmentDocumentPayload) =>
    apiClient.post<ApiResponse<ShipmentDocumentChecklist>>("/v1/export-doc", payload),

  uploadExportDocumentPdf: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<ApiResponse<PdfUploadResponse>>("/v1/export-doc/upload-pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  fetchExportDocumentPdf: (fileUrl: string) => {
    const normalizedUrl = /^(https?:)?\/\//i.test(fileUrl)
      ? fileUrl
      : fileUrl.startsWith("/api/")
        ? fileUrl.replace(/^\/api/, "")
        : fileUrl;

    return apiClient.get<Blob>(normalizedUrl, { responseType: "blob" });
  },

  updateShipmentDocument: (shipmentDocumentId: number, payload: ShipmentDocumentPayload) =>
    apiClient.put<ApiResponse<ShipmentDocumentChecklist>>(`/v1/export-doc/${shipmentDocumentId}`, payload),

  deleteShipmentDocument: (shipmentDocumentId: number) =>
    apiClient.delete<ApiResponse<ShipmentDocumentChecklist>>(`/v1/export-doc/${shipmentDocumentId}`),

  getCertifications: () =>
    apiClient.get<ApiResponse<Certification[]>>("/v1/certification"),

  createCertification: (payload: CertificationPayload) =>
    apiClient.post<ApiResponse<Certification>>("/v1/certification", payload),

  updateCertification: (id: number, payload: CertificationPayload) =>
    apiClient.put<ApiResponse<Certification>>(`/v1/certification/${id}`, payload),

  deleteCertification: (id: number) =>
    apiClient.delete<ApiResponse<Certification>>(`/v1/certification/${id}`),

  getCertificationStatus: () =>
    apiClient.get<ApiResponse<CertificationStatusSummary>>("/v1/certification/status"),

  getCountryReadiness: (countryCode: string) =>
    apiClient.get<ApiResponse<CountryReadiness>>(`/v1/certification/country/${countryCode}`),

  getCertificationAlerts: () =>
    apiClient.get<ApiResponse<CertificationAlert[]>>("/v1/certification/alerts"),

  markCertificationAlertRead: (alertId: number) =>
    apiClient.patch<ApiResponse<null>>(`/v1/certification/alerts/${alertId}/read`),

  getExportReadiness: (shipmentId: number) =>
    apiClient.get<ApiResponse<ExportReadiness>>(`/v1/export-readiness/${shipmentId}`),

  getDistributionHistory: (params?: {
    batchId?: number;
    salesOrderId?: number;
    startDate?: string;
    endDate?: string;
    buyer?: string;
    fishSpecies?: string;
    destination?: string;
    status?: string;
  }) =>
    apiClient.get<ApiResponse<DistributionHistory>>("/v1/distribution/history", { params }),

  getDistributionAudit: (distributionId: number) =>
    apiClient.get<ApiResponse<DistributionAudit>>(`/v1/audit-trail/distribution/${distributionId}`),

  buildDistributionExportUrl: (params?: {
    batchId?: number;
    salesOrderId?: number;
    startDate?: string;
    endDate?: string;
    buyer?: string;
    fishSpecies?: string;
    destination?: string;
    status?: string;
  }) => {
    const search = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value) !== "") {
          search.set(key, String(value));
        }
      });
    }

    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
    const query = search.toString();
    return `${base}/v1/distribution/history/export${query ? `?${query}` : ""}`;
  },
};
