"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/cold-storage", label: "Monitor Stok" },
  { href: "/cold-storage/assign-location", label: "Penentuan Lokasi" },
  { href: "/cold-storage/move-batch", label: "Pemindahan Batch" },
  { href: "/cold-storage/batch-history", label: "Histori Batch" },
  { href: "/cold-storage/disposal", label: "Disposal" },
  { href: "/cold-storage/structure", label: "Struktur Gudang" },
];

function isActive(pathname: string, href: string) {
  if (href === "/cold-storage") return pathname === href;
  if (href === "/cold-storage/structure") return pathname.startsWith("/cold-storage/structure");
  return pathname.startsWith(href);
}

export default function ColdStorageModuleShell() {
  const pathname = usePathname();

  return (
    <nav className="rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-dark-card">
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`block rounded-lg px-3 py-2 text-center text-sm font-medium transition ${
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
  );
}
