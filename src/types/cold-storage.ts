/* ─────────────────────────────────────────────────────────────────
   Cold Storage Domain — TypeScript types (matching backend DTOs)
   ───────────────────────────────────────────────────────────────── */

import type { AuditFields } from "./fish";

// ── Branch ────────────────────────────────────────────────────────

export interface BranchResponse extends AuditFields {
  branchId: number;
  branchCode: string;
  branchName: string;
  isActive: boolean;
}

export interface BranchRequest {
  branchCode: string;
  branchName: string;
}

// ── Cold Storage ──────────────────────────────────────────────────

export interface ColdStorageResponse extends AuditFields {
  coldStorageId: number;
  branchId: number;
  branchCode: string;
  branchName: string;
  csCode: string;
  csName: string;
  capacityTon?: number | string | null;
  isActive: boolean;
}

export interface ColdStorageRequest {
  branchId: number;
  csCode: string;
  csName: string;
  capacityTon?: number | string | null;
}

// ── Storage Block ─────────────────────────────────────────────────

/** Species info embedded in StorageBlockResponse (M2M) */
export interface SpeciesInfo {
  speciesId: number;
  speciesCode: string;
  speciesName: string;
}

export interface StorageBlockResponse extends AuditFields {
  blockId: number;
  coldStorageId: number;
  /** Cold storage fields (denormalized) */
  csCode: string;
  csName: string;
  blockCode: string;
  blockName: string;
  blockOwner: string;
  blockCapacity: number;
  /** M2M — can belong to multiple species */
  species: SpeciesInfo[];
  isActive: boolean;
}

export interface StorageBlockRequest {
  coldStorageId: number;
  /** List of species IDs (at least one required) */
  speciesIds: number[];
  blockCode: string;
  blockName: string;
  blockOwner: string;
  blockCapacity: number;
}

// ── Storage Rack ──────────────────────────────────────────────────

export interface StorageRackResponse extends AuditFields {
  rackId: number;
  blockId: number;
  blockCode: string;
  blockName: string;
  rackCode: string;
  isActive: boolean;
}

export interface StorageRackRequest {
  blockId: number;
  rackCode: string;
}

// ── Storage Position ──────────────────────────────────────────────

export type PositionStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

export interface StoragePositionResponse {
  positionId: number;
  rackId: number;
  rackCode: string;
  positionCode: string;
  status: PositionStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoragePositionRequest {
  rackId: number;
  positionCode: string;
  status: PositionStatus;
}
