"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { getColdStorages } from "@/lib/expiry";
import { listColdStorageStocks } from "@/lib/coldstorage-api";
import type {
  ColdStorageData,
  ColdStorageStockRow,
  StockCategoryStatus,
} from "@/types";

const STATUS_OPTIONS: StockCategoryStatus[] = [
  "FRESH",
  "WARNING",
  "EXPIRED",
  "QUARANTINE",
];

function statusBadgeClass(status: StockCategoryStatus) {
  switch (status) {
    case "EXPIRED":
      return "bg-red-100 text-red-700";
    case "WARNING":
      return "bg-yellow-100 text-yellow-800";
    case "FRESH":
      return "bg-green-100 text-green-700";
    case "QUARANTINE":
      return "bg-slate-200 text-slate-700";
    case "DISPOSED":
      return "bg-gray-200 text-gray-600";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

/**
 * Dashboard monitoring stok cold storage (E05-PBI-02).
 * Menampilkan tabel stok dengan filter gudang & kategori status, plus
 * tombol cepat ke form Penentuan Lokasi (E05-PBI-01) dan Disposal (E05-PBI-05).
 */
export default function ColdStorageDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [coldStorages, setColdStorages] = useState<ColdStorageData[]>([]);
  const [rows, setRows] = useState<ColdStorageStockRow[]>([]);

  const [warehouseId, setWarehouseId] = useState<number | "">("");
  const [kategoriStatus, setKategoriStatus] = useState<StockCategoryStatus | "">("");

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [coldStorageData, stocksData] = await Promise.all([
        getColdStorages(),
        listColdStorageStocks({
          warehouseId: warehouseId || undefined,
          kategoriStatus: kategoriStatus || undefined,
        }),
      ]);
      setColdStorages(coldStorageData.filter((cs) => cs.isActive));
      setRows(stocksData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat dashboard Cold Storage";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId, kategoriStatus]);

  const summary = useMemo(() => {
    const totals = { FRESH: 0, WARNING: 0, EXPIRED: 0, QUARANTINE: 0, DISPOSED: 0 };
    rows.forEach((r) => {
      totals[r.kategoriStatus] = (totals[r.kategoriStatus] ?? 0) + 1;
    });
    return totals;
  }, [rows]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-navy dark:text-white">Cold Storage Monitor</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Monitoring stok per gudang dan batch, umur simpan dihitung otomatis setiap hari.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard title="Total" value={rows.length} tone="slate" />
        <SummaryCard title="Fresh" value={summary.FRESH} tone="green" />
        <SummaryCard title="Warning" value={summary.WARNING} tone="yellow" />
        <SummaryCard title="Expired" value={summary.EXPIRED} tone="red" />
        <SummaryCard title="Quarantine" value={summary.QUARANTINE} tone="slate" />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filter & Aksi</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/cold-storage/assign-location">
              <Button size="sm">Tetapkan Lokasi Batch</Button>
            </Link>
            <Link href="/cold-storage/disposal">
              <Button size="sm" variant="outline">
                Disposal
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={() => void loadData()} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Gudang</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
            >
              <option value="">Semua Gudang</option>
              {coldStorages.map((cs) => (
                <option key={cs.coldStorageId} value={cs.coldStorageId}>
                  {cs.csCode} — {cs.csName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Kategori Status</label>
            <select
              value={kategoriStatus}
              onChange={(e) => setKategoriStatus((e.target.value as StockCategoryStatus) || "")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
            >
              <option value="">Semua Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Daftar Stok</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700">
                <th className="px-3 py-2">Batch</th>
                <th className="px-3 py-2">Species</th>
                <th className="px-3 py-2">Gudang / Area</th>
                <th className="px-3 py-2">Tgl Masuk</th>
                <th className="px-3 py-2">Umur Simpan</th>
                <th className="px-3 py-2">Stok</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-5 text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((row) => (
                  <tr key={`${row.batchId}-${row.warehouseId}`} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{row.batchNumber}</td>
                    <td className="px-3 py-2">{row.speciesName ?? "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span>{row.warehouseCode} — {row.warehouseName}</span>
                        <span className="text-xs text-gray-500">Area: {row.storageArea}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">{row.tanggalMasuk}</td>
                    <td className="px-3 py-2">
                      {row.umurSimpanDays} hari
                      {row.umurSimpanBulan > 0 && (
                        <span className="ml-1 text-xs text-gray-500">({row.umurSimpanBulan} bln)</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {row.jumlahStok ?? 0} {row.unit ?? ""}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(row.kategoriStatus)}`}>
                        {row.kategoriStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 py-5 text-gray-500">
                    Belum ada stok batch aktif di Cold Storage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Data tidak dapat dihapus langsung dari halaman ini — gunakan menu Disposal untuk stok yang sudah expired.
        </p>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: "slate" | "green" | "yellow" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "bg-green-100 text-green-700"
      : tone === "yellow"
        ? "bg-yellow-100 text-yellow-800"
        : tone === "red"
          ? "bg-red-100 text-red-700"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${toneClass}`}>{title}</span>
      </div>
    </div>
  );
}
