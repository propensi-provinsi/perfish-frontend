/* ─────────────────────────────────────────────────────────────────
   Fish Domain — TypeScript types (matching backend DTOs exactly)
   ───────────────────────────────────────────────────────────────── */

/** Shared audit fields returned by BaseEntity-backed responses */
export interface AuditFields {
  createdAt: string; // ISO 8601 (Instant)
  updatedAt: string;
}

// ── Fish Species ──────────────────────────────────────────────────

export interface FishSpeciesResponse extends AuditFields {
  speciesId: number;
  speciesCode: string;
  speciesName: string;
  isActive: boolean;
}

export interface FishSpeciesRequest {
  speciesCode: string;
  speciesName: string;
}

// ── Fish Form ─────────────────────────────────────────────────────

export interface FishFormResponse extends AuditFields {
  formId: number;
  formCode: string;
  formName: string;
  isActive: boolean;
}

export interface FishFormRequest {
  formCode: string;
  formName: string;
}

// ── Fish Grade ────────────────────────────────────────────────────

export interface FishGradeResponse extends AuditFields {
  gradeId: number;
  gradeCode: string;
  gradeName: string;
  isActive: boolean;
}

export interface FishGradeRequest {
  gradeCode: string;
  gradeName: string;
}

// ── Packaging Type ────────────────────────────────────────────────

export interface PackagingTypeResponse extends AuditFields {
  packagingTypeId: number;
  packagingCode: string;
  packagingName: string;
  isActive: boolean;
}

export interface PackagingTypeRequest {
  packagingCode: string;
  packagingName: string;
}

// ── Fish SKU ──────────────────────────────────────────────────────

export interface FishSkuResponse extends AuditFields {
  skuId: number;
  skuCode: string;
  /** Species (denormalized) */
  speciesId: number;
  speciesCode: string;
  speciesName: string;
  /** Form (denormalized) */
  formId: number;
  formCode: string;
  formName: string;
  /** Grade (denormalized) */
  gradeId: number;
  gradeCode: string;
  gradeName: string;
  /** Packaging (denormalized) */
  packagingTypeId: number;
  packagingCode: string;
  packagingName: string;
  /** Physical specs */
  minWeightKg: number;
  maxWeightKg: number;
  defaultShelfLifeDays: number;
  defaultStorageTempC: number;
  isActive: boolean;
}

export interface FishSkuRequest {
  skuCode: string;
  speciesId: number;
  formId: number;
  gradeId: number;
  packagingTypeId: number;
  minWeightKg: number;
  maxWeightKg: number;
  defaultShelfLifeDays: number;
  defaultStorageTempC: number;
}
