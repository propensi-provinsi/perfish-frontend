"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import {
  HiOutlineDocumentText,
  HiOutlineArrowDownTray,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineFunnel,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { LuFileSpreadsheet, LuFileText } from "react-icons/lu";
import { reportApi, triggerBlobDownload, formatFileSize } from "@/lib/report-api";
import type { ReportFormat, ReportType, ReportHistoryItem } from "@/types/report";

export default function ReportsHistoryPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ReportsHistoryContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ReportsHistoryContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Riwayat Laporan</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Daftar laporan yang telah dibuat sebelumnya
        </p>
      </div>
      <HistoryTab />
    </div>
  );
}

// ─────────────────────────────────────────────
//  TAB: Riwayat Laporan
// ─────────────────────────────────────────────

const REPORT_TYPE_LABELS: Record<string, string> = {
  INBOUND_FISH:    "Penerimaan Ikan",
  BATCH_STOCK:     "Stok Batch",
  EXPIRY_STATUS:   "Status Kedaluwarsa",
  SALES_QUOTATION: "Quotation",
  SALES_ORDER:     "Sales Order",
  SALES_REKAP:     "Rekap Penjualan",
  DISTRIBUTION:    "Distribusi",
  CERTIFICATION:   "Sertifikasi Ekspor",
};

function HistoryTab() {
  const [items, setItems] = useState<ReportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [filterType, setFilterType] = useState<string>("");
  const [filterFormat, setFilterFormat] = useState<string>("");
  const [page, setPage] = useState(0);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [dlError, setDlError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await reportApi.getHistory({
        reportType: filterType as ReportType || undefined,
        format: filterFormat as ReportFormat || undefined,
        page,
        size: 10,
      });
      setItems(data.data.content);
      setTotalPages(data.data.totalPages);
      setTotalElements(data.data.totalElements);
    } catch {
      setError("Gagal memuat riwayat laporan");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterFormat, page]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  async function handleDownload(item: ReportHistoryItem) {
    if (item.isExpired) return;
    setDownloading(item.historyId);
    setDlError(null);
    try {
      const response = await reportApi.download(item.historyId);
      triggerBlobDownload(response.data, item.fileName);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      if (e.response?.status === 410) {
        setDlError("File sudah kedaluwarsa. Silakan generate ulang.");
        setItems((prev) =>
          prev.map((i) =>
            i.historyId === item.historyId ? { ...i, isExpired: true } : i
          )
        );
      } else {
        setDlError("Gagal mengunduh file.");
      }
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <HiOutlineFunnel className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
        </div>

        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
          className={selectCls}
        >
          <option value="">Semua Jenis</option>
          {Object.entries(REPORT_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select
          value={filterFormat}
          onChange={(e) => { setFilterFormat(e.target.value); setPage(0); }}
          className={selectCls}
        >
          <option value="">Semua Format</option>
          <option value="PDF">PDF</option>
          <option value="EXCEL">Excel</option>
        </select>

        <button
          onClick={() => { setFilterType(""); setFilterFormat(""); setPage(0); }}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline"
        >
          Reset
        </button>

        <span className="ml-auto text-sm text-gray-400">
          {totalElements} laporan
        </span>
      </div>

      {dlError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">
          <HiOutlineExclamationTriangle className="h-4 w-4 shrink-0" />
          {dlError}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-dark-section">
            <tr>
              {["Nama Laporan", "Periode", "Format", "Tanggal Dibuat", "Status", "Aksi"].map((h) => (
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
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 dark:bg-dark-section rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-red">
                  {error}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <HiOutlineDocumentText className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Belum ada riwayat laporan.</p>
                    <p className="text-xs">Generate laporan pertama Anda di halaman Generate Laporan.</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.historyId} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {item.reportName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatFileSize(item.fileSizeBytes)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {item.periodDisplay}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.format === "PDF"
                        ? "bg-red-light text-red"
                        : "bg-green-light text-green"
                    }`}>
                      {item.format === "PDF"
                        ? <LuFileText className="h-3 w-3" />
                        : <LuFileSpreadsheet className="h-3 w-3" />
                      }
                      {item.format}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatRelativeTime(item.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {item.isExpired ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                        <HiOutlineXCircle className="h-3 w-3" />
                        Kedaluwarsa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-light text-green">
                        <HiOutlineCheckCircle className="h-3 w-3" />
                        Tersedia
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDownload(item)}
                      disabled={item.isExpired || downloading === item.historyId}
                      title={item.isExpired ? "File sudah kedaluwarsa" : "Unduh laporan"}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium
                        transition-all disabled:opacity-40 disabled:cursor-not-allowed
                        bg-cyan/10 text-cyan hover:bg-cyan/20 disabled:hover:bg-cyan/10"
                    >
                      {downloading === item.historyId ? (
                        <HiOutlineArrowPath className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <HiOutlineArrowDownTray className="h-3.5 w-3.5" />
                      )}
                      Unduh
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Halaman {page + 1} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-gray-300 dark:border-gray-600 p-1.5
                text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <HiOutlineChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-gray-300 dark:border-gray-600 p-1.5
                text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <HiOutlineChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Style helpers
// ─────────────────────────────────────────────

const selectCls = `rounded-lg border border-gray-300 dark:border-gray-600
  dark:bg-dark-section dark:text-gray-100 px-3 py-2 text-sm
  focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20
  transition-colors cursor-pointer`;

// ─────────────────────────────────────────────
//  Date formatters
// ─────────────────────────────────────────────

function formatRelativeTime(isoStr: string): string {
  if (!isoStr) return "—";
  const date = new Date(isoStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) return "Baru saja";
  if (diffHours < 24) return `${Math.floor(diffHours)} jam lalu`;
  if (diffHours < 48) return "Kemarin";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}