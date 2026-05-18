"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { HiOutlineDocumentMagnifyingGlass } from "react-icons/hi2";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { AddSupplierModal } from "@/components/inbound-fish/AddSupplierModal";
import { ViewSupplierAuditModal } from "@/components/suppliers/ViewSupplierAuditModal";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import type { ApiResponse, CurrencyOption, PaymentTermOption, SupplierData } from "@/types";
import type { MasterSupplierApprovalStatus } from "@/types/supplier";
import {
  type InboundStatus,
  inboundStatusBadgeClass,
  inboundStatusDisplayLabel,
} from "@/lib/inbound-api";
import { actionBtn } from "@/lib/ui-action";

type InboundReceipt = {
  id: string;
  batchCode: string;
  status: InboundStatus;
  supplierId?: string;
  supplierName: string;
  coldStorageLabel: string;
  tanggalPenerimaan: string;
  createdAt: string;
};

function formatDateDdMmYyyy(isoDate: string): string {
  const s = isoDate.trim().slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return isoDate;
}

function shortColdStorageLabel(full: string): string {
  const sep = " — ";
  const i = full.indexOf(sep);
  if (i === -1) return full.trim();
  const right = full.slice(i + sep.length).trim();
  return right || full.trim();
}

function monthKeyFromIsoDate(isoDate: string): string {
  return isoDate.trim().slice(0, 7);
}

function monthLabel(mk: string): string {
  const [y, m] = mk.split("-");
  return m && y ? `${m}/${y}` : mk;
}

function receiptsForSupplier(supplier: SupplierData, all: InboundReceipt[]): InboundReceipt[] {
  return all.filter((r) => {
    if (r.supplierId && supplier.id) return r.supplierId === supplier.id;
    return r.supplierName.trim().toLowerCase() === supplier.supplierName.trim().toLowerCase();
  });
}

function uniqueMonthKeysDesc(receipts: InboundReceipt[]): string[] {
  const keys = [...new Set(receipts.map((r) => monthKeyFromIsoDate(r.tanggalPenerimaan)))];
  return keys.sort((a, b) => b.localeCompare(a));
}

export default function RingkasanSupplierPage() {
  return (
    <ProtectedRoute allowedRoles={["SBB_STAFF", "SUPERADMIN", "KEPALA_CABANG"]}>
      <AppShell>
        <RingkasanSupplierContent />
      </AppShell>
    </ProtectedRoute>
  );
}

type Toast = { type: "success" | "error"; message: string } | null;

function approvalLabel(status?: string | null): string {
  if (status === "APPROVED") return "Disetujui";
  if (status === "REJECTED") return "Ditolak";
  if (status === "PENDING_APPROVAL") return "Menunggu persetujuan";
  return "—";
}

