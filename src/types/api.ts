/** Standard API response wrapper matching the backend ApiResponse<T> */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Health check response */
export interface HealthStatus {
  status: string;
  timestamp: string;
}

export type ExpiryStatus = "FRESH" | "WARNING" | "EXPIRED";

export interface FishSpeciesData {
  speciesId: number;
  speciesCode: string;
  speciesName: string;
  isActive: boolean;
}

export interface ColdStorageData {
  coldStorageId: number;
  branchId: number;
  branchCode: string;
  branchName: string;
  csCode: string;
  csName: string;
  isActive: boolean;
}

export interface ShelfLifeConfigData {
  speciesId: number;
  speciesCode: string;
  speciesName: string;
  defaultShelfLifeDays: number;
  warningThresholdDays: number;
  isActive: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ShelfLifeConfigGroupPayload {
  speciesIds: number[];
  defaultShelfLifeDays: number;
  warningThresholdDays?: number;
  isActive: boolean;
}

export interface ShelfLifeConfigUpsertPayload {
  items: ShelfLifeConfigGroupPayload[];
}

export interface ShelfLifeConfigUpsertData {
  updatedSpeciesCount: number;
  updatedGroupCount: number;
  updatedAt: string;
}

export interface BatchExpiryStatusRow {
  batchId: number;
  batchCode: string;
  speciesId: number;
  speciesCode: string;
  speciesName: string;
  coldStorageId: number | null;
  csCode: string | null;
  csName: string | null;
  rackId: number | null;
  rackCode: string | null;
  entryDate: string;
  expiredDate: string;
  manualExpiredDate: string | null;
  isManualExpiryOverride: boolean;
  daysToExpire: number;
  warningThresholdDays: number;
  expiryStatus: ExpiryStatus;
  quantityKg: number | null;
  isHold: boolean;
  isRejected: boolean;
}

export interface BatchExpiryOverridePayload {
  expiredDate: string | null;
}

export interface BatchExpiryStatusListData {
  content: BatchExpiryStatusRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort: string;
}

export interface BatchExpirySummaryData {
  asOfDate: string;
  filters: {
    coldStorageId: number | null;
    speciesId: number | null;
    isRejected: boolean | null;
    isHold: boolean | null;
  };
  totalBatch: number;
  freshBatch: number;
  warningBatch: number;
  expiredBatch: number;
  freshQtyKg: number;
  warningQtyKg: number;
  expiredQtyKg: number;
}

export interface ExpiryNotificationItem {
  notificationId: string;
  batchId: number;
  batchCode: string;
  expiryStatus: ExpiryStatus;
  daysToExpire: number;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface ExpiryNotificationListData {
  unreadCount: number;
  items: ExpiryNotificationItem[];
}

export interface AuditLogData {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  actionType: string;
  reason?: string;
  metadata?: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  timestamp: string;
}

export interface AuditLogPageData {
  content: AuditLogData[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort: string;
}
