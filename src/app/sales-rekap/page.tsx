"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HiOutlineUsers,
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlineFunnel,
} from "react-icons/hi2";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { salesRekapApi } from "@/lib/quotation-api";
import type { SalesRekapData } from "@/types/quotation";

export default function SalesRekapPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <SalesRekapContent />
      </AppShell>
    </ProtectedRoute>
  );
}

/* ================================================================
   Helpers
   ================================================================ */

function formatRupiah(val?: number | null) {
  if (val == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

function formatKg(val?: number | null) {
  if (val == null) return "—";
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(val)} kg`;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function firstDayOfYear() {
  return `${new Date().getFullYear()}-01-01`;
}

/* ================================================================
   Summary Card
   ================================================================ */

function SummaryCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-5 shadow-sm flex items-center gap-4">
      <div className={`rounded-xl p-3 ${accent}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-navy dark:text-white mt-0.5 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

/* ================================================================
   Main
   ================================================================ */

function SalesRekapContent() {
  const [rows, setRows] = useState<SalesRekapData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState(firstDayOfYear());
  const [endDate, setEndDate] = useState(today());
  const [customerSearch, setCustomerSearch] = useState("");

  const fetchRekap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await salesRekapApi.getRekap({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setRows(data.data);
    } catch {
      setError("Gagal memuat data rekap penjualan");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchRekap(); }, [fetchRekap]);

  // Client-side filter by customer name
  const displayed = customerSearch.trim()
    ? rows.filter((r) => r.customerName.toLowerCase().includes(customerSearch.toLowerCase()))
    : rows;

  // Summary totals
  const totalCustomer  = displayed.length;
  const totalOrder     = displayed.reduce((s, r) => s + r.totalOrders, 0);
  const totalNilai     = displayed.reduce((s, r) => s + r.totalValueRp, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Rekap Penjualan per Customer</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Analisis kontribusi dan performa penjualan per customer
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <HiOutlineFunnel className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Filter Periode</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section
                dark:text-gray-100 px-3 py-2 text-sm focus:border-cyan focus:outline-none
                focus:ring-2 focus:ring-cyan/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section
                dark:text-gray-100 px-3 py-2 text-sm focus:border-cyan focus:outline-none
                focus:ring-2 focus:ring-cyan/20 transition-colors"
            />
          </div>
          <div className="self-end">
            <label className="block text-xs text-gray-400 mb-1">Cari Customer</label>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Nama customer…"
              className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section
                dark:text-gray-100 px-3 py-2 text-sm focus:border-cyan focus:outline-none
                focus:ring-2 focus:ring-cyan/20 dark:placeholder:text-gray-500 transition-colors w-48"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">{error}</div>
      )}

      {/* Summary Cards */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Total Customer"
            value={totalCustomer.toString()}
            icon={<HiOutlineUsers className="h-5 w-5 text-cyan" />}
            accent="bg-cyan/10"
          />
          <SummaryCard
            label="Total Order"
            value={totalOrder.toString()}
            icon={<HiOutlineShoppingBag className="h-5 w-5 text-green" />}
            accent="bg-green-light"
          />
          <SummaryCard
            label="Total Nilai Penjualan"
            value={formatRupiah(totalNilai)}
            icon={<HiOutlineCurrencyDollar className="h-5 w-5 text-yellow" />}
            accent="bg-yellow-light"
          />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-8">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-cyan" />
          Memuat data rekap…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-dark-section">
              <tr>
                {[
                  "Ranking",
                  "Nama Customer",
                  "Tipe",
                  "Total Order",
                  "Total Kuantitas",
                  "Total Nilai (Rp)",
                  "Rata-rata Order",
                  "Kontribusi",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                    {customerSearch ? "Tidak ada customer yang cocok." : "Belum ada data penjualan untuk periode ini."}
                  </td>
                </tr>
              ) : (
                displayed.map((row) => (
                  <tr key={row.customerId} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    {/* Ranking */}
                    <td className="px-4 py-3">
                      <RankBadge rank={row.ranking} />
                    </td>

                    {/* Customer name */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {row.customerName}
                      </p>
                    </td>

                    {/* Tipe */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap
                        ${row.customerType === "Ekspor"
                          ? "bg-cyan/10 text-cyan"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
                        {row.customerType || "—"}
                      </span>
                    </td>

                    {/* Total Order */}
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                      {row.totalOrders}
                    </td>

                    {/* Total Qty */}
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 tabular-nums whitespace-nowrap">
                      {formatKg(row.totalQuantityKg)}
                    </td>

                    {/* Total Nilai */}
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 tabular-nums whitespace-nowrap">
                      {formatRupiah(row.totalValueRp)}
                    </td>

                    {/* Avg Order */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
                      {formatRupiah(row.avgOrderValueRp)}
                    </td>

                    {/* Kontribusi + progress bar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-cyan transition-all duration-500"
                            style={{ width: `${Math.min(row.kontribusiPersen, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums w-10 text-right">
                          {row.kontribusiPersen.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Rank Badge
   ================================================================ */

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow text-white text-xs font-bold shadow-sm">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-400 text-white text-xs font-bold">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow/60 text-white text-xs font-bold">
        3
      </span>
    );
  }
  return (
    <span className="text-sm text-gray-400 font-medium tabular-nums pl-1.5">
      {rank}
    </span>
  );
}