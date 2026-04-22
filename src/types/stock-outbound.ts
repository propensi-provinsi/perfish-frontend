import type { ApiResponse } from "./api";

export type AllocationStatus = "ALLOCATED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";

export type ShipmentStatus =
  | "ALLOCATED"
  | "OUTBOUND"
  | "LOADING"
  | "DISPATCHED"
  | "DELIVERED"
  | "PICKING"
  | "CHECKING";

export type TrackedDocumentStatus = "MISSING" | "DRAFT" | "FINAL" | "EXPIRED";

export interface SalesOrderOutboundSummary {
  soId: number;
  soNumber: string;
  customerName: string;
  salesOrderStatus: string;
  quotationStatus: string;
  issueDate: string;
  validDate: string;
  totalRequiredKg: number;
  totalAllocatedKg: number;
  remainingKg: number;
  fullyAllocated: boolean;
  allocatable: boolean;
  deallocatable: boolean;
  locked: boolean;
  criteria: {
    quotationItemId: number;
    batchId: number;
    batchNumber: string | null;
    qualityGrade: string | null;
    speciesId: number | null;
    speciesCode: string | null;
    speciesName: string | null;
    skuId: number | null;
    skuCode: string | null;
    gradeCode: string | null;
    gradeName: string | null;
    formCode: string | null;
    formName: string | null;
    packagingCode: string | null;
    packagingName: string | null;
    minWeightKg: number | null;
    maxWeightKg: number | null;
  }[];
}

export interface AllocateStockPayload {
  autoAllocate?: boolean;
  note?: string;
  manualAllocations?: {
    quotationItemId: number;
    batchId: number;
    quantityKg: number;
  }[];
}

export interface AllocationSummary {
  soId: number;
  soNumber: string;
  customerName: string;
  totalRequiredKg: number;
  totalAllocatedKg: number;
  remainingKg: number;
  fullyAllocated: boolean;
  partialAllocation: boolean;
  message: string;
  allocations: {
    allocationId: number;
    quotationItemId: number;
    batchId: number;
    batchNumber: string;
    fishSpeciesName: string | null;
    allocatedQuantity: number;
    status: AllocationStatus;
    expirationDate: string | null;
    shipmentId: number | null;
    allocatedAt: string;
  }[];
}

export interface CreateShipmentPayload {
  salesOrderId: number;
  allocationIds?: number[];
  outboundChannelId?: number;
  isExport?: boolean;
  destination?: string;
  vehicleNumber?: string;
  remarks?: string;
}

export interface UpdateShipmentDetailsPayload {
  outboundChannelId?: number;
  isExport?: boolean;
  destination?: string;
  vehicleNumber?: string;
  remarks?: string;
}

export interface Shipment {
  shipmentId: number;
  shipmentNumber: string;
  soId: number;
  soNumber: string;
  customerName: string;
  buyerName: string;
  destination: string | null;
  vehicleNumber: string | null;
  isExport: boolean;
  outboundChannelId: number | null;
  outboundChannelName: string | null;
  status: ShipmentStatus;
  accurateSyncStatus: string | null;
  createdAt: string;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  remarks: string | null;
  allocations: {
    allocationId: number;
    batchId: number;
    batchNumber: string;
    fishSpeciesName: string | null;
    allocatedQuantity: number;
    status: AllocationStatus;
  }[];
  statusLogs: {
    logId: number;
    oldStatus: ShipmentStatus | null;
    newStatus: ShipmentStatus;
    note: string | null;
    changedAt: string;
    changedBy: string | null;
  }[];
}

export interface ShipmentDocumentChecklist {
  shipmentId: number;
  shipmentNumber: string;
  completionPercent: number;
  complete: boolean;
  requiredDocuments: {
    documentId: number;
    documentName: string;
    requiresApproval: boolean;
    present: boolean;
    finalized: boolean;
    expired: boolean;
  }[];
  uploadedDocuments: {
    shipmentDocumentId: number;
    masterDocumentId: number | null;
    documentName: string;
    documentNumber: string | null;
    status: TrackedDocumentStatus;
    issueDate: string | null;
    expiryDate: string | null;
    fileUrl: string | null;
    countryCode: string | null;
    remarks: string | null;
  }[];
}

