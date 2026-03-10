"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlinePlus,
  HiOutlineArrowPath,
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePaperAirplane,
  HiOutlineClock,
} from "react-icons/hi2";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import apiClient from "@/lib/api";
import type { ApiResponse } from "@/types";
import type {
  QuotationData,
  QuotationStatus,
  UpdateQuotationStatusPayload,
  SalesOrderData,
  UPDATABLE_STATUSES,
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
  DRAFT:     "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  SENT:      "bg-cyan/10 text-cyan",
  APPROVED:  "bg-green-light text-green",
  REJECTED:  "bg-red-light text-red",
  EXPIRED:   "bg-yellow-light text-yellow",
  CONVERTED: "bg-navy/10 text-navy dark:bg-white/10 dark:text-gray-300",
};

const STATUS_LABEL: Record<QuotationStatus, string> = {
  DRAFT:     "Draft",
  SENT:      "Terkirim",
  APPROVED:  "Disetujui",
  REJECTED:  "Ditolak",
  EXPIRED:   "Kedaluwarsa",
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

/* ================================================================
   Main Content
   ================================================================ */

type FilterStatus = "" | QuotationStatus;

function QuotationsContent() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<QuotationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("");

  // Modal states
  const [statusModal, setStatusModal] = useState<QuotationData | null>(null);
  const [convertModal, setConvertModal] = useState<QuotationData | null>(null);
  const [detailModal, setDetailModal] = useState<QuotationData | null>(null);

  /* ── Fetch all quotations ──────────────────────────── */
  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<ApiResponse<QuotationData[]>>("/v1/quotations");
      setQuotations(data.data);
    } catch {
      setError("Gagal memuat data quotation");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuotations(); }, [fetchQuotations]);

  /* ── Client-side filter + search ─────────────────── */
  const displayed = useMemo(() => {
    let rows = quotations;
    if (filterStatus) rows = rows.filter((q) => q.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((r) =>
        r.quotationNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [quotations, filterStatus, searchQuery]);

  /* ── Actions ──────────────────────────────────────── */
  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  return (
    <div className="space-y-6">
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

      {/* ── Toolbar ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nomor quotation atau nama customer…"
          className="flex-1 max-w-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section
            dark:text-gray-100 px-3 py-2 text-sm focus:border-cyan focus:outline-none
            focus:ring-2 focus:ring-cyan/20 dark:placeholder:text-gray-500 transition-colors"
        />

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterStatus("")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors
              ${filterStatus === "" ? "bg-navy text-white dark:bg-white dark:text-navy" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
          >
            Semua
          </button>
          {QUOTATION_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value === filterStatus ? "" : s.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors
                ${filterStatus === s.value ? STATUS_STYLE[s.value] + " ring-1 ring-current" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400">{displayed.length} quotation ditemukan</p>

      {/* ── Table ─────────────────────────────────────── */}
      {loading ? (
        <p className="text-gray-400 text-sm">Memuat quotation…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-dark-section">
              <tr>
                {["No. Quotation", "Customer", "Tgl Terbit", "Tgl Berlaku", "Total", "Status", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                    {searchQuery || filterStatus ? "Tidak ada quotation yang cocok." : "Belum ada data quotation."}
                  </td>
                </tr>
              ) : (
                displayed.map((q) => (
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
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap tabular-nums">
                      {formatRupiah(q.total)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Detail */}
                        <ActionBtn
                          onClick={() => setDetailModal(q)}
                          title="Lihat detail"
                          icon={<HiOutlineEye className="h-4 w-4" />}
                        />
                        {/* Update status */}
                        {q.status !== "CONVERTED" && (
                          <ActionBtn
                            onClick={() => setStatusModal(q)}
                            title="Update status"
                            icon={<HiOutlineArrowPath className="h-4 w-4" />}
                          />
                        )}
                        {/* Convert */}
                        {q.status === "APPROVED" && (
                          <ActionBtn
                            onClick={() => setConvertModal(q)}
                            title="Konversi ke Sales Order"
                            icon={<HiOutlineCheckCircle className="h-4 w-4 text-green" />}
                            highlight
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

      {/* ── Modals ────────────────────────────────────── */}
      {detailModal && (
        <DetailModal quotation={detailModal} onClose={() => setDetailModal(null)} />
      )}

      {statusModal && (
        <UpdateStatusModal
          quotation={statusModal}
          onClose={() => setStatusModal(null)}
          onSuccess={(msg) => {
            setStatusModal(null);
            showSuccess(msg);
            fetchQuotations();
          }}
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
  onClick, title, icon, highlight,
}: {
  onClick: () => void; title: string; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-lg p-1.5 transition-colors
        ${highlight
          ? "text-green hover:bg-green-light"
          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-white/10"
        }`}
    >
      {icon}
    </button>
  );
}

/* ================================================================
   Detail Modal
   ================================================================ */

function DetailModal({ quotation: q, onClose }: { quotation: QuotationData; onClose: () => void }) {
  return (
    <ModalShell title={`Detail — ${q.quotationNumber}`} onClose={onClose} wide>
      <div className="space-y-4">
        {/* Header info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Customer", q.customerName],
            ["Status", <StatusBadge key="s" status={q.status} />],
            ["Tanggal Terbit", formatDate(q.dateIssued)],
            ["Berlaku Hingga", formatDate(q.dateValid)],
            ["Metode Pengiriman", q.deliveryMethod || "—"],
            ["Lokasi Pengiriman", q.deliveryLocation || "—"],
            ["Dibuat Oleh", q.createdBy || "—"],
            ["Catatan", q.notes || "—"],
          ].map(([label, val]) => (
            <div key={String(label)}>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{val}</p>
            </div>
          ))}
        </div>

        {/* Items table */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Item</p>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-dark-section">
                <tr>
                  {["Batch ID", "Volume (kg)", "Harga/kg", "Total"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {q.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 font-mono text-xs">{item.batchId}</td>
                    <td className="px-3 py-2 tabular-nums">{item.volumeKg.toLocaleString("id-ID")}</td>
                    <td className="px-3 py-2 tabular-nums">{formatRupiah(item.pricePerKg)}</td>
                    <td className="px-3 py-2 tabular-nums font-medium">{formatRupiah(item.totalPrice)}</td>
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
            ["PPN", q.ppnRate != null ? `${q.ppnRate}%` : "—"],
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
      </div>
    </ModalShell>
  );
}

/* ================================================================
   Update Status Modal
   ================================================================ */

function UpdateStatusModal({
  quotation,
  onClose,
  onSuccess,
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
      await apiClient.patch<ApiResponse<QuotationData>>(
        `/v1/quotations/${quotation.id}/status`,
        { status } satisfies UpdateQuotationStatusPayload
      );
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

        {error && (
          <div className="rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status Baru
          </label>
          <div className="grid grid-cols-2 gap-2">
            {UPDATABLE.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium text-left transition-colors
                  ${status === s.value
                    ? "border-cyan bg-cyan/5 text-cyan"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium
              text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white
              hover:bg-cyan-hover disabled:opacity-50 transition-all">
            {submitting ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ================================================================
   Convert Modal
   ================================================================ */

function ConvertModal({
  quotation,
  onClose,
  onSuccess,
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
      const { data } = await apiClient.post<ApiResponse<SalesOrderData>>(
        `/v1/quotations/${quotation.id}/convert`
      );
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

        {error && (
          <div className="rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">{error}</div>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onClose}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium
              text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Batal
          </button>
          <button onClick={handleConvert} disabled={submitting}
            className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white
              hover:bg-green/90 disabled:opacity-50 transition-all">
            {submitting ? "Mengkonversi…" : "Konversi ke SO"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ================================================================
   Modal Shell
   ================================================================ */

function ModalShell({
  title, onClose, children, wide,
}: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`relative w-full rounded-xl bg-white dark:bg-dark-card shadow-2xl max-h-[90vh] flex flex-col ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
          <h2 className="text-base font-semibold text-navy dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}