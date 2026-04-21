"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import {
  HiOutlineDocumentText,
  HiOutlineArrowDownTray,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineFunnel,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { LuFileSpreadsheet, LuFileText } from "react-icons/lu";
import apiClient from "@/lib/api";
import { reportApi, triggerBlobDownload, formatFileSize } from "@/lib/report-api";
import type {
  ReportTypeInfo,
  ReportFormat,
  ReportType,
  GenerateReportResponse,
  ReportHistoryItem,
  FilterDefinition,
} from "@/types/report";
import type { ApiResponse } from "@/types";

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ReportsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

// ─────────────────────────────────────────────
//  Tab type
// ─────────────────────────────────────────────
type Tab = "generate" | "history";

function ReportsContent() {
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Laporan</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Generate dan unduh laporan operasional dalam format PDF atau Excel
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-section rounded-xl w-fit">
        {(["generate", "history"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-white dark:bg-dark-card text-navy dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab === "generate" ? (
              <><HiOutlineSparkles className="h-4 w-4" /> Generate Laporan</>
            ) : (
              <><HiOutlineClock className="h-4 w-4" /> Riwayat Laporan</>
            )}
          </button>
        ))}
      </div>

      {activeTab === "generate" ? <GenerateTab /> : <HistoryTab />}
    </div>
  );
}

// ─────────────────────────────────────────────
//  TAB: Generate Laporan
// ─────────────────────────────────────────────