export interface ShipmentDocumentPayload {
  shipmentId: number;
  masterDocumentId?: number;
  documentName?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  status?: TrackedDocumentStatus;
  fileUrl?: string;
  countryCode?: string;
  remarks?: string;
}

export interface PdfUploadResponse {
  originalFileName: string | null;
  storedFileName: string;
  fileUrl: string;
  sizeBytes: number;
}

export type CertificationState = "ACTIVE" | "WARNING" | "EXPIRED";

export interface Certification {
  certificationId: number;
  certificationName: string;
  certificateType: string | null;
  issuingBody: string | null;
  gradeLevel: string | null;
  issueDate: string | null;
  expiryDate: string;
  daysToExpire: number;
  state: CertificationState;
  documentUrl: string | null;
  responsibleUser: string | null;
  countries: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CertificationPayload {
  certificationName: string;
  certificateType?: string;
  issuingBody?: string;
  gradeLevel?: string;
  issueDate?: string;
  expiryDate: string;
  documentUrl?: string;
  responsibleUser?: string;
  countries?: string[];
}

export interface CertificationStatusSummary {
  asOfDate: string;
  totalActive: number;
  totalWarning: number;
  totalExpired: number;
}

export interface CountryReadiness {
  countryCode: string;
  ready: boolean;
  readinessPercent: number;
  totalCertifications: number;
  activeCertifications: number;
  warningCertifications: number;
  expiredCertifications: number;
  certifications: Certification[];
}

export interface CertificationAlert {
  alertId: number;
  certificationId: number;
  certificationName: string;
  thresholdDays: number;
  daysToExpire: number;
  alertDate: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ExportReadiness {
  shipmentId: number;
  shipmentNumber: string;
  readinessScore: number;
  readyToDispatch: boolean;
  items: {
    key: string;
    label: string;
    passed: boolean;
    details: string;
  }[];
}

export interface DistributionHistory {
  totalCount: number;
  content: {
    distributionId: number;
    soId: number;
    soNumber: string;
    shipmentId: number | null;
    shipmentNumber: string | null;
    batchId: number;
    batchNumber: string;
    fishSpeciesName: string | null;
    allocatedQuantity: number;
    allocationDate: string;
    shippedDate: string | null;
    user: string | null;
    destination: string | null;
    buyerName: string | null;
    status: AllocationStatus;
  }[];
}

export interface DistributionAudit {
  distributionId: number;
  entries: {
    auditId: number;
    actionType: string;
    oldValue: string | null;
    newValue: string | null;
    actor: string | null;
    eventTime: string;
  }[];
}

export type PalletStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "DAMAGED";

export interface PalletStock {
  palletId: number;
  palletNumber: string;
  qrCode: string;
  currentWeight: number;
  maxWeightCapacity: number;
  status: PalletStatus;
  blockId: number | null;
  blockName: string | null;
  rackId: number | null;
  rackCode: string | null;
  positionId: number | null;
  positionCode: string | null;
  skuId: number | null;
  skuCode: string | null;
  speciesId: number | null;
  speciesCode: string | null;
  speciesName: string | null;
  gradeId: number | null;
  gradeCode: string | null;
  gradeName: string | null;
  formId: number | null;
  formCode: string | null;
  formName: string | null;
  packagingTypeId: number | null;
  packagingCode: string | null;
  packagingName: string | null;
  skuMinWeightKg: number | null;
  skuMaxWeightKg: number | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface FefoBatchStock {
  batchId: number;
  batchNumber: string;
  batchDate: string | null;
  fishSpeciesId: number | null;
  fishSpeciesName: string | null;
  totalQuantity: number;
  currentQuantity: number;
  unit: string;
  productionDate: string | null;
  expirationDate: string | null;
  supplierId: string | null;
  supplierName: string | null;
  status: string;
  qualityGrade: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface TransportModeOption {
  transportModeId: number;
  modeCode: string;
  modeName: string;
  tempControlRequired: boolean;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export type OutboundApiResponse<T> = Promise<{ data: ApiResponse<T> }>;
