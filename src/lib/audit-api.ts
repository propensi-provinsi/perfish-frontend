import apiClient from "@/lib/api";
import type { ApiResponse, AuditLogData, AuditLogPageData } from "@/types";

export interface AuditLogQuery {
  userId?: string;
  entityType?: string;
  actionType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface EntityOption {
  id: string;
  name: string;
}

function cleanParams<T extends object>(params: T) {
  return Object.fromEntries(
    Object.entries(params as Record<string, unknown>).filter(
      ([, value]) => value !== undefined && value !== ""
    )
  );
}

export async function getAuditLogs(params: AuditLogQuery) {
  const { data } = await apiClient.get<ApiResponse<AuditLogPageData>>("/v1/audit-logs", {
    params: cleanParams(params),
  });
  return data.data;
}

export async function getEntityAuditTrail(entityType: string, entityId: string) {
  const { data } = await apiClient.get<ApiResponse<AuditLogData[]>>(
    `/v1/audit/${entityType}/${entityId}`
  );
  return data.data;
}

export async function getAllEntitiesByType(entityType: string) {
  const { data } = await apiClient.get<ApiResponse<EntityOption[]>>(
    `/v1/audit/entities/${entityType}`
  );
  return data.data;
}

export async function getAuditUsers() {
  const { data } = await apiClient.get<ApiResponse<EntityOption[]>>(
    "/v1/audit-logs/users"
  );
  return data.data;
}