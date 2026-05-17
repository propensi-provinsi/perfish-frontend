"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/cold-storage", label: "Monitor Stok" },
  { href: "/cold-storage/assign-location", label: "Penentuan Lokasi" },
  { href: "/cold-storage/move-batch", label: "Pemindahan Lokasi" },
  { href: "/cold-storage/batch-history", label: "Histori Batch" },
  { href: "/cold-storage/disposal", label: "Disposal" },
  { href: "/cold-storage/structure", label: "Struktur Gudang" },
  { href: "/cold-storage/stock-opname", label: "Stock Opname" },
  { href: "/cold-storage/batch-merge", label: "Gabung Batch" },
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

  return (
    <nav className="rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-dark-card">
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {tabs.map((tab) => {
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
