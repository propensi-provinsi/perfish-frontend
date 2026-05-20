"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  HiOutlinePlus,
  HiOutlineArrowPath,
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowDownTray,
} from "react-icons/hi2";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import apiClient from "@/lib/api";
import { quotationApi } from "@/lib/quotation-api";
import type {
  QuotationData,
  QuotationStatus,
  SalesOrderData,
  UpdateQuotationStatusPayload,
  RejectQuotationPayload,
} from "@/types/quotation";
import { QUOTATION_STATUSES, UPDATABLE_STATUSES as UPDATABLE } from "@/types/quotation";

export default function QuotationsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <QuotationsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

/* ================================================================
   Status helpers
   ================================================================ */

const STATUS_STYLE: Record<QuotationStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  SENT: "bg-cyan/10 text-cyan",
  APPROVED: "bg-green-light text-green",
  REJECTED: "bg-red-light text-red",
  EXPIRED: "bg-yellow-light text-yellow",
  CONVERTED: "bg-navy/10 text-navy dark:bg-white/10 dark:text-gray-300",
};

const STATUS_LABEL: Record<QuotationStatus, string> = {
  DRAFT: "Draft",
  SENT: "Terkirim",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  EXPIRED: "Kedaluwarsa",
  CONVERTED: "Dikonversi",
};