function RingkasanSupplierContent() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [inbounds, setInbounds] = useState<InboundReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [monthFilterBySupplier, setMonthFilterBySupplier] = useState<Record<string, string>>({});
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [auditSupplier, setAuditSupplier] = useState<SupplierData | null>(null);
  const [updatingApprovalId, setUpdatingApprovalId] = useState<string | null>(null);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermOption[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [toast, setToast] = useState<Toast>(null);

  const canEditApproval = user?.role === "KEPALA_CABANG" || user?.role === "SUPERADMIN";
  const canAddSupplier = user?.role === "SBB_STAFF" || user?.role === "KEPALA_CABANG" || user?.role === "SUPERADMIN";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [supRes, inRes] = await Promise.all([
        apiClient.get<ApiResponse<SupplierData[]>>("/v1/suppliers"),
        apiClient.get<ApiResponse<InboundReceipt[]>>("/inbound-ikan"),
      ]);
      setSuppliers(supRes.data.data ?? []);
      setInbounds(inRes.data.data ?? []);
    } catch {
      setToast({ type: "error", message: "Gagal memuat data supplier atau penerimaan." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function loadSupplierMasters() {
      try {
        const [termRes, currencyRes] = await Promise.all([
          apiClient.get<ApiResponse<PaymentTermOption[]>>("/v1/master/payment-terms/active"),
          apiClient.get<ApiResponse<CurrencyOption[]>>("/v1/master/currencies/active"),
        ]);
        setPaymentTerms(termRes.data.data ?? []);
        setCurrencies(currencyRes.data.data ?? []);
      } catch {
        setToast({ type: "error", message: "Gagal memuat master payment term/currency." });
      }
    }
    void loadSupplierMasters();
  }, []);

  const paymentTermLabelById = useMemo(
    () => new Map(paymentTerms.map((term) => [term.paymentTermId, term.termName])),
    [paymentTerms]
  );
  const currencyLabelById = useMemo(
    () => new Map(currencies.map((currency) => [currency.currencyId, currency.currencyName])),
    [currencies]
  );

  const rows = useMemo(() => {
    return suppliers.map((s) => {
      const rec = receiptsForSupplier(s, inbounds);
      return {
        supplier: s,
        total: rec.length,
        receipts: [...rec].sort((a, b) => {
          const d = b.tanggalPenerimaan.localeCompare(a.tanggalPenerimaan);
          if (d !== 0) return d;
          return b.createdAt.localeCompare(a.createdAt);
        }),
      };
    });
  }, [suppliers, inbounds]);

  async function handleApprovalChange(supplier: SupplierData, next: MasterSupplierApprovalStatus) {
    const current = supplier.approvalStatus ?? "PENDING_APPROVAL";
    if (current === next) return;
    setUpdatingApprovalId(supplier.id);
    try {
      await apiClient.patch<ApiResponse<SupplierData>>(`/v1/suppliers/${supplier.id}/approval`, {
        approvalStatus: next,
      });
      setToast({ type: "success", message: "Status persetujuan supplier diperbarui." });
      await load();
    } catch {
      setToast({ type: "error", message: "Gagal memperbarui status persetujuan." });
    } finally {
      setUpdatingApprovalId(null);
    }
  }

  function setMonthFilter(supplierId: string, mk: string) {
    setMonthFilterBySupplier((prev) => ({ ...prev, [supplierId]: mk }));
  }

  function filteredReceipts(supplierId: string, receipts: InboundReceipt[]): InboundReceipt[] {
    const mk = monthFilterBySupplier[supplierId];
    if (!mk) return receipts;
    return receipts.filter((r) => monthKeyFromIsoDate(r.tanggalPenerimaan) === mk);
  }

  return (
    <div className="space-y-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex max-w-md items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg ${
            toast.type === "success"
              ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300"
          }`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 shrink-0 text-lg leading-none opacity-60 hover:opacity-100"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>
      )}

      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ringkasan Supplier</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Halaman ringkasan daftar supplier
          </p>
        </div>
        {canAddSupplier && (
          <button type="button" onClick={() => setShowAddSupplier(true)} className={actionBtn("primary")}>
            + Tambah Supplier
          </button>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Daftar Supplier</h2>
          {loading && <span className="text-xs text-gray-500 dark:text-gray-400">Memuat…</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-400">
                <th className="px-4 py-3 font-medium">Kode</th>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Tipe</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Persetujuan</th>
                <th className="px-4 py-3 font-medium text-right">Total Penerimaan</th>
                <th className="px-4 py-3 font-medium">Tanggal Terdaftar</th>
                <th className="px-4 py-3 font-medium">Audit Supplier</th>
                <th className="px-4 py-3 font-medium w-36">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Belum ada supplier.
                  </td>
                </tr>
              )}
              {rows.map(({ supplier, total, receipts }) => {
                const open = expandedId === supplier.id;
                const months = uniqueMonthKeysDesc(receipts);
                const filterMk = monthFilterBySupplier[supplier.id] ?? "";
                const shown = filteredReceipts(supplier.id, receipts);
                const rowDimmed = expandedId !== null && expandedId !== supplier.id;
                const rowFocused = expandedId === supplier.id;
                return (
                  <Fragment key={supplier.id}>
                    <tr
                      className={`border-b border-gray-100 text-gray-900 transition-[filter,opacity] duration-200 hover:bg-gray-50/80 dark:border-gray-800 dark:text-gray-100 dark:hover:bg-white/5 ${
                        rowDimmed ? "pointer-events-none opacity-40 blur-[2px]" : ""
                      } ${rowFocused ? "relative z-10 bg-white/95 dark:bg-dark-card/95" : ""}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs">{supplier.supplierCode}</td>
                      <td className="px-4 py-3 font-medium">{supplier.supplierName}</td>
                      <td className="px-4 py-3">{supplier.supplierType}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            supplier.active ? "bg-green-light text-green" : "bg-red-light text-red"
                          }`}
                        >
                          {supplier.active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {canEditApproval ? (
                          <select
                            value={supplier.approvalStatus ?? "PENDING_APPROVAL"}
                            disabled={updatingApprovalId === supplier.id}
                            onChange={(e) =>
                              void handleApprovalChange(
                                supplier,
                                e.target.value as MasterSupplierApprovalStatus
                              )
                            }
                            className="max-w-[220px] rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-900 focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan disabled:opacity-50 dark:border-gray-600 dark:bg-dark-card dark:text-gray-100"
                          >
                            <option value="PENDING_APPROVAL">Menunggu persetujuan</option>
                            <option value="APPROVED">Disetujui</option>
                            <option value="REJECTED">Ditolak</option>
                          </select>
                        ) : (
                          (() => {
                            const approvalStatus = String(supplier.approvalStatus ?? "");
                            return (
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  approvalStatus === "APPROVED"
                                    ? "bg-green-100 text-green-700"
                                    : approvalStatus === "REJECTED"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {approvalLabel(supplier.approvalStatus)}
                              </span>
                            );
                          })()
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{total}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 tabular-nums">
                        {formatDateDdMmYyyy(supplier.createdAt.slice(0, 10))}
                      </td>
                      <td className="px-4 py-3">
                        {supplier.auditId ? (
                          <button type="button" onClick={() => setAuditSupplier(supplier)} className={actionBtn("neutral", "xs")} title="Lihat / edit audit supplier">
                            <HiOutlineDocumentMagnifyingGlass className="h-4 w-4" />
                            Audit
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => {
                          setExpandedId(open ? null : supplier.id);
                          if (!open) setMonthFilter(supplier.id, "");
                        }} className={actionBtn("info", "xs")}>
                          {open ? "Sembunyikan" : "View More"}
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="relative z-10 border-b border-gray-100 bg-gray-50/95 dark:border-gray-800 dark:bg-white/[0.06]">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="mb-4 grid gap-2 rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 dark:border-gray-600 dark:bg-dark-card dark:text-gray-100">
                            <div>
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Alamat</span>
                              <p className="mt-0.5 whitespace-pre-wrap">{supplier.alamat?.trim() || "—"}</p>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div>
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Nomor kontak</span>
                                <p className="mt-0.5">{supplier.nomorKontak?.trim() || "—"}</p>
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Nomor identitas</span>
                                <p className="mt-0.5 break-all">{supplier.nomorIdentitas?.trim() || "—"}</p>
                              </div>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div>
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Payment term</span>
                                <p className="mt-0.5">
                                  {supplier.paymentTermId != null
                                    ? (paymentTermLabelById.get(supplier.paymentTermId) ?? "—")
                                    : "—"}
                                </p>
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Currency</span>
                                <p className="mt-0.5">
                                  {supplier.currency != null
                                    ? (currencyLabelById.get(supplier.currency) ?? "—")
                                    : "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="mb-4 flex flex-wrap items-end gap-3">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                              <span className="mb-1 block">Filter Bulan</span>
                              <select
                                value={filterMk}
                                onChange={(e) => setMonthFilter(supplier.id, e.target.value)}
                                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-dark-card dark:text-gray-100"
                              >
                                <option value="">Semua Bulan</option>
                                {months.map((mk) => (
                                  <option key={mk} value={mk}>
                                    {monthLabel(mk)}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 pb-2">
                              Menampilkan {shown.length} dari {receipts.length} penerimaan
                            </p>
                          </div>
                          <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Riwayat Penerimaan Ikan
                          </p>
                          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full text-xs">
                              <thead>
                                <tr className="bg-white text-left text-gray-600 dark:bg-dark-card dark:text-gray-400">
                                  <th className="px-3 py-2 font-medium">Kode</th>
                                  <th className="px-3 py-2 font-medium">Tanggal</th>
                                  <th className="px-3 py-2 font-medium">Lokasi Penerimaan</th>
                                  <th className="px-3 py-2 font-medium">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {shown.length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                                      {receipts.length === 0
                                        ? "Belum ada penerimaan dari supplier ini."
                                        : "Tidak ada penerimaan pada bulan yang dipilih."}
                                    </td>
                                  </tr>
                                )}
                                {shown.map((r) => (
                                  <tr
                                    key={r.id}
                                    className="border-t border-gray-100 text-gray-900 dark:border-gray-800 dark:text-gray-100"
                                  >
                                    <td className="px-3 py-2 font-mono">{r.batchCode}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{formatDateDdMmYyyy(r.tanggalPenerimaan)}</td>
                                    <td className="px-3 py-2 max-w-[240px] truncate" title={r.coldStorageLabel}>
                                      {shortColdStorageLabel(r.coldStorageLabel)}
                                    </td>
                                    <td className="px-3 py-2">
                                      <span
                                        className={`inline-flex rounded-full px-2 py-0.5 font-medium ${inboundStatusBadgeClass(r.status)}`}
                                      >
                                        {inboundStatusDisplayLabel(r.status)}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {showAddSupplier && (
        <AddSupplierModal
          onClose={() => setShowAddSupplier(false)}
          onSuccess={() => {
            setShowAddSupplier(false);
            setToast({
              type: "success",
              message:
                user?.role === "SBB_STAFF"
                  ? "Supplier berhasil diajukan. Menunggu persetujuan Kepala Cabang atau Superadmin."
                  : "Supplier berhasil ditambahkan dan aktif.",
            });
            void load();
          }}
          onError={(msg) => setToast({ type: "error", message: msg })}
        />
      )}

      {auditSupplier && (
        <ViewSupplierAuditModal
          supplier={auditSupplier}
          onClose={() => setAuditSupplier(null)}
          onSaved={() => {
            setToast({ type: "success", message: "Audit berhasil diperbarui." });
            void load();
          }}
        />
      )}
    </div>
  );
}
