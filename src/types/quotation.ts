export type QuotationStatus =
  | "DRAFT"
  | "SENT"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "CONVERTED";

export const QUOTATION_STATUSES: { value: QuotationStatus; label: string }[] = [
  { value: "DRAFT",     label: "Draft" },
  { value: "SENT",      label: "Terkirim" },
  { value: "APPROVED",  label: "Disetujui" },
  { value: "REJECTED",  label: "Ditolak" },
  { value: "EXPIRED",   label: "Kedaluwarsa" },
  { value: "CONVERTED", label: "Dikonversi" },
];

/** Status yang bisa dipilih via PATCH /status */
export const UPDATABLE_STATUSES: { value: QuotationStatus; label: string }[] = [
  { value: "SENT",     label: "Terkirim" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "EXPIRED",  label: "Kedaluwarsa" },
];

export interface QuotationItemResponse {
  id: number;
  batchId: number;
  volumeKg: number;
  pricePerKg: number;
  totalPrice: number;
}

export interface QuotationData {
  id: number;
  quotationNumber: string;
  customerId: number;
  customerName: string;
  dateIssued: string;   // LocalDate → "2025-06-16"
  dateValid: string;
  deliveryMethod?: string;
  deliveryLocation?: string;
  status: QuotationStatus;
  ppnRate?: number;
  subtotal?: number;
  ppnAmount?: number;
  total?: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  items: QuotationItemResponse[];
}

export interface QuotationItemRequest {
  batchId: number;
  volumeKg: number;
  pricePerKg: number;
}

export interface CreateQuotationPayload {
  customerId: number;
  dateIssued: string;
  dateValid: string;
  deliveryMethod?: string;
  deliveryLocation?: string;
  notes?: string;
  items: QuotationItemRequest[];
}

export interface UpdateQuotationStatusPayload {
  status: QuotationStatus;
}

export interface SalesOrderData {
  id: number;
  soNumber: string;
  quotationId: number;
  quotationNumber: string;
  customerId: number;
  customerName: string;
  status: string;
  convertedBy?: string;
  convertedAt: string;
}