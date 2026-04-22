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
} from "react-icons/lu";
import type { IconType } from "react-icons";

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
      { key: "expired-alert-dashboard", label: "Monitor",                  href: "/expired-alert" },
      { key: "expired-alert-config",    label: "Konfigurasi Shelf Life",   href: "/expired-alert/config" },
    ],
  },
  {
    key: "purchasing",
    label: "Inbound Ikan",
    icon: LuFish,
    children: [{ key: "purchasing-penerimaan", label: "Penerimaan Ikan", href: "/inbound-ikan" }],
  },
  {
    key: "cold-storage",
    label: "Cold Storage",
    icon: LuSnowflake,
    children: [
      { key: "cs-monitor", label: "Monitor Stok", href: "/cold-storage" },
      { key: "cs-assign", label: "Penentuan Lokasi", href: "/cold-storage/assign-location" },
      { key: "cs-move", label: "Pemindahan Batch", href: "/cold-storage/move-batch" },
      { key: "cs-history", label: "Histori Batch", href: "/cold-storage/batch-history" },
      { key: "cs-disposal", label: "Disposal", href: "/cold-storage/disposal" },
      { key: "cs-structure", label: "Struktur Gudang", href: "/cold-storage/structure" },
    ],
  },
  {
    key: "stock-outbound",
    label: "Pengeluaran Stok",
    icon: LuPackageOpen,
    children: [
      { key: "so-receiving",      label: "Penerimaan Sales Order", href: "/stock-outbound/penerimaan-sales-order" },
      { key: "pallet-allocation", label: "Data Batch Alokasi",     href: "/stock-outbound/alokasi-pallet" },
      { key: "fefo-transaction",  label: "Transaksi FEFO",         href: "/stock-outbound/transaksi-fefo" },
      { key: "export-docs",       label: "Dokumen Ekspor",         href: "/stock-outbound/dokumen-ekspor" },
    ],
  },
  {
    key: "orders",
    label: "Order Ikan",
    icon: HiOutlineShoppingCart,
    children: [
      { key: "order-quotation",   label: "Quotation",       href: "/quotations" },
      { key: "order-rekap",       label: "Rekap Penjualan", href: "/sales-rekap" },
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
      { key: "report-history",  label: "Riwayat Laporan",  href: "/reports/history" },
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
    { key: "report-history",  label: "Riwayat Laporan",  href: "/reports/history" },
  ],
};

// ─────────────────────────────────────────────
//  Role-based menu builders
// ─────────────────────────────────────────────

function inboundPurchasingItem(role: string | undefined): MenuItem {
  const showRingkasan =
    role === "SBB_STAFF" || role === "SUPERADMIN" || role === "KEPALA_CABANG";
  const canViewPo =
    role === "SUPERADMIN" || role === "SBB_STAFF" ||
    role === "KEPALA_CABANG" || role === "WAREHOUSE_STAFF";

  const baseChildren = canViewPo
    ? [PENERIMAAN_IKAN_ITEM, PURCHASE_ORDER_ITEM]
    : [PENERIMAAN_IKAN_ITEM];

  return {
    key: "purchasing",
    label: "Inbound Ikan",
    icon: LuFish,
    children: showRingkasan ? [...baseChildren, RINGKASAN_SUPPLIER_ITEM] : baseChildren,
  };
}

function withInboundPurchasingMenu(menu: MenuItem[], role: string | undefined): MenuItem[] {
  return menu.map((it) => (it.key === "purchasing" ? inboundPurchasingItem(role) : it));
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
  // ── Kepala Cabang: menu terbatas ──
  if (role === "KEPALA_CABANG") {
    return [
      { key: "home",      label: "Home",      icon: HiOutlineHome,          href: "/home" },
      { key: "dashboard", label: "Dashboard", icon: HiOutlineChartBarSquare,
        children: [{ key: "dashboard-overview", label: "Overview", href: "/dashboard" }] },
      inboundPurchasingItem(role),
      REPORTS_MENU,
    ];
  }

  // ── SBB Staff: menu terbatas ──
  if (role === "SBB_STAFF") {
    return [
      { key: "home",      label: "Home",      icon: HiOutlineHome,          href: "/home" },
      { key: "dashboard", label: "Dashboard", icon: HiOutlineChartBarSquare,
        children: [{ key: "dashboard-overview", label: "Overview", href: "/dashboard" }] },
      inboundPurchasingItem(role),
      REPORTS_MENU,
    ];
  }

  // ── Semua role lain: full menu dengan filter bertahap ──
  return withReportsMenuForRole(
    withAuditTrailMenuForRole(
      withMasterDataSupplierMenuForRole(
        withInboundPurchasingMenu(mainMenu, role),
        role
      ),
      role
    ),
    role
  );
}