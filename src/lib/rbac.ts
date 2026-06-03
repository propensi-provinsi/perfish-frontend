import type { UserRole } from "@/types";

/** Superadmin mengakses semua modul. */
export function isSuperAdmin(role?: UserRole | null): boolean {
  return role === "SUPERADMIN";
}

export function hasAnyRole(role: UserRole | undefined | null, allowed: readonly UserRole[]): boolean {
  if (!role) return false;
  if (isSuperAdmin(role)) return true;
  return allowed.includes(role);
}

// ── Purchase Order ────────────────────────────────────────────────

export const PURCHASE_ORDER_ROLES: UserRole[] = ["SBB_STAFF", "SUPERADMIN"];

export function canAccessPurchaseOrder(role?: UserRole | null): boolean {
  return hasAnyRole(role, PURCHASE_ORDER_ROLES);
}

export function canManagePurchaseOrder(role?: UserRole | null): boolean {
  return hasAnyRole(role, PURCHASE_ORDER_ROLES);
}

// ── Ringkasan Supplier ──────────────────────────────────────────────

export const RINGKASAN_SUPPLIER_ROLES: UserRole[] = ["SBB_STAFF", "KEPALA_CABANG", "SUPERADMIN"];

export function canAccessRingkasanSupplier(role?: UserRole | null): boolean {
  return hasAnyRole(role, RINGKASAN_SUPPLIER_ROLES);
}

export function canAddSupplierFromRingkasan(role?: UserRole | null): boolean {
  return hasAnyRole(role, ["SBB_STAFF", "KEPALA_CABANG", "SUPERADMIN"]);
}

export function canApproveSupplier(role?: UserRole | null): boolean {
  return hasAnyRole(role, ["KEPALA_CABANG", "SUPERADMIN"]);
}

/** Create / update form audit supplier. */
export function canManageSupplierAudit(role?: UserRole | null): boolean {
  return hasAnyRole(role, ["SBB_STAFF", "SUPERADMIN"]);
}

/** Lihat audit & view more di ringkasan. */
export function canViewSupplierAudit(role?: UserRole | null): boolean {
  return hasAnyRole(role, RINGKASAN_SUPPLIER_ROLES);
}

// ── Dashboard Penerimaan (Inbound) ──────────────────────────────────

export const DASHBOARD_PENERIMAAN_READ_ROLES: UserRole[] = [
  "WAREHOUSE_STAFF",
  "QC_SPECIALIST",
  "WAREHOUSE_ADMIN",
  "SUPERADMIN",
];

export function canReadDashboardPenerimaan(role?: UserRole | null): boolean {
  return hasAnyRole(role, DASHBOARD_PENERIMAAN_READ_ROLES);
}

export function canCreateInboundReceipt(role?: UserRole | null): boolean {
  return hasAnyRole(role, ["WAREHOUSE_STAFF", "SUPERADMIN"]);
}

export function canManagePalletization(role?: UserRole | null): boolean {
  return hasAnyRole(role, ["WAREHOUSE_STAFF", "SUPERADMIN"]);
}

export const SIZING_GRADING_ROLES: UserRole[] = ["QC_SPECIALIST", "SUPERADMIN"];

export function canManageSizingGrading(role?: UserRole | null): boolean {
  return hasAnyRole(role, SIZING_GRADING_ROLES);
}

export const PALLETIZATION_ROLES: UserRole[] = ["WAREHOUSE_STAFF", "SUPERADMIN"];

export function canApproveInboundReceipt(role?: UserRole | null): boolean {
  return hasAnyRole(role, ["WAREHOUSE_ADMIN", "SUPERADMIN"]);
}

/** Lihat daftar persetujuan pending cold storage (read-only untuk staff). */
export function canViewColdStorageApprovals(role?: UserRole | null): boolean {
  return hasAnyRole(role, WAREHOUSE_STORAGE_FULL_ROLES);
}

/** Setujui / tolak permintaan operasi cold storage. */
export function canReviewColdStorageApproval(role?: UserRole | null): boolean {
  return canApproveInboundReceipt(role);
}

