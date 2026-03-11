import {
  HiOutlineHome,
  HiOutlineChartBarSquare,
  HiOutlineClipboardDocumentList,
  HiOutlineCube,
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
    key: "purchasing",
    label: "Inbound Ikan",
    icon: LuFish,
    children: [
      {
        key: "purchasing-inbound",
        label: "Inbound Ikan",
        href: "/inbound-ikan",
      },
    ],
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
