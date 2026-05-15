import type { UserRole } from "@/types";

export const STOCK_OUTBOUND_WAREHOUSE_ROLES: UserRole[] = [
  "WAREHOUSE_STAFF",
  "WAREHOUSE_ADMIN",
  "SUPERADMIN",
];

export const STOCK_OUTBOUND_EXPORT_ROLES: UserRole[] = [
  "MARKETING_STAFF",
  "KEPALA_CABANG",
  "SUPERADMIN",
];

export const STOCK_OUTBOUND_MANUAL_FEFO_ROLES: UserRole[] = [
  "WAREHOUSE_ADMIN",
  "SUPERADMIN",
];

export const STOCK_OUTBOUND_DISTRIBUTION_ROLES: UserRole[] = [
  "WAREHOUSE_ADMIN",
  "BOARD_DIRECTORS",
  "SUPERADMIN",
];

type StockOutboundRoleRule = {
  prefix: string;
  roles: UserRole[];
};

const STOCK_OUTBOUND_ROLE_RULES: StockOutboundRoleRule[] = [
  {
    prefix: "/stock-outbound/penerimaan-sales-order",
    roles: STOCK_OUTBOUND_WAREHOUSE_ROLES,
  },
  {
    prefix: "/stock-outbound/alokasi-pallet",
    roles: STOCK_OUTBOUND_WAREHOUSE_ROLES,
  },
  {
    prefix: "/stock-outbound/transaksi-fefo",
    roles: STOCK_OUTBOUND_WAREHOUSE_ROLES,
  },
  {
    prefix: "/stock-outbound/dokumen-ekspor",
    roles: STOCK_OUTBOUND_EXPORT_ROLES,
  },
  {
    prefix: "/stock-outbound/riwayat-distribusi",
    roles: STOCK_OUTBOUND_DISTRIBUTION_ROLES,
  },
];

export const STOCK_OUTBOUND_MODULE_ROLES: UserRole[] = Array.from(
  new Set(STOCK_OUTBOUND_ROLE_RULES.flatMap((rule) => rule.roles))
);

export function getStockOutboundAllowedRoles(pathname: string): UserRole[] | undefined {
  const rule = STOCK_OUTBOUND_ROLE_RULES.find((entry) => pathname.startsWith(entry.prefix));
  return rule?.roles;
}

export function isRoleAllowedForStockOutboundPath(role: UserRole, pathname: string): boolean {
  const roles = getStockOutboundAllowedRoles(pathname);
  if (!roles) return true;
  return roles.includes(role);
}
