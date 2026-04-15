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
      { key: "md-financial", label: "Financial Support", href: "/master-data/financial-support" },
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
    href: "/batch-activity",
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
    key: "cold-storage",
    label: "Cold Storage",
    icon: LuSnowflake,
    href: "/cold-storage",
  },
  {
    key: "stock-outbound",
    label: "Pengeluaran Stok",
    icon: LuPackageOpen,
    children: [
      { key: "so-list", label: "Daftar Pengeluaran", href: "/stock-outbound" },
    ],
  },
  {
    key: "orders",
    label: "Order Ikan",
    icon: HiOutlineShoppingCart,
    children: [
      { key: "order-quotation", label: "Quotation", href: "/quotations" },
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
      { key: "report-list", label: "Daftar Laporan", href: "/reports" },
    ],
  },
];

export const bottomMenu: MenuItem = {
  key: "settings",
  label: "Pengaturan",
  icon: HiOutlineCog6Tooth,
  href: "/settings",
};

const PENERIMAAN_IKAN_ITEM: MenuItem = {
  key: "purchasing-penerimaan",
  label: "Penerimaan Ikan",
  href: "/inbound-ikan",
};

const RINGKASAN_SUPPLIER_ITEM: MenuItem = {
  key: "purchasing-ringkasan",
  label: "Ringkasan Supplier",
  href: "/ringkasan-supplier",
};

/** Submenu Inbound Ikan: Ringkasan Supplier untuk Staf SBB, Superadmin, dan Kepala Cabang */
function inboundPurchasingItem(role: string | undefined): MenuItem {
  const showRingkasan =
    role === "SBB_STAFF" || role === "SUPERADMIN" || role === "KEPALA_CABANG";
  return {
    key: "purchasing",
    label: "Inbound Ikan",
    icon: LuFish,
    children: showRingkasan ? [PENERIMAAN_IKAN_ITEM, RINGKASAN_SUPPLIER_ITEM] : [PENERIMAAN_IKAN_ITEM],
  };
}

function withInboundPurchasingMenu(menu: MenuItem[], role: string | undefined): MenuItem[] {
  return menu.map((it) => (it.key === "purchasing" ? inboundPurchasingItem(role) : it));
}

/** Hilangkan menu Master Data → Supplier kecuali Superadmin (master data supplier hanya via UI Superadmin). */
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

function withAuditTrailMenuForRole(menu: MenuItem[], role: string | undefined): MenuItem[] {
  if (role && AUDIT_TRAIL_ROLES.includes(role as (typeof AUDIT_TRAIL_ROLES)[number])) {
    return menu;
  }
  return menu.filter((item) => item.key !== "audit-trail");
}

/** Menu untuk Kepala Cabang: tanpa Master Data Supplier (gunakan Ringkasan Supplier) */
export function getMainMenuForRole(role: string | undefined): MenuItem[] {
  if (role === "KEPALA_CABANG") {
    return [
      { key: "home", label: "Home", icon: HiOutlineHome, href: "/home" },
      { key: "dashboard", label: "Dashboard", icon: HiOutlineChartBarSquare, children: [{ key: "dashboard-overview", label: "Overview", href: "/dashboard" }] },
      inboundPurchasingItem(role),
      { key: "reports", label: "Laporan", icon: LuChartBar, children: [{ key: "report-list", label: "Daftar Laporan", href: "/reports" }] },
    ];
  }
  if (role === "SBB_STAFF") {
    return [
      { key: "home", label: "Home", icon: HiOutlineHome, href: "/home" },
      { key: "dashboard", label: "Dashboard", icon: HiOutlineChartBarSquare, children: [{ key: "dashboard-overview", label: "Overview", href: "/dashboard" }] },
      inboundPurchasingItem(role),
      { key: "reports", label: "Laporan", icon: LuChartBar, children: [{ key: "report-list", label: "Daftar Laporan", href: "/reports" }] },
    ];
  }
  return withAuditTrailMenuForRole(
    withMasterDataSupplierMenuForRole(withInboundPurchasingMenu(mainMenu, role), role),
    role
  );
}
