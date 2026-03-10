"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import {
  HiOutlineChartBarSquare,
  HiOutlineClipboardDocumentList,
  HiOutlineCube,
  HiOutlineExclamationTriangle,
  HiOutlineShoppingCart,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { LuFish, LuSnowflake, LuPackageOpen, LuChartBar } from "react-icons/lu";
import type { IconType } from "react-icons";

interface QuickCard {
  label: string;
  description: string;
  icon: IconType;
  href: string;
  color: string;
}

const quickCards: QuickCard[] = [
  {
    label: "Dashboard",
    description: "Lihat overview & statistik",
    icon: HiOutlineChartBarSquare,
    href: "/dashboard",
    color: "bg-cyan/10 text-cyan",
  },
  {
    label: "Master Data",
    description: "Kelola data ikan, storage, dll",
    icon: HiOutlineClipboardDocumentList,
    href: "/master-data/fish",
    color: "bg-green/10 text-green",
  },
  {
    label: "Batch Activity",
    description: "Aktivitas batch processing",
    icon: HiOutlineCube,
    href: "/batch-activity",
    color: "bg-yellow/10 text-yellow",
  },
  {
    label: "Expired Alert",
    description: "Notifikasi umur simpan batch",
    icon: HiOutlineExclamationTriangle,
    href: "/expired-alert",
    color: "bg-red/10 text-red",
  },
  {
    label: "Pembelian Ikan",
    description: "Catat pembelian dari supplier",
    icon: LuFish,
    href: "/purchasing",
    color: "bg-cyan/10 text-cyan",
  },
  {
    label: "Cold Storage",
    description: "Manajemen cold storage",
    icon: LuSnowflake,
    href: "/cold-storage",
    color: "bg-blue-100 text-blue-600",
  },
  {
    label: "Pengeluaran Stok",
    description: "Kelola pengeluaran stok",
    icon: LuPackageOpen,
    href: "/stock-outbound",
    color: "bg-red/10 text-red",
  },
  {
    label: "Order Ikan",
    description: "Kelola order pelanggan",
    icon: HiOutlineShoppingCart,
    href: "/orders",
    color: "bg-green/10 text-green",
  },
  {
    label: "Audit Trail",
    description: "Riwayat aktivitas sistem",
    icon: HiOutlineMagnifyingGlass,
    href: "/audit-trail",
    color: "bg-yellow/10 text-yellow",
  },
  {
    label: "Laporan",
    description: "Laporan dan analisis",
    icon: LuChartBar,
    href: "/reports",
    color: "bg-cyan/10 text-cyan",
  },
];

export default function HomePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <HomeContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function HomeContent() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-navy to-navy-light p-6 md:p-8 text-white">
        <h1 className="text-2xl md:text-3xl font-bold">
          Selamat Datang, {user?.name} 👋
        </h1>
        <p className="mt-2 text-gray-300 text-sm md:text-base max-w-xl">
          PERFISH — Perindo Fish Information System. Kelola seluruh data
          perikanan PT Perindo dari satu dashboard terpadu.
        </p>
      </div>

      {/* Quick access grid */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Menu Utama
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickCards.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.label}
                href={card.href}
                className="group flex items-start gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-5 shadow-sm hover:shadow-md hover:border-cyan/40 transition-all"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-cyan transition-colors">
                    {card.label}
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {card.description}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
