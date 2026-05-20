"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TableListPaginationFooter,
  TableListPaginationToolbar,
  useClientTablePagination,
} from "@/components/ui/TableListPagination";
import Link from "next/link";
import Button from "@/components/ui/Button";
import BatchQrCode from "@/components/cold-storage/BatchQrCode";
import RejectBatchLegend from "@/components/cold-storage/RejectBatchLegend";
import { batchDetailHref } from "@/lib/batch-detail-url";
import { isInboundRejectBatchRow, rejectBatchRowClass } from "@/lib/batch-quality";
import { actionBtn } from "@/lib/ui-action";
import { getColdStorages } from "@/lib/expiry";
import { listColdStorageStocks } from "@/lib/coldstorage-api";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import { stockCategoryStatusBadgeClass } from "@/lib/coldstorage-status";
import { alertErrorClass, formatDateDdMmYyyy, inputClass } from "@/lib/coldstorage-ui";
import type { ColdStorageData, ColdStorageStockRow, StockCategoryStatus } from "@/types";

const STATUS_OPTIONS: StockCategoryStatus[] = ["FRESH", "WARNING", "EXPIRED", "QUARANTINE"];
type BreakdownView = "chart" | "table";

function toNumber(value: number | string | null | undefined): number {
  if (value == null || value === "") return 0;
  const parsed = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatKg(value: number): string {
  return `${value.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg`;
}

export default function ColdStorageDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coldStorages, setColdStorages] = useState<ColdStorageData[]>([]);
  const [rows, setRows] = useState<ColdStorageStockRow[]>([]);
  const [warehouseId, setWarehouseId] = useState<number | "">("");
  const [kategoriStatus, setKategoriStatus] = useState<StockCategoryStatus | "">("");
  const [breakdownView, setBreakdownView] = useState<BreakdownView>("chart");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
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
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dashboard Cold Storage");
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
    let totalStockKg = 0;
    let utilizationSum = 0;
    let utilizationCount = 0;
    rows.forEach((r) => {
      totals[r.kategoriStatus] = (totals[r.kategoriStatus] ?? 0) + 1;
      totalStockKg += toNumber(r.jumlahStok);
      const util = toNumber(r.kandangUtilizationPct);
      if (util > 0) {
        utilizationSum += util;
        utilizationCount += 1;
      }
    });
    return {
      ...totals,
      totalStockKg,
      activeBatchCount: rows.length,
      averageUtilizationPct: utilizationCount ? utilizationSum / utilizationCount : 0,
    };
  }, [rows]);

  const statusBreakdown = useMemo(() => {
    return STATUS_OPTIONS.map((status) => {
      const matching = rows.filter((row) => row.kategoriStatus === status);
      const stockKg = matching.reduce((sum, row) => sum + toNumber(row.jumlahStok), 0);
      return { status, batchCount: matching.length, stockKg };
    });
  }, [rows]);

  const maxBreakdownStock = Math.max(...statusBreakdown.map((item) => item.stockKg), 1);

  const pagination = useClientTablePagination(rows, {
    resetDeps: [warehouseId, kategoriStatus],
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Cold Storage Monitor</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lokasi penyimpanan untuk batch (kandang macan) yang telah diterima
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdated ? lastUpdated.toLocaleString("id-ID") : "—"}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
          Refresh
        </Button>
      </header>
      <ColdStorageModuleNav />

      {error && <div className={alertErrorClass}>{error}</div>}

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Filter</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : "")}
            className={inputClass}
          >
            <option value="">Semua Gudang</option>
            {coldStorages.map((cs) => (
              <option key={cs.coldStorageId} value={cs.coldStorageId}>
                {cs.csCode} — {cs.csName}
              </option>
            ))}
          </select>
          <select
            value={kategoriStatus}
            onChange={(e) => setKategoriStatus((e.target.value as StockCategoryStatus) || "")}
            className={inputClass}
          >
            <option value="">Semua Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <SummaryCard title="Batch Aktif" value={summary.activeBatchCount} tone="slate" />
        <SummaryCard title="Total Stok" value={formatKg(summary.totalStockKg)} tone="slate" />
        <SummaryCard title="Fresh" value={summary.FRESH} tone="green" />
        <SummaryCard title="Warning" value={summary.WARNING} tone="yellow" />
        <SummaryCard title="Expired" value={summary.EXPIRED} tone="red" />
        <SummaryCard title="Utilisasi Avg" value={`${summary.averageUtilizationPct.toFixed(1)}%`} tone="slate" />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Breakdown Status Stok</h2>
          <div className="inline-flex rounded-lg border border-gray-200 p-1 text-xs dark:border-gray-700">
            {(["chart", "table"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setBreakdownView(mode)}
                className={`rounded-md px-3 py-1.5 font-semibold ${
                  breakdownView === mode
                    ? "bg-cyan text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                }`}
              >
                {mode === "chart" ? "Chart" : "Tabel"}
              </button>
            ))}
          </div>
        </div>

        {breakdownView === "chart" ? (
          <div className="space-y-3">
            {statusBreakdown.map((item) => (
              <button
                key={item.status}
                type="button"
                onClick={() => setKategoriStatus(item.status)}
                className="grid w-full grid-cols-[96px_1fr_120px] items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-cyan/5"
              >
                <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${stockCategoryStatusBadgeClass(item.status)}`}>
                  {item.status}
                </span>
                <span className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <span
                    className="block h-full rounded-full bg-cyan"
                    style={{ width: `${Math.max(4, (item.stockKg / maxBreakdownStock) * 100)}%` }}
                  />
                </span>
                <span className="text-right text-xs text-gray-600 dark:text-gray-300">
                  {item.batchCount} batch · {formatKg(item.stockKg)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Batch</th>
                  <th className="px-3 py-2 text-right">Total Stok</th>
                </tr>
              </thead>
              <tbody>
                {statusBreakdown.map((item) => (
                  <tr
                    key={item.status}
                    onClick={() => setKategoriStatus(item.status)}
                    className="cursor-pointer border-b border-gray-100 hover:bg-cyan/5 dark:border-gray-800"
                  >
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stockCategoryStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{item.batchCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatKg(item.stockKg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Daftar Stok</h2>
        <TableListPaginationToolbar
          totalCount={pagination.totalCount}
          itemLabel="batch"
          pageSize={pagination.pageSize}
          onPageSizeChange={pagination.setPageSize}
        />
        <RejectBatchLegend className="mb-3" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <th className="px-3 py-2">Batch</th>
                <th className="px-3 py-2">Kode Penerimaan</th>
                <th className="px-3 py-2">Species</th>
                <th className="px-3 py-2">Gudang / Area</th>
                <th className="px-3 py-2">Tgl Penerimaan</th>
                <th className="px-3 py-2">Tgl Masuk</th>
                <th className="px-3 py-2">Umur Simpan</th>
                <th className="px-3 py-2">Stok</th>
                <th className="px-3 py-2 text-center">QR</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-3 py-5 text-gray-500 dark:text-gray-400">
                    Memuat data...
                  </td>
                </tr>
              ) : pagination.visibleItems.length ? (
                pagination.visibleItems.map((row) => {
                  const rejectRow = isInboundRejectBatchRow(row);
                  return (
                  <tr
                    key={`${row.batchId}-${row.warehouseId}`}
                    className={`border-b border-gray-100 dark:border-gray-800 ${rejectRow ? rejectBatchRowClass : ""}`}
                  >
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{row.batchNumber}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{row.inboundReceiptCode ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{row.speciesName ?? "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-gray-100">
                          {row.warehouseCode} — {row.warehouseName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Area: {row.storageArea}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                      {formatDateDdMmYyyy(row.tanggalPenerimaan ?? null)}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                      {formatDateDdMmYyyy(row.tanggalMasuk)}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                      {row.umurSimpanDays} hari
                      {row.umurSimpanBulan > 0 && (
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                          ({row.umurSimpanBulan} bln)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                      {row.jumlahStok ?? 0} {row.unit ?? ""}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <BatchQrCode batchNumber={row.batchNumber} size={48} />
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stockCategoryStatusBadgeClass(row.kategoriStatus)}`}
                      >
                        {row.kategoriStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link href={batchDetailHref(row.batchNumber)} className={actionBtn("primary", "xs")}>
                        View Detail
                      </Link>
                    </td>
                  </tr>
                );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="px-3 py-5 text-gray-500 dark:text-gray-400">
                    Belum ada stok batch aktif di Cold Storage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TableListPaginationFooter
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          onPageChange={pagination.setPage}
          disabled={loading}
          show={!loading && pagination.totalCount > 0}
        />
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
  value: number | string;
  tone: "slate" | "green" | "yellow" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
      : tone === "yellow"
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200"
        : tone === "red"
          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${toneClass}`}>{title}</span>
      </div>
    </div>
  );
}
