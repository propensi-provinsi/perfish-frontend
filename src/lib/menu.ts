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
      { key: "expired-alert-dashboard", label: "Dashboard", href: "/expired-alert" },
      { key: "expired-alert-config", label: "Konfigurasi Shelf Life", href: "/expired-alert/config" },
    ],
  },
  {
    key: "purchasing",
    label: "Pembelian Ikan",
    icon: LuFish,
    href: "/purchasing",
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
      { key: "order-list", label: "Daftar Order", href: "/orders" },
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
