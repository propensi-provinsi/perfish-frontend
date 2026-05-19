import {
  HiOutlineHome,
  HiOutlineChartBarSquare,
  HiOutlineClipboardDocumentList,
  HiOutlineCube,
  HiOutlineExclamationTriangle,
  HiOutlineShoppingCart,
  HiOutlineMagnifyingGlass,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";
import {
  LuFish,
  LuSnowflake,
  LuPackageOpen,
  LuChartBar,
  LuWarehouse,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import type { UserRole } from "@/types";
import {
  canAccessPurchaseOrder,
  canAccessRingkasanSupplier,
  canReadDashboardPenerimaan,
  canAccessLoadingBay,
  getColdStorageNavHrefsForRole,
  LOADING_BAY_PATH,
} from "@/lib/rbac";
import {
  isRoleAllowedForStockOutboundPath,
  STOCK_OUTBOUND_MODULE_ROLES,
} from "@/lib/stock-outbound-rbac";

export interface MenuItem {
  key: string;
  label: string;
  icon?: IconType;
  href?: string;
  children?: MenuItem[];
}

export const AUDIT_TRAIL_ROLES = ["WAREHOUSE_ADMIN", "BOARD_DIRECTORS", "SUPERADMIN"] as const;

/**
 * Role yang boleh akses menu Laporan.
 * Staff operasional (SBB, Warehouse) hanya bisa laporan operasional.
 * Manager ke atas bisa semua laporan termasuk Sales Rekap & Distribusi.
 * Filtering jenis laporan yang ditampilkan dilakukan di backend (GET /v1/reports/types).
 */
export const REPORTS_ROLES = [
  "SUPERADMIN",
  "KEPALA_CABANG",
  "MANAGER_SALES",
  "DIREKSI",
  "STAFF_SALES",
  "SBB_STAFF",
  "WAREHOUSE_STAFF",
  "WAREHOUSE_ADMIN",
] as const;

const STOCK_OUTBOUND_ITEM: MenuItem = {
  key: "stock-outbound",
  label: "Pengeluaran Stok",
  icon: LuPackageOpen,
  children: [
    { key: "so-receiving", label: "Penerimaan Sales Order", href: "/stock-outbound/penerimaan-sales-order" },
    { key: "pallet-allocation", label: "Data Batch Alokasi", href: "/stock-outbound/alokasi-pallet" },
    { key: "fefo-transaction", label: "Transaksi FEFO", href: "/stock-outbound/transaksi-fefo" },
    { key: "export-docs", label: "Dokumen Ekspor", href: "/stock-outbound/dokumen-ekspor" },
  ],
};

export const mainMenu: MenuItem[] = [
  {
    key: "home",
    label: "Home",
    icon: HiOutlineHome,
    href: "/home",
  },
  {
    key: "dashboard",
    label: "Dashboard",
    icon: HiOutlineChartBarSquare,
    children: [
      { key: "dashboard-overview", label: "Overview", href: "/dashboard" },
    ],
  },
  {
    key: "master-data",
    label: "Master Data",
    icon: HiOutlineClipboardDocumentList,
    children: [
      { key: "md-fish", label: "Data Ikan", href: "/master-data/fish" },
      { key: "md-storage", label: "Cold Storage", href: "/master-data/storage" },
      { key: "md-batch", label: "Master Batch", href: "/master-data/batch" },
      { key: "md-outbound", label: "Komp. Pengeluaran", href: "/master-data/outbound-components" },
      { key: "md-sales", label: "Komp. Penjualan", href: "/master-data/sales-components" },
      { key: "md-supplier", label: "Supplier", href: "/master-data/suppliers" },
      { key: "md-customer", label: "Customer", href: "/master-data/customers" },
      { key: "md-user", label: "User", href: "/master-data/users" },
    ],
  },
  {
    key: "batch-activity",
    label: "Batch Activity",
    icon: HiOutlineCube,
    children: [
      { key: "batch-traceability", label: "Traceability & Flow", href: "/batch-activity/traceability" },
      { key: "batch-logs", label: "Audit & Event Logs", href: "/batch-activity/logs" },
    ],
  },
  {
    key: "expired-alert",
    label: "Expired Alert & Notification",
    icon: HiOutlineExclamationTriangle,
    children: [
      { key: "expired-alert-dashboard", label: "Monitor", href: "/expired-alert" },
      { key: "expired-alert-config", label: "Konfigurasi Shelf Life", href: "/expired-alert/config" },
    ],
  },
  {
    key: "purchasing",
    label: "Inbound Ikan",
    icon: LuFish,
    children: [{ key: "purchasing-penerimaan", label: "Penerimaan Ikan", href: "/inbound-ikan" }],
  },
  {
    key: "storage",
    label: "Storage",
    icon: LuWarehouse,
    children: [
      { key: "storage-loading-bay", label: "Loading Bay", href: "/storage/loading-bay" },
      {
        key: "storage-cold-storage",
        label: "Cold Storage",
        icon: LuSnowflake,
        children: [
          { key: "cs-monitor", label: "Monitor Stok", href: "/cold-storage" },
          { key: "cs-assign", label: "Penentuan Lokasi", href: "/cold-storage/assign-location" },
          { key: "cs-move", label: "Pemindahan Lokasi", href: "/cold-storage/move-batch" },
          { key: "cs-history", label: "Histori Batch", href: "/cold-storage/batch-history" },
          { key: "cs-disposal", label: "Disposal", href: "/cold-storage/disposal" },
          { key: "cs-structure", label: "Struktur Gudang", href: "/cold-storage/structure" },
          { key: "cs-opname", label: "Stock Opname", href: "/cold-storage/stock-opname" },
          { key: "cs-merge", label: "Gabung Batch", href: "/cold-storage/batch-merge" },
        ],
      },
    ],
  },
  {
    key: "stock-outbound",
    label: "Pengeluaran Stok",
    icon: LuPackageOpen,
    children: STOCK_OUTBOUND_ITEM.children,
  },
  {
    key: "orders",
    label: "Order Ikan",
    icon: HiOutlineShoppingCart,
    children: [
      { key: "order-quotation", label: "Quotation", href: "/quotations" },
      { key: "order-rekap", label: "Rekap Penjualan", href: "/sales-rekap" },
    ],
  },
  {
    key: "audit-trail",
    label: "Audit Trail",
    icon: HiOutlineMagnifyingGlass,
    href: "/audit-trail",
  },
  {
    key: "reports",
    label: "Laporan",
    icon: LuChartBar,
    children: [
      { key: "report-generate", label: "Generate Laporan", href: "/reports" },
      { key: "report-history", label: "Riwayat Laporan", href: "/reports/history" },
    ],
  },
];

export const bottomMenu: MenuItem = {
  key: "settings",
  label: "Pengaturan",
  icon: HiOutlineCog6Tooth,
  href: "/settings",
};

// ─────────────────────────────────────────────
//  Static menu items (reused across roles)
// ─────────────────────────────────────────────

const PENERIMAAN_IKAN_ITEM: MenuItem = {
  key: "purchasing-penerimaan",
  label: "Dashboard Penerimaan",
  href: "/inbound-ikan",
};

const PURCHASE_ORDER_ITEM: MenuItem = {
  key: "purchasing-po",
  label: "Purchase Order",
  href: "/inbound-ikan/purchase-orders",
};

const RINGKASAN_SUPPLIER_ITEM: MenuItem = {
  key: "purchasing-ringkasan",
  label: "Ringkasan Supplier",
  href: "/inbound-ikan/ringkasan-supplier",
};

const REPORTS_MENU: MenuItem = {
  key: "reports",
  label: "Laporan",
  icon: LuChartBar,
  children: [
    { key: "report-generate", label: "Generate Laporan", href: "/reports" },
  ],
};

// ─────────────────────────────────────────────
//  Role-based menu builders
// ─────────────────────────────────────────────

function inboundPurchasingItem(role: UserRole | undefined): MenuItem | null {
  const children: MenuItem[] = [];
  if (canReadDashboardPenerimaan(role)) {
    children.push(PENERIMAAN_IKAN_ITEM);
  }
  if (canAccessPurchaseOrder(role)) {
    children.push(PURCHASE_ORDER_ITEM);
  }
  if (canAccessRingkasanSupplier(role)) {
    children.push(RINGKASAN_SUPPLIER_ITEM);
  }
  if (children.length === 0) return null;
  return {
    key: "purchasing",
    label: "Inbound Ikan",
    icon: LuFish,
    children,
  };
}

function storageMenuForRole(role: UserRole | undefined): MenuItem | null {
  const csChildren: MenuItem[] = [
    { key: "cs-monitor", label: "Monitor Stok", href: "/cold-storage" },
    { key: "cs-assign", label: "Penentuan Lokasi", href: "/cold-storage/assign-location" },
    { key: "cs-move", label: "Pemindahan Lokasi", href: "/cold-storage/move-batch" },
    { key: "cs-history", label: "Histori Batch", href: "/cold-storage/batch-history" },
    { key: "cs-disposal", label: "Disposal", href: "/cold-storage/disposal" },
    { key: "cs-structure", label: "Struktur Gudang", href: "/cold-storage/structure" },
    { key: "cs-opname", label: "Stock Opname", href: "/cold-storage/stock-opname" },
    { key: "cs-merge", label: "Gabung Batch", href: "/cold-storage/batch-merge" },
  ].filter((item) => item.href && getColdStorageNavHrefsForRole(role).includes(item.href));

  const storageChildren: MenuItem[] = [];
  if (canAccessLoadingBay(role)) {
    storageChildren.push({ key: "storage-loading-bay", label: "Loading Bay", href: LOADING_BAY_PATH });
  }
  if (csChildren.length > 0) {
    storageChildren.push({
      key: "storage-cold-storage",
      label: "Cold Storage",
      icon: LuSnowflake,
      children: csChildren,
    });
  }
  if (storageChildren.length === 0) return null;
  return {
    key: "storage",
    label: "Storage",
    icon: LuWarehouse,
    children: storageChildren,
  };
}

function withInboundPurchasingMenu(menu: MenuItem[], role: UserRole | undefined): MenuItem[] {
  const inbound = inboundPurchasingItem(role);
  if (!inbound) return menu.filter((it) => it.key !== "purchasing");
  return menu.map((it) => (it.key === "purchasing" ? inbound : it));
}

function withStorageMenu(menu: MenuItem[], role: UserRole | undefined): MenuItem[] {
  const storage = storageMenuForRole(role);
  if (!storage) return menu.filter((it) => it.key !== "storage");
  return menu.map((it) => (it.key === "storage" ? storage : it));
}

/** Sembunyikan Master Data → Supplier kecuali Superadmin */
function withMasterDataSupplierMenuForRole(menu: MenuItem[], role: string | undefined): MenuItem[] {
  if (role === "SUPERADMIN") return menu;
  return menu.map((item) => {
    if (item.key !== "master-data" || !item.children?.length) return item;
    return {
      ...item,
      children: item.children.filter((c) => c.key !== "md-supplier"),
    };
  });
}

/** Sembunyikan/trim menu Pengeluaran Stok untuk role yang tidak diizinkan */
function withStockOutboundMenuForRole(menu: MenuItem[], role: string | undefined): MenuItem[] {
  const normalizedRole = role as UserRole | undefined;

  if (!normalizedRole || !STOCK_OUTBOUND_MODULE_ROLES.includes(normalizedRole)) {
    return menu.filter((item) => item.key !== "stock-outbound");
  }

  return menu
    .map((item) => {
      if (item.key !== "stock-outbound" || !item.children?.length) return item;
      const allowedChildren = item.children.filter((child) => {
        if (!child.href) return true;
        return isRoleAllowedForStockOutboundPath(normalizedRole, child.href);
      });
      if (allowedChildren.length === 0) return null;
      return { ...item, children: allowedChildren };
    })
    .filter((item): item is MenuItem => item !== null);
}

/** Sembunyikan Audit Trail untuk role yang tidak diizinkan */
function withAuditTrailMenuForRole(menu: MenuItem[], role: string | undefined): MenuItem[] {
  if (role && AUDIT_TRAIL_ROLES.includes(role as (typeof AUDIT_TRAIL_ROLES)[number])) {
    return menu;
  }
  return menu.filter((item) => item.key !== "audit-trail");
}

/**
 * Sembunyikan menu Laporan untuk role yang tidak diizinkan.
 * Jenis laporan yang ditampilkan di dalam halaman sudah difilter
 * oleh backend (GET /v1/reports/types) — FE tidak perlu filter lagi.
 */
function withReportsMenuForRole(menu: MenuItem[], role: string | undefined): MenuItem[] {
  if (role && REPORTS_ROLES.includes(role as (typeof REPORTS_ROLES)[number])) {
    return menu;
  }
  // Role tidak dikenal / tidak termasuk → sembunyikan menu laporan
  return menu.filter((item) => item.key !== "reports");
}

// ─────────────────────────────────────────────
//  Main export
// ─────────────────────────────────────────────

export function getMainMenuForRole(role: string | undefined): MenuItem[] {
  // ── Kepala Cabang ──
  if (role === "KEPALA_CABANG") {
    const inbound = inboundPurchasingItem(role);
    const menu: MenuItem[] = [
      { key: "home", label: "Home", icon: HiOutlineHome, href: "/home" },
      {
        key: "dashboard",
        label: "Dashboard",
        icon: HiOutlineChartBarSquare,
        children: [{ key: "dashboard-overview", label: "Overview", href: "/dashboard" }],
      },
    ];
    if (inbound) menu.push(inbound);
    menu.push(STOCK_OUTBOUND_ITEM, REPORTS_MENU);
    return withStockOutboundMenuForRole(menu, role);
  }

  // ── SBB Staff ──
  if (role === "SBB_STAFF") {
    const inbound = inboundPurchasingItem(role);
    const menu: MenuItem[] = [
      { key: "home", label: "Home", icon: HiOutlineHome, href: "/home" },
      {
        key: "dashboard",
        label: "Dashboard",
        icon: HiOutlineChartBarSquare,
        children: [{ key: "dashboard-overview", label: "Overview", href: "/dashboard" }],
      },
    ];
    if (inbound) menu.push(inbound);
    menu.push(REPORTS_MENU);
    return menu;
  }

  // ── QC Specialist: dashboard penerimaan + stock opname ──
  if (role === "QC_SPECIALIST") {
    const inbound = inboundPurchasingItem(role);
    const storage = storageMenuForRole(role);
    const menu: MenuItem[] = [
      { key: "home", label: "Home", icon: HiOutlineHome, href: "/home" },
    ];
    if (inbound) menu.push(inbound);
    if (storage) menu.push(storage);
    return menu;
  }

  // ── Warehouse Staff / Admin ──
  if (role === "WAREHOUSE_STAFF" || role === "WAREHOUSE_ADMIN") {
    const inbound = inboundPurchasingItem(role);
    const storage = storageMenuForRole(role);
    const menu: MenuItem[] = [
      { key: "home", label: "Home", icon: HiOutlineHome, href: "/home" },
      {
        key: "dashboard",
        label: "Dashboard",
        icon: HiOutlineChartBarSquare,
        children: [{ key: "dashboard-overview", label: "Overview", href: "/dashboard" }],
      },
    ];
    if (inbound) menu.push(inbound);
    if (storage) menu.push(storage);
    return withStockOutboundMenuForRole(
      withAuditTrailMenuForRole(menu, role),
      role
    );
  }

  // ── Semua role lain: full menu dengan filter bertahap ──
  return withReportsMenuForRole(
    withAuditTrailMenuForRole(
      withStockOutboundMenuForRole(
        withStorageMenu(
          withMasterDataSupplierMenuForRole(
            withInboundPurchasingMenu(mainMenu, role as UserRole),
            role as UserRole
          ),
          role as UserRole
        ),
        role
      ),
      role
    ),
    role
  );
}