import apiClient from "@/lib/api";
import type {
  ApiResponse,
  BatchExpiryOverridePayload,
  BatchExpiryStatusListData,
  BatchExpirySummaryData,
  ColdStorageData,
  ExpiryNotificationListData,
  FishSpeciesData,
  ShelfLifeConfigData,
  ShelfLifeConfigUpsertData,
  ShelfLifeConfigUpsertPayload,
  ExpiryStatus,
} from "@/types";

export interface ExpiryStatusQuery {
  status?: ExpiryStatus;
  coldStorageId?: number;
  speciesId?: number;
  isRejected?: boolean;
  isHold?: boolean;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string;
}

function cleanParams<T extends object>(params: T) {
  return Object.fromEntries(
    Object.entries(params as Record<string, unknown>).filter(
      ([, value]) => value !== undefined && value !== ""
    )
  );
}

export async function getFishSpecies() {
  const { data } = await apiClient.get<ApiResponse<FishSpeciesData[]>>(
    "/v1/master/fish/species"
  );
  return data.data;
}

export async function getColdStorages(params?: { branchId?: number }) {
  const { data } = await apiClient.get<ApiResponse<ColdStorageData[]>>(
    "/v1/master/cold-storage/storages",
    { params: cleanParams(params ?? {}) }
  );
  return data.data;
}

export async function getShelfLifeConfigs(params?: {
  speciesId?: number;
  isActive?: boolean;
}) {
  const { data } = await apiClient.get<ApiResponse<ShelfLifeConfigData[]>>(
    "/v1/config/shelf-life",
    { params: cleanParams(params ?? {}) }
  );
  return data.data;
}

export async function upsertShelfLifeConfigs(payload: ShelfLifeConfigUpsertPayload) {
  const { data } = await apiClient.put<ApiResponse<ShelfLifeConfigUpsertData>>(
    "/v1/config/shelf-life",
    payload
  );
  return data.data;
}

export async function deleteShelfLifeConfigGroup(speciesIds: number[]) {
  await apiClient.delete("/v1/config/shelf-life", {
    params: { speciesIds },
    paramsSerializer: {
      indexes: null,
    },
  });
}

export async function getBatchExpiryStatus(params: ExpiryStatusQuery) {
  const { data } = await apiClient.get<ApiResponse<BatchExpiryStatusListData>>(
    "/v1/batches/expiry-status",
    { params: cleanParams(params) }
  );
  return data.data;
}

export async function getBatchExpirySummary(params?: {
  coldStorageId?: number;
  speciesId?: number;
  isRejected?: boolean;
  isHold?: boolean;
}) {
  const { data } = await apiClient.get<ApiResponse<BatchExpirySummaryData>>(
    "/v1/batches/expiry-summary",
    { params: cleanParams(params ?? {}) }
  );
  return data.data;
}

export async function overrideBatchExpiryDate(batchId: number, payload: BatchExpiryOverridePayload) {
  const { data } = await apiClient.patch<ApiResponse<BatchExpiryStatusListData["content"][number]>>(
    `/v1/batches/${batchId}/expiry-date`,
    payload
  );
  return data.data;
}

export async function getExpiryNotifications(params?: {
  limit?: number;
  unreadOnly?: boolean;
}) {
  const { data } = await apiClient.get<ApiResponse<ExpiryNotificationListData>>(
    "/v1/notifications/expiry",
    { params: cleanParams(params ?? {}) }
  );
  return data.data;
}

export async function markExpiryNotificationAsRead(notificationId: string) {
  await apiClient.patch(`/v1/notifications/expiry/${notificationId}/read`);
}
