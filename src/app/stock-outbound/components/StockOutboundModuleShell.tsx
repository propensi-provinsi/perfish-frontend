"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

const tabs = [
  {
    href: "/stock-outbound/penerimaan-sales-order",
    label: "Penerimaan Sales Order",
  },
  {
    href: "/stock-outbound/alokasi-pallet",
    label: "Data Batch Alokasi",
  },
  {
    href: "/stock-outbound/transaksi-fefo",
    label: "Transaksi FEFO",
  },
  {
    href: "/stock-outbound/dokumen-ekspor",
    label: "Dokumen Ekspor",
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href;
}

export default function StockOutboundModuleShell({ title, description, children }: Props) {
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-5">
          <header className="space-y-1">
            <h1 className="text-2xl font-bold text-navy dark:text-white">{title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </header>

          <nav className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-2">
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
              {tabs.map((tab) => {
                const active = isActive(pathname, tab.href);
                return (
                  <li key={tab.href}>
                    <Link
                      href={tab.href}
                      className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-cyan text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-dark-section dark:text-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {children}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
