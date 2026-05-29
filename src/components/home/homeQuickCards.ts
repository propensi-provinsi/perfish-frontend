import type { UserRole } from "@/types";
import { getMainMenuForRole, REPORTS_ROLES } from "@/lib/menu";
import {
  canAccessLoadingBay,
  canAccessPurchaseOrder,
  canAccessRingkasanSupplier,
  canReadDashboardPenerimaan,
  getColdStorageNavHrefsForRole,
  LOADING_BAY_PATH,
} from "@/lib/rbac";
import {
  isRoleAllowedForStockOutboundPath,
  STOCK_OUTBOUND_MODULE_ROLES,
} from "@/lib/stock-outbound-rbac";
import {
  HiOutlineChartBarSquare,
  HiOutlineClipboardDocumentList,
  HiOutlineCube,
  HiOutlineExclamationTriangle,
  HiOutlineShoppingCart,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { LuFish, LuPackageOpen, LuChartBar, LuWarehouse } from "react-icons/lu";
import type { IconType } from "react-icons";

export interface HomeQuickCard {
  label: string;
  description: string;
  icon: IconType;
  href: string;
  color: string;
}

const DASHBOARD_CARD: HomeQuickCard = {
  label: "Dashboard",
  description: "Lihat overview & statistik",
  icon: HiOutlineChartBarSquare,
  href: "/dashboard",
  color: "bg-cyan/20 text-cyan ring-cyan/30",
};

const MASTER_DATA_CARD: HomeQuickCard = {
  label: "Master Data",
  description: "Kelola data ikan, storage, dll",
  icon: HiOutlineClipboardDocumentList,
  href: "/master-data/fish",
  color: "bg-green/20 text-green ring-green/30",
};

const BATCH_ACTIVITY_CARD: HomeQuickCard = {
  label: "Batch Activity",
  description: "Aktivitas batch processing",
  icon: HiOutlineCube,
  href: "/batch-activity/traceability",
  color: "bg-yellow/20 text-yellow ring-yellow/30",
};

const EXPIRED_ALERT_CARD: HomeQuickCard = {
  label: "Expired Alert",
  description: "Notifikasi umur simpan batch",
  icon: HiOutlineExclamationTriangle,
  href: "/expired-alert",
  color: "bg-red/20 text-red ring-red/30",
};

const STOCK_OUTBOUND_CARD: HomeQuickCard = {
  label: "Pengeluaran Stok",
  description: "Kelola pengeluaran stok",
  icon: LuPackageOpen,
  href: "/stock-outbound/penerimaan-sales-order",
  color: "bg-red/20 text-red ring-red/30",
};

const ORDER_IKAN_CARD: HomeQuickCard = {
  label: "Order Ikan",
  description: "Kelola order pelanggan",
  icon: HiOutlineShoppingCart,
  href: "/quotations",
  color: "bg-green/20 text-green ring-green/30",
};

const AUDIT_TRAIL_CARD: HomeQuickCard = {
  label: "Audit Trail",
  description: "Riwayat aktivitas sistem",
  icon: HiOutlineMagnifyingGlass,
  href: "/audit-trail",
  color: "bg-yellow/20 text-yellow ring-yellow/30",
};

const REPORTS_CARD: HomeQuickCard = {
  label: "Laporan",
  description: "Laporan dan analisis",
  icon: LuChartBar,
  href: "/reports",
  color: "bg-cyan/20 text-cyan ring-cyan/30",
};

function inboundCardForRole(role: UserRole): HomeQuickCard | null {
  if (canReadDashboardPenerimaan(role)) {
    return {
      label: "Penerimaan Ikan",
      description: "Dashboard penerimaan & proses inbound",
      icon: LuFish,
      href: "/inbound-ikan",
      color: "bg-cyan/20 text-cyan ring-cyan/30",
    };
  }
  if (canAccessPurchaseOrder(role)) {
    return {
      label: "Purchase Order",
      description: "Kelola purchase order inbound",
      icon: LuFish,
      href: "/inbound-ikan/purchase-orders",
      color: "bg-cyan/20 text-cyan ring-cyan/30",
    };
  }
  if (canAccessRingkasanSupplier(role)) {
    return {
      label: "Ringkasan Supplier",
      description: "Audit & ringkasan supplier",
      icon: LuFish,
      href: "/inbound-ikan/ringkasan-supplier",
      color: "bg-cyan/20 text-cyan ring-cyan/30",
    };
  }
  return null;
}

function storageCardForRole(role: UserRole): HomeQuickCard | null {
  const hasLoadingBay = canAccessLoadingBay(role);
  const coldHrefs = getColdStorageNavHrefsForRole(role);
  if (!hasLoadingBay && coldHrefs.length === 0) return null;

  const href = hasLoadingBay ? LOADING_BAY_PATH : coldHrefs[0]!;

  return {
    label: "Storage",
    description: "Loading bay, cold storage & manajemen gudang",
    icon: LuWarehouse,
    href,
    color: "bg-indigo-500/20 text-indigo-300 ring-indigo-400/30",
  };
}

function stockOutboundCardForRole(role: UserRole): HomeQuickCard | null {
  if (!STOCK_OUTBOUND_MODULE_ROLES.includes(role)) return null;

  const candidates = [
    "/stock-outbound/penerimaan-sales-order",
    "/stock-outbound/alokasi-pallet",
    "/stock-outbound/transaksi-fefo",
    "/stock-outbound/dokumen-ekspor",
    "/stock-outbound/riwayat-distribusi",
  ];
  const href = candidates.find((p) => isRoleAllowedForStockOutboundPath(role, p));
  if (!href) return null;

  return { ...STOCK_OUTBOUND_CARD, href };
}

function hasMenuKey(role: UserRole, key: string): boolean {
  return getMainMenuForRole(role).some((item) => item.key === key);
}

/** Kartu Menu Utama — disaring sesuai menu sidebar per role. */
export function getHomeQuickCardsForRole(
  role: UserRole | undefined | null,
): HomeQuickCard[] {
  if (!role) return [];

  const cards: HomeQuickCard[] = [];

  if (hasMenuKey(role, "dashboard")) cards.push(DASHBOARD_CARD);
  if (hasMenuKey(role, "master-data")) cards.push(MASTER_DATA_CARD);
  if (hasMenuKey(role, "batch-activity")) cards.push(BATCH_ACTIVITY_CARD);
  if (hasMenuKey(role, "expired-alert")) cards.push(EXPIRED_ALERT_CARD);

  const inbound = inboundCardForRole(role);
  if (inbound) cards.push(inbound);

  const storage = storageCardForRole(role);
  if (storage) cards.push(storage);

  const stockOut = stockOutboundCardForRole(role);
  if (stockOut) cards.push(stockOut);

  if (hasMenuKey(role, "orders")) cards.push(ORDER_IKAN_CARD);
  if (hasMenuKey(role, "audit-trail")) cards.push(AUDIT_TRAIL_CARD);
  if (REPORTS_ROLES.includes(role as (typeof REPORTS_ROLES)[number])) {
    cards.push(REPORTS_CARD);
  }

  return cards;
}