function StatusBadge({ status }: { status: QuotationStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status] ?? "bg-gray-100 text-gray-500"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function formatRupiah(val?: number | null) {
  if (val == null) return "—";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

function formatDate(val?: string | null) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const PAGE_SIZE = 10;

/* ================================================================
   Main Content
   ================================================================ */

type FilterStatus = "" | QuotationStatus;

function QuotationsContent() {
  const [quotations, setQuotations] = useState<QuotationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters (server-side)
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("");

  // Debounce search
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modal states
  const [statusModal, setStatusModal] = useState<QuotationData | null>(null);
  const [approveModal, setApproveModal] = useState<QuotationData | null>(null);
  const [rejectModal, setRejectModal] = useState<QuotationData | null>(null);
  const [convertModal, setConvertModal] = useState<QuotationData | null>(null);
  const [detailModal, setDetailModal] = useState<QuotationData | null>(null);

  /* ── Search debounce ─────────────────────────────── */
  function handleSearchChange(val: string) {
    setSearchQuery(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(0);
    }, 400);
  }

  function handleStatusFilter(val: FilterStatus) {
    setFilterStatus(val);
    setPage(0);
  }

  /* ── Fetch ───────────────────────────────────────── */
  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await quotationApi.getPaged({
        status: filterStatus || undefined,
        search: debouncedSearch || undefined,
        page,
        size: PAGE_SIZE,
      });
      const paged = data.data as import("@/types/report").PagedResponse<QuotationData>;
      setQuotations(paged.content);
      setTotalPages(paged.totalPages);
      setTotalElements(paged.totalElements);
    } catch {
      setError("Gagal memuat data quotation");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, debouncedSearch, page]);

  useEffect(() => { fetchQuotations(); }, [fetchQuotations]);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  }

  /* ── Render ──────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Quotation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola penawaran harga kepada customer
          </p>
        </div>
        <Link
          href="/quotations/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white
            hover:bg-cyan-hover active:scale-[0.98] transition-all shrink-0"
        >
          <HiOutlinePlus className="h-4 w-4" />
          Buat Quotation
        </Link>
      </div>

      {successMsg && (
        <div className="rounded-lg bg-green-light border border-green/20 p-3 text-sm text-green">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari nomor quotation atau customer…"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section
              dark:text-gray-100 pl-9 pr-3 py-2 text-sm focus:border-cyan focus:outline-none
              focus:ring-2 focus:ring-cyan/20 dark:placeholder:text-gray-500 transition-colors"
          />
        </div>

        {/* Status filter dropdown */}
        <select
          value={filterStatus}
          onChange={(e) => handleStatusFilter(e.target.value as FilterStatus)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section
            dark:text-gray-100 px-3 py-2 text-sm focus:border-cyan focus:outline-none
            focus:ring-2 focus:ring-cyan/20 transition-colors cursor-pointer"
        >
          <option value="">Semua Status</option>
          {QUOTATION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-400">
        {totalElements} quotation ditemukan
        {totalPages > 1 && ` · halaman ${page + 1} dari ${totalPages}`}
      </p>

      {/* Table */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-8">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-cyan" />
          Memuat quotation…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-dark-section">
              <tr>
                {["No. Quotation", "Customer", "Tgl Terbit", "Tgl Berlaku", "Dibuat Oleh", "Total", "Status", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                    {searchQuery || filterStatus ? "Tidak ada quotation yang cocok." : "Belum ada data quotation."}
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {q.quotationNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {q.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(q.dateIssued)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(q.dateValid)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {q.createdBy || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap tabular-nums">
                      {formatRupiah(q.total)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <ActionBtn
                          onClick={() => setDetailModal(q)}
                          title="Lihat detail"
                          icon={<HiOutlineEye className="h-4 w-4" />}
                        />
                        {q.status !== "CONVERTED" && q.status !== "APPROVED" && q.status !== "REJECTED" && (
                          <ActionBtn
                            onClick={() => setStatusModal(q)}
                            title="Update status"
                            icon={<HiOutlineArrowPath className="h-4 w-4" />}
                          />
                        )}
                        {q.status === "SENT" && (
                          <ActionBtn
                            onClick={() => setApproveModal(q)}
                            title="Setujui quotation"
                            icon={<HiOutlineCheckCircle className="h-4 w-4" />}
                            color="green"
                          />
                        )}
                        {(q.status === "DRAFT" || q.status === "SENT") && (
                          <ActionBtn
                            onClick={() => setRejectModal(q)}
                            title="Tolak quotation"
                            icon={<HiOutlineXCircle className="h-4 w-4" />}
                            color="red"
                          />
                        )}
                        {q.status === "APPROVED" && (
                          <ActionBtn
                            onClick={() => setConvertModal(q)}
                            title="Konversi ke Sales Order"
                            icon={<HiOutlineCheckCircle className="h-4 w-4" />}
                            color="green"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Menampilkan {quotations.length} dari {totalElements} quotation
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="rounded-lg border border-gray-300 dark:border-gray-600 p-1.5
                text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <HiOutlineChevronLeft className="h-4 w-4" />
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i;
              } else if (page <= 3) {
                pageNum = i;
              } else if (page >= totalPages - 4) {
                pageNum = totalPages - 7 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  disabled={loading}
                  className={`rounded-lg w-8 h-8 text-xs font-medium transition-colors
                    ${pageNum === page
                      ? "bg-cyan text-white"
                      : "border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                    } disabled:opacity-60`}
                >
                  {pageNum + 1}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="rounded-lg border border-gray-300 dark:border-gray-600 p-1.5
                text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <HiOutlineChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {detailModal && (
        <DetailModal quotation={detailModal} onClose={() => setDetailModal(null)} />
      )}
      {statusModal && (
        <UpdateStatusModal
          quotation={statusModal}
          onClose={() => setStatusModal(null)}
          onSuccess={(msg) => { setStatusModal(null); showSuccess(msg); fetchQuotations(); }}
        />
      )}
      {approveModal && (
        <ApproveModal
          quotation={approveModal}
          onClose={() => setApproveModal(null)}
          onSuccess={(msg) => { setApproveModal(null); showSuccess(msg); fetchQuotations(); }}
        />
      )}
      {rejectModal && (
        <RejectModal
          quotation={rejectModal}
          onClose={() => setRejectModal(null)}
          onSuccess={(msg) => { setRejectModal(null); showSuccess(msg); fetchQuotations(); }}
        />
      )}
      {convertModal && (
        <ConvertModal
          quotation={convertModal}
          onClose={() => setConvertModal(null)}
          onSuccess={(so) => {
            setConvertModal(null);
            showSuccess(`Quotation ${so.quotationNumber} berhasil dikonversi → ${so.soNumber}`);
            fetchQuotations();
          }}
        />
      )}
    </div>
  );
}

/* ================================================================
   Action Button
   ================================================================ */

function ActionBtn({
  onClick, title, icon, color,
}: {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  color?: "green" | "red";
}) {
  const colorClass = color === "green"
    ? "text-green hover:bg-green-light"
    : color === "red"
      ? "text-red hover:bg-red-light"
      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-white/10";

  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-lg p-1.5 transition-colors ${colorClass}`}
    >
      {icon}
    </button>
  );
}

/* ================================================================
   Detail Modal
   ================================================================ */

function DetailModal({ quotation: q, onClose }: { quotation: QuotationData; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setErrorMsg(null);
    try {
      const fileResp = await quotationApi.downloadPdf(q.id);

      const blobUrl = window.URL.createObjectURL(new Blob([fileResp.data]));
      const a = document.createElement("a");
      a.href = blobUrl;

      const contentDisposition = fileResp.headers["content-disposition"];
      let fileName = `quotation_${q.quotationNumber}.pdf`;
      if (contentDisposition && contentDisposition.includes("filename=")) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          fileName = matches[1].replace(/['"]/g, "");
        }
      }

      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.response?.data?.message || "Gagal mengunduh PDF");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ModalShell title={`Detail — ${q.quotationNumber}`} onClose={onClose} wide>
      <div className="space-y-4 relative">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {([
            ["Customer", q.customerName],
            ["Status", <StatusBadge key="s" status={q.status} />],
            ["Tanggal Terbit", new Date(q.dateIssued).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })],
            ["Berlaku Hingga", new Date(q.dateValid).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })],
            ["Metode Pengiriman", q.deliveryMethod || "—"],
            ["Lokasi Pengiriman", q.deliveryLocation || "—"],
            ["Dibuat Oleh", q.createdBy || "—"],
            ["Catatan", q.notes || "—"],
            ...(q.approvedBy ? [
              ["Disetujui Oleh", q.approvedBy],
              ["Waktu Disetujui", q.approvedAt ? new Date(q.approvedAt).toLocaleString("id-ID") : "—"],
            ] : []),
            ...(q.rejectedBy ? [
              ["Ditolak Oleh", q.rejectedBy],
              ["Alasan Penolakan", q.rejectionReason || "—"],
            ] : []),
          ] as [string, React.ReactNode][]).map(([label, val]) => (
            <div key={String(label)}>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{val}</p>
            </div>
          ))}
        </div>

        {/* Items */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Item</p>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-dark-section">
                <tr>
                  {["Produk", "Spesies", "Bentuk", "Grade", "Ukuran", "Kemasan", "Volume (kg)", "Harga/kg", "Total"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {q.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{item.productName || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">{item.fishSpeciesName || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">{item.fishForm || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">{item.fishGrade || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">{item.sizeSpec || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">{item.packaging || "—"}</td>
                    <td className="px-3 py-2 tabular-nums text-gray-800 dark:text-gray-200">{item.volumeKg.toLocaleString("id-ID")}</td>
                    <td className="px-3 py-2 tabular-nums text-gray-800 dark:text-gray-200">{formatRupiah(item.pricePerKg)}</td>
                    <td className="px-3 py-2 tabular-nums font-medium text-gray-800 dark:text-gray-200">{formatRupiah(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="rounded-lg bg-gray-50 dark:bg-dark-section p-3 text-sm space-y-1.5">
          {[
            ["Subtotal", formatRupiah(q.subtotal)],
            ["PPN", q.ppnRate != null ? `${(q.ppnRate * 100).toFixed(0)}%` : "—"],
            ["PPN Amount", formatRupiah(q.ppnAmount)],
          ].map(([label, val]) => (
            <div key={String(label)} className="flex justify-between text-gray-500">
              <span>{label}</span><span>{val}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100 pt-1 border-t border-gray-200 dark:border-gray-700">
            <span>Total</span><span>{formatRupiah(q.total)}</span>
          </div>
        </div>

        {/* Action / Download Section */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 relative">
          {errorMsg && (
            <div className="absolute left-0 bottom-4 rounded-md bg-red-light px-3 py-1.5 text-xs text-red shadow-sm">
              {errorMsg}
            </div>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0066ff] px-4 py-2 text-sm font-semibold text-white
              hover:bg-[#0052cc] hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
              transition-all shadow-md shadow-blue-500/30"
          >
            {downloading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <HiOutlineArrowDownTray className="h-4 w-4" />
            )}
            {downloading ? "Memproses…" : "Unduh PDF"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ================================================================
   Update Status Modal
   ================================================================ */

function UpdateStatusModal({
  quotation, onClose, onSuccess,
}: {
  quotation: QuotationData;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [status, setStatus] = useState<QuotationStatus>(UPDATABLE[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await quotationApi.updateStatus(quotation.id, { status } satisfies UpdateQuotationStatusPayload);
      onSuccess(`Status quotation ${quotation.quotationNumber} diperbarui ke ${STATUS_LABEL[status]}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Gagal memperbarui status");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell title="Update Status Quotation" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 dark:bg-dark-section p-3 text-sm">
          <p className="text-gray-500">Quotation</p>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{quotation.quotationNumber}</p>
          <p className="text-gray-500 mt-1">Status saat ini: <StatusBadge status={quotation.status} /></p>
        </div>
        {error && <div className="rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status Baru</label>
          <div className="grid grid-cols-2 gap-2">
            {UPDATABLE.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium text-left transition-colors
                  ${status === s.value
                    ? "border-cyan bg-cyan/5 text-cyan"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <ModalActions onClose={onClose} onConfirm={handleSubmit} loading={submitting} confirmLabel="Simpan" />
      </div>
    </ModalShell>
  );
}

/* ================================================================
   Approve Modal
   ================================================================ */

function ApproveModal({
  quotation, onClose, onSuccess,
}: {
  quotation: QuotationData;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setSubmitting(true);
    setError(null);
    try {
      await quotationApi.approve(quotation.id);
      onSuccess(`Quotation ${quotation.quotationNumber} berhasil disetujui`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Gagal menyetujui quotation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell title="Setujui Quotation" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg bg-green-light/40 border border-green/20 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Quotation</span>
            <span className="font-semibold font-mono text-gray-900 dark:text-gray-100">{quotation.quotationNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Customer</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{quotation.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{formatRupiah(quotation.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Berlaku Hingga</span>
            <span className="text-gray-900 dark:text-gray-100">{formatDate(quotation.dateValid)}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Quotation ini akan berstatus <span className="font-semibold text-green">Disetujui</span> dan dapat dikonversi menjadi Sales Order.
        </p>
        {error && <div className="rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">{error}</div>}
        <ModalActions
          onClose={onClose}
          onConfirm={handleApprove}
          loading={submitting}
          confirmLabel="Setujui"
          confirmClass="bg-green hover:bg-green/90"
        />
      </div>
    </ModalShell>
  );
}

/* ================================================================
   Reject Modal
   ================================================================ */

function RejectModal({
  quotation, onClose, onSuccess,
}: {
  quotation: QuotationData;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReject() {
    if (!reason.trim()) { setError("Alasan penolakan wajib diisi"); return; }
    setSubmitting(true);
    setError(null);
    try {
      await quotationApi.reject(quotation.id, { rejectionReason: reason.trim() } satisfies RejectQuotationPayload);
      onSuccess(`Quotation ${quotation.quotationNumber} berhasil ditolak`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Gagal menolak quotation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell title="Tolak Quotation" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg bg-red-light/40 border border-red/20 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Quotation</span>
            <span className="font-semibold font-mono text-gray-900 dark:text-gray-100">{quotation.quotationNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Customer</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{quotation.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{formatRupiah(quotation.total)}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Alasan Penolakan <span className="text-red">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); if (error) setError(null); }}
            placeholder="Jelaskan alasan penolakan quotation ini…"
            rows={4}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm resize-none
              dark:bg-dark-section dark:text-gray-100 dark:placeholder:text-gray-500
              focus:outline-none focus:ring-2 transition-colors
              ${error
                ? "border-red bg-red-light/20 focus:border-red focus:ring-red/20"
                : "border-gray-300 dark:border-gray-600 focus:border-red focus:ring-red/20"}`}
          />
          {error && <p className="mt-1 text-xs text-red">{error}</p>}
          <p className="mt-1 text-xs text-gray-400">{reason.length} karakter</p>
        </div>
        <ModalActions
          onClose={onClose}
          onConfirm={handleReject}
          loading={submitting}
          confirmLabel="Tolak Quotation"
          confirmClass="bg-red hover:bg-red/90"
        />
      </div>
    </ModalShell>
  );
}

/* ================================================================
   Convert Modal
   ================================================================ */

function ConvertModal({
  quotation, onClose, onSuccess,
}: {
  quotation: QuotationData;
  onClose: () => void;
  onSuccess: (so: SalesOrderData) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConvert() {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await quotationApi.convert(quotation.id);
      onSuccess(data.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Gagal mengkonversi quotation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell title="Konversi ke Sales Order" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 dark:bg-dark-section p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Quotation</span>
            <span className="font-semibold font-mono text-gray-900 dark:text-gray-100">{quotation.quotationNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Customer</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{quotation.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{formatRupiah(quotation.total)}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Quotation ini akan dikonversi menjadi <strong>Sales Order</strong>. Tindakan ini tidak dapat dibatalkan.
        </p>
        {error && <div className="rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">{error}</div>}
        <ModalActions
          onClose={onClose}
          onConfirm={handleConvert}
          loading={submitting}
          confirmLabel="Konversi ke SO"
          confirmClass="bg-green hover:bg-green/90"
        />
      </div>
    </ModalShell>
  );
}

/* ================================================================
   Shared: Modal Shell + Actions
   ================================================================ */

function ModalShell({
  title, onClose, children, wide,
}: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`relative w-full rounded-xl bg-white dark:bg-dark-card shadow-2xl max-h-[90vh] flex flex-col ${wide ? "max-w-6xl" : "max-w-md"}`}>
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
          <h2 className="text-base font-semibold text-navy dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({
  onClose, onConfirm, loading, confirmLabel, confirmClass,
}: {
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  confirmLabel: string;
  confirmClass?: string;
}) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        onClick={onClose}
        className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium
          text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        Batal
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-all
          ${confirmClass ?? "bg-cyan hover:bg-cyan-hover"}`}
      >
        {loading ? "Memproses…" : confirmLabel}
      </button>
    </div>
  );
}