/** Batch Activity — warehouse + role dengan menu penuh (bukan menu slim). */
export function canAccessBatchActivity(role?: UserRole | null): boolean {
  if (!role) return false;
  if (isSuperAdmin(role)) return true;
  if (role === "WAREHOUSE_STAFF" || role === "WAREHOUSE_ADMIN") return true;
  if (role === "KEPALA_CABANG" || role === "SBB_STAFF" || role === "QC_SPECIALIST") return false;
  return true;
}

/** Dashboard overview (/dashboard) — tidak untuk warehouse staff/admin & QC. */
export function canAccessDashboardOverview(role?: UserRole | null): boolean {
  if (!role) return false;
  if (isSuperAdmin(role)) return true;
  if (role === "WAREHOUSE_STAFF" || role === "WAREHOUSE_ADMIN" || role === "QC_SPECIALIST") return false;
  return true;
}

/** GET detail inbound (dashboard, ringkasan view more). */
export const INBOUND_RECEIPT_READ_ROLES: UserRole[] = Array.from(
  new Set<UserRole>([...DASHBOARD_PENERIMAAN_READ_ROLES, ...RINGKASAN_SUPPLIER_ROLES])
);

// ── Cold Storage / Storage ──────────────────────────────────────────

export const WAREHOUSE_STORAGE_FULL_ROLES: UserRole[] = [
  "WAREHOUSE_STAFF",
  "WAREHOUSE_ADMIN",
  "SUPERADMIN",
];

export const STOCK_OPNAME_ROLES: UserRole[] = [
  "QC_SPECIALIST",
  "WAREHOUSE_STAFF",
  "WAREHOUSE_ADMIN",
  "SUPERADMIN",
];

export type ColdStorageNavKey =
  | "monitor"
  | "assign"
  | "move"
  | "history"
  | "disposal"
  | "structure"
  | "opname"
  | "merge";

const COLD_STORAGE_NAV_PATH: Record<ColdStorageNavKey, string> = {
  monitor: "/cold-storage",
  assign: "/cold-storage/assign-location",
  move: "/cold-storage/move-batch",
  history: "/cold-storage/batch-history",
  disposal: "/cold-storage/disposal",
  structure: "/cold-storage/structure",
  opname: "/cold-storage/stock-opname",
  merge: "/cold-storage/batch-merge",
};

export const LOADING_BAY_PATH = "/storage/loading-bay";

export function canAccessLoadingBay(role?: UserRole | null): boolean {
  return hasAnyRole(role, WAREHOUSE_STORAGE_FULL_ROLES);
}

export function canAccessColdStorageNav(role: UserRole | undefined | null, key: ColdStorageNavKey): boolean {
  if (key === "opname") return hasAnyRole(role, STOCK_OPNAME_ROLES);
  return hasAnyRole(role, WAREHOUSE_STORAGE_FULL_ROLES);
}

export function getColdStorageNavHrefsForRole(role: UserRole | undefined | null): string[] {
  const keys: ColdStorageNavKey[] = [
    "monitor",
    "assign",
    "move",
    "history",
    "disposal",
    "structure",
    "opname",
    "merge",
  ];
  return keys.filter((k) => canAccessColdStorageNav(role, k)).map((k) => COLD_STORAGE_NAV_PATH[k]);
}

export function isRoleAllowedForStoragePath(role: UserRole, pathname: string): boolean {
  if (pathname.startsWith(LOADING_BAY_PATH)) return canAccessLoadingBay(role);
  if (pathname.startsWith("/storage/batch/")) {
    return hasAnyRole(role, WAREHOUSE_STORAGE_FULL_ROLES);
  }
  const hrefs = getColdStorageNavHrefsForRole(role);
  return hrefs.some((href) => {
    if (href === "/cold-storage") return pathname === href;
    return pathname.startsWith(href);
  });
}

export function getStorageModuleAllowedRoles(): UserRole[] {
  return Array.from(new Set<UserRole>([...WAREHOUSE_STORAGE_FULL_ROLES, ...STOCK_OPNAME_ROLES]));
}