function GenerateTab() {
  const [reportTypes, setReportTypes] = useState<ReportTypeInfo[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Form state
  const [selectedType, setSelectedType] = useState<ReportTypeInfo | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState<ReportFormat>("PDF");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOptions, setFilterOptions] = useState<Record<string, { value: string; label: string }[]>>({});

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GenerateReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch available report types
  useEffect(() => {
    reportApi.getTypes()
      .then(({ data }) => setReportTypes(data.data))
      .catch(() => {})
      .finally(() => setLoadingTypes(false));
  }, []);

  // Fetch dynamic filter options when report type changes
  useEffect(() => {
    if (!selectedType) return;
    setFilters({});
    setFilterOptions({});

    selectedType.filters.forEach((f) => {
      // Enum options sudah ada di response
      if (f.options && f.options.length > 0) {
        setFilterOptions((prev) => ({ ...prev, [f.key]: f.options! }));
        return;
      }
      // Fetch dari dataSource
      if (f.dataSource) {
        apiClient.get<ApiResponse<{ id?: number; name?: string; [key: string]: unknown }[]>>(f.dataSource)
          .then(({ data }) => {
            const opts = data.data.map((item) => ({
              value: String(item.customerId ?? item.supplierId ?? item.coldStorageId
                ?? item.speciesId ?? item.salesChannelId ?? item.id ?? ""),
              label: String(item.customerName ?? item.supplierName ?? item.csName
                ?? item.speciesName ?? item.channelName ?? item.name ?? ""),
            })).filter((o) => o.value && o.label);
            setFilterOptions((prev) => ({ ...prev, [f.key]: opts }));
          })
          .catch(() => {});
      }
    });
  }, [selectedType]);

  // Validation
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!selectedType) errs.reportType = "Pilih jenis laporan";
    if (!startDate) errs.startDate = "Tanggal mulai wajib diisi";
    if (!endDate) errs.endDate = "Tanggal akhir wajib diisi";
    if (startDate && endDate) {
      if (startDate > endDate) errs.endDate = "Tanggal akhir harus >= tanggal mulai";
      const diffDays = (new Date(endDate).getTime() - new Date(startDate).getTime())
        / (1000 * 60 * 60 * 24);
      if (diffDays > 366) errs.endDate = "Rentang waktu tidak boleh lebih dari 1 tahun";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleGenerate() {
    setError(null);
    setResult(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { data } = await reportApi.generate({
        reportType: selectedType!.type,
        startDate,
        endDate,
        format,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });
      setResult(data.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Gagal generate laporan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload() {
    if (!result) return;
    try {
      const response = await reportApi.download(result.historyId);
      triggerBlobDownload(response.data, result.fileName);
    } catch {
      setError("Gagal mengunduh file laporan.");
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const isFormReady = selectedType && startDate && endDate && !Object.keys(fieldErrors).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ── Left: Form ── */}
      <div className="lg:col-span-2 space-y-5">

        {/* Report type selector */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-navy dark:text-white mb-4">
            1. Pilih Jenis Laporan
          </h2>
          {loadingTypes ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-gray-100 dark:bg-dark-section animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reportTypes.map((rt) => (
                <button
                  key={rt.type}
                  onClick={() => { 
  setSelectedType(rt); 
  setResult(null); 
  setError(null); 
  setFieldErrors({}); 
}}
                  className={`text-left rounded-lg border p-3.5 transition-all ${
                    selectedType?.type === rt.type
                      ? "border-cyan bg-cyan/5 dark:bg-cyan/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <HiOutlineDocumentText className={`h-5 w-5 mt-0.5 shrink-0 ${
                      selectedType?.type === rt.type ? "text-cyan" : "text-gray-400"
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        selectedType?.type === rt.type
                          ? "text-cyan"
                          : "text-gray-800 dark:text-gray-200"
                      }`}>
                        {rt.displayName}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">
                        {rt.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {fieldErrors.reportType && (
            <p className="mt-2 text-xs text-red">{fieldErrors.reportType}</p>
          )}
        </div>

        {/* Period & Format */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-navy dark:text-white mb-4">
            2. Periode & Format
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Tanggal Mulai" required error={fieldErrors.startDate}>
              <input
                type="date"
                value={startDate}
                max={endDate || today}
                onChange={(e) => { setStartDate(e.target.value); setFieldErrors((p) => ({ ...p, startDate: "", endDate: "" })); }}
                className={inputCls(!!fieldErrors.startDate)}
              />
            </FormField>
            <FormField label="Tanggal Akhir" required error={fieldErrors.endDate}>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={today}
                onChange={(e) => { setEndDate(e.target.value); setFieldErrors((p) => ({ ...p, endDate: "" })); }}
                className={inputCls(!!fieldErrors.endDate)}
              />
            </FormField>
          </div>

          {/* Format selector */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Format Output <span className="text-red">*</span>
            </label>
            <div className="flex gap-3">
              {(["PDF", "EXCEL"] as ReportFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    format === f
                      ? f === "PDF"
                        ? "border-red bg-red-light text-red"
                        : "border-green bg-green-light text-green"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300"
                  }`}
                >
                  {f === "PDF"
                    ? <LuFileText className="h-4 w-4" />
                    : <LuFileSpreadsheet className="h-4 w-4" />
                  }
                  {f === "PDF" ? "PDF" : "Excel"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Filters */}
        {selectedType && selectedType.filters.length > 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-navy dark:text-white mb-4">
              3. Filter <span className="text-gray-400 font-normal">(opsional)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedType.filters.map((f) => (
                <DynamicFilter
                  key={f.key}
                  filter={f}
                  value={filters[f.key] ?? ""}
                  options={filterOptions[f.key] ?? []}
                  onChange={(val) => setFilters((prev) => ({ ...prev, [f.key]: val }))}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Summary & Action ── */}
      <div className="space-y-4">
        {/* Summary card */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-5 shadow-sm sticky top-4">
          <h3 className="text-sm font-semibold text-navy dark:text-white mb-4">Ringkasan</h3>

          <div className="space-y-3 text-sm">
            <SummaryRow label="Jenis Laporan" value={selectedType?.displayName ?? "—"} />
            <SummaryRow label="Periode"
              value={startDate && endDate
                ? `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`
                : "—"} />
            <SummaryRow label="Format"
              value={
                <span className={`inline-flex items-center gap-1 font-medium ${
                  format === "PDF" ? "text-red" : "text-green"
                }`}>
                  {format === "PDF" ? <LuFileText className="h-3.5 w-3.5" /> : <LuFileSpreadsheet className="h-3.5 w-3.5" />}
                  {format}
                </span>
              } />
            {Object.entries(filters).filter(([, v]) => v).length > 0 && (
              <SummaryRow
                label="Filter aktif"
                value={`${Object.entries(filters).filter(([, v]) => v).length} filter`}
              />
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">
              <HiOutlineExclamationTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Generate button */}
          {!result && (
            <button
              onClick={handleGenerate}
              disabled={submitting || !isFormReady}
              className="mt-5 w-full rounded-lg bg-cyan px-4 py-2.5 text-sm font-semibold text-white
                hover:bg-cyan-hover active:scale-[0.98] disabled:opacity-50
                disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><HiOutlineArrowPath className="h-4 w-4 animate-spin" /> Meng-generate…</>
              ) : (
                <><HiOutlineSparkles className="h-4 w-4" /> Generate Laporan</>
              )}
            </button>
          )}

          {/* Success state */}
          {result && (
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-2 rounded-lg bg-green-light border border-green/20 p-3 text-sm text-green">
                <HiOutlineCheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Laporan berhasil dibuat!</p>
                  {!result.hasData && (
                    <p className="text-xs mt-0.5 text-green/80">
                      Tidak ada data pada periode ini — file tetap tersedia.
                    </p>
                  )}
                  <p className="text-xs mt-0.5 text-green/70">
                    {formatFileSize(result.fileSizeBytes)} · Tersedia 24 jam
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="w-full rounded-lg bg-green px-4 py-2.5 text-sm font-semibold text-white
                  hover:bg-green/90 active:scale-[0.98] transition-all
                  flex items-center justify-center gap-2"
              >
                <HiOutlineArrowDownTray className="h-4 w-4" />
                Unduh Sekarang
              </button>

              <button
                onClick={() => { setResult(null); setError(null); }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600
                  px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Generate Laporan Lain
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  TAB: Riwayat Laporan
// ─────────────────────────────────────────────

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
        setItems((prev) => prev.map((i) =>
          i.historyId === item.historyId ? { ...i, isExpired: true } : i
        ));
      } else {
        setDlError("Gagal mengunduh file.");
      }
    } finally {
      setDownloading(null);
    }
  }

  const REPORT_TYPE_LABELS: Record<string, string> = {
    INBOUND_FISH: "Penerimaan Ikan",
    BATCH_STOCK: "Stok Batch",
    EXPIRY_STATUS: "Status Kedaluwarsa",
    SALES_QUOTATION: "Quotation",
    SALES_ORDER: "Sales Order",
    SALES_REKAP: "Rekap Penjualan",
    DISTRIBUTION: "Distribusi",
    CERTIFICATION: "Sertifikasi Ekspor",
  };

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
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
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
                    <p className="text-xs">Generate laporan pertama Anda di tab Generate Laporan.</p>
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
                        : <LuFileSpreadsheet className="h-3 w-3" />}
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
//  Dynamic Filter Component
// ─────────────────────────────────────────────

function DynamicFilter({
  filter,
  value,
  options,
  onChange,
}: {
  filter: FilterDefinition;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
}) {
  if (filter.inputType === "text") {
    return (
      <FormField label={filter.label}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Masukkan ${filter.label.toLowerCase()}…`}
          className={inputCls(false)}
        />
      </FormField>
    );
  }

  return (
    <FormField label={filter.label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls(false)}
      >
        <option value="">Semua</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

// ─────────────────────────────────────────────
//  Small reusable components
// ─────────────────────────────────────────────

function FormField({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}{required && <span className="text-red ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red">{error}</p>}
    </div>
  );
}

function SummaryRow({
  label, value,
}: {
  label: string; value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-800 dark:text-gray-200 text-right font-medium">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Style helpers
// ─────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm
    dark:bg-dark-section dark:text-gray-100 dark:placeholder:text-gray-500
    focus:outline-none focus:ring-2 transition-colors
    ${hasError
      ? "border-red bg-red-light/30 focus:border-red focus:ring-red/20"
      : "border-gray-300 dark:border-gray-600 focus:border-cyan focus:ring-cyan/20"}`;
}

const selectCls = `rounded-lg border border-gray-300 dark:border-gray-600
  dark:bg-dark-section dark:text-gray-100 px-3 py-2 text-sm
  focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20
  transition-colors cursor-pointer`;

// ─────────────────────────────────────────────
//  Date formatters
// ─────────────────────────────────────────────

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

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
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}