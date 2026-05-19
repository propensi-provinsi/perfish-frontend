"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canAccessColdStorageNav, type ColdStorageNavKey } from "@/lib/rbac";

const tabs: { href: string; label: string; key: ColdStorageNavKey }[] = [
  { href: "/cold-storage", label: "Monitor Stok", key: "monitor" },
  { href: "/cold-storage/assign-location", label: "Penentuan Lokasi", key: "assign" },
  { href: "/cold-storage/move-batch", label: "Pemindahan Lokasi", key: "move" },
  { href: "/cold-storage/batch-history", label: "Histori Batch", key: "history" },
  { href: "/cold-storage/disposal", label: "Disposal", key: "disposal" },
  { href: "/cold-storage/structure", label: "Struktur Gudang", key: "structure" },
  { href: "/cold-storage/stock-opname", label: "Stock Opname", key: "opname" },
  { href: "/cold-storage/batch-merge", label: "Gabung Batch", key: "merge" },
];

function isActive(pathname: string, href: string) {
  if (href === "/cold-storage") return pathname === href;
  if (href === "/cold-storage/structure") return pathname.startsWith("/cold-storage/structure");
  if (href === "/cold-storage/stock-opname") return pathname.startsWith("/cold-storage/stock-opname");
  if (href === "/cold-storage/batch-merge") return pathname.startsWith("/cold-storage/batch-merge");
  return pathname.startsWith(href);
}

export default function ColdStorageModuleNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const visibleTabs = tabs.filter((tab) => canAccessColdStorageNav(user?.role, tab.key));

  if (visibleTabs.length === 0) return null;

  return (
    <nav className="rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-dark-card">
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {visibleTabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`block rounded-lg px-3 py-2 text-center text-sm font-medium transition ${
                  active
                    ? "bg-cyan text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-dark-section dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
