"use client";

import { useState, useEffect, useCallback, useMemo, Fragment, type FormEvent } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { ModalOverlay, Field } from "@/components/inbound-fish/ModalPrimitives";
import apiClient from "@/lib/api";
import type { ApiResponse } from "@/types";
import {
  type FishGradeResponse,
  type FishSkuResponse,
  type ColdStorageResponse,
} from "@/types";
import {
  type InboundStatus,
  type PurchaseOrderRow,
  getOpenPurchaseOrders,
  getWeighingSummary,
  submitQcInspection,
} from "@/lib/inbound-api";

type MasterRejectReasonResponse = {
  rejectReasonId: number;
  reasonCode: string;
  reasonName: string;
  isActive: boolean;
};

export default function InboundIkanPage() {
  return (
    <ProtectedRoute allowedRoles={["SBB_STAFF", "WAREHOUSE_ADMIN", "SUPERADMIN", "KEPALA_CABANG"]}>
      <AppShell>
        <InboundIkanContent />
      </AppShell>
    </ProtectedRoute>
  );
}

type InboundToast = { type: "success" | "error"; message: string } | null;

type InboundFishLineRow = {
  id: string;
  speciesId: number;
  speciesCode: string;
  speciesName: string;
  size: string;
  bentuk: string;
  formId: number | null;
  resolvedSkuId: number | null;
  resolvedSkuCode: string | null;
  qcGradeId: number | null;
  qcGrade: string | null;
  qcTotalBeratKg: number | string | null;
  rejectedWeight: number | string | null;
  rejectReasonId: number | null;
  acceptedWeightKg: number | string | null;
  qcSuhuPenerimaan: number | string | null;
  qcSuhuSesuaiStandar: boolean | null;
};

type InboundFishRow = {
  id: string;
  batchCode: string;
  status: InboundStatus;
  supplierId: string;
  supplierName: string;
  coldStorageLabel: string;
  tanggalPenerimaan: string;
  createdAt: string;
  poCode?: string | null;
  lines: InboundFishLineRow[];
};

function formatQuantityKgId(kg: number | string): string {
  const n = typeof kg === "string" ? Number(kg) : kg;
  if (Number.isNaN(n)) return String(kg);
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(n);
}

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

const STATUS_CONFIG: Record<InboundStatus, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  WEIGHING: { label: "Weighing", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" },
  QC_CHECK: { label: "QC Check", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" },
  COMPLETED: { label: "Selesai", cls: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200" },
};

function StatusBadge({ status }: { status: InboundStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>;
}

function InboundIkanContent() {
  const [inboundRows, setInboundRows] = useState<InboundFishRow[]>([]);
  const [loadingReceivings, setLoadingReceivings] = useState(false);
  const [showAddPenerimaan, setShowAddPenerimaan] = useState(false);
  const [toast, setToast] = useState<InboundToast>(null);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const fetchInboundFish = useCallback(async () => {
    setLoadingReceivings(true);
    try {
      const { data } = await apiClient.get<ApiResponse<InboundFishRow[]>>("/inbound-ikan");
      setInboundRows(
        (data.data ?? []).map((r) => ({
          ...r,
          supplierId: r.supplierId ?? "",
          lines: (r.lines ?? []).map((ln) => ({ ...ln })),
        }))
      );
    } catch { /* interceptor */ }
    finally { setLoadingReceivings(false); }
  }, []);

  useEffect(() => { queueMicrotask(() => { void fetchInboundFish(); }); }, [fetchInboundFish]);

  const draftCount = inboundRows.filter((r) => r.status === "DRAFT").length;
  const weighingCount = inboundRows.filter((r) => r.status === "WEIGHING").length;
  const qcCount = inboundRows.filter((r) => r.status === "QC_CHECK").length;
  const completedCount = inboundRows.filter((r) => r.status === "COMPLETED").length;

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [qcRow, setQcRow] = useState<InboundFishRow | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  function qcIsDone(row: InboundFishRow): boolean {
    return row.lines.length > 0 && row.lines.every((l) => l.qcGradeId != null);
  }

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg max-w-md ${toast.type === "success" ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300" : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300"}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 shrink-0 text-lg leading-none opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inbound List Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-xl">
            Registrasi kedatangan truk, tally weighing, inspeksi QC, palletisasi, hingga penerimaan selesai.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowAddPenerimaan(true)} className="rounded-md bg-cyan px-4 py-2 text-sm font-medium text-white hover:bg-cyan/80">
            + Catat Penerimaan
          </button>
        </div>
      </section>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Draft" value={loadingReceivings ? "…" : String(draftCount)} />
          <SummaryCard label="Weighing" value={loadingReceivings ? "…" : String(weighingCount)} />
          <SummaryCard label="QC Check" value={loadingReceivings ? "…" : String(qcCount)} />
          <SummaryCard label="Selesai" value={loadingReceivings ? "…" : String(completedCount)} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Daftar Penerimaan Ikan</h2>
          {loadingReceivings && <span className="text-xs text-gray-500 dark:text-gray-400">Memuat…</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-left text-gray-600 dark:text-gray-400">
                <th className="px-2 py-3 w-10 font-medium" aria-label="Expand" />
                <th className="px-4 py-3 font-medium">Kode Penerimaan</th>
                <th className="px-4 py-3 font-medium">PO</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Gudang</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium w-56">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {inboundRows.length === 0 && !loadingReceivings && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">Belum ada data penerimaan.</td></tr>
              )}
              {inboundRows.map((row) => {
                const open = expandedIds.has(row.id);
                const done = qcIsDone(row);
                return (
                  <Fragment key={row.id}>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50/80 dark:hover:bg-white/5">
                      <td className="px-2 py-3 align-middle">
                        <button type="button" onClick={() => toggleExpanded(row.id)} className="rounded p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10" aria-expanded={open}>
                          <span className="inline-block w-4 text-center text-xs">{open ? "▼" : "▶"}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{row.batchCode}</td>
                      <td className="px-4 py-3 text-xs">{row.poCode ?? "—"}</td>
                      <td className="px-4 py-3">{row.supplierName}</td>
                      <td className="px-4 py-3 max-w-[220px] truncate" title={row.coldStorageLabel}>{shortColdStorageLabel(row.coldStorageLabel)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDateDdMmYyyy(row.tanggalPenerimaan)}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-4 py-3">
                        <div className="inline-flex gap-2 flex-wrap">
                          {(row.status === "DRAFT" || row.status === "WEIGHING") && (
                            <Link href={`/inbound-ikan/tally/${row.id}`} className="rounded-md border border-cyan/60 bg-cyan/10 px-2 py-1 text-xs font-medium text-cyan-800 hover:bg-cyan/20 dark:text-cyan-200">
                              {row.status === "DRAFT" ? "Mulai Tally" : "Lanjut Tally"}
                            </Link>
                          )}
                          {row.status === "QC_CHECK" && !done && (
                            <button type="button" onClick={() => setQcRow(row)} className="rounded-md border border-violet-500/50 bg-violet-50 px-2 py-1 text-xs font-medium text-violet-900 hover:bg-violet-100 dark:border-violet-400/40 dark:bg-violet-950/40 dark:text-violet-200">
                              Inspeksi QC
                            </button>
                          )}
                          {row.status === "QC_CHECK" && done && (
                            <Link href={`/inbound-ikan/palletize/${row.id}`} className="rounded-md border border-green-500/50 bg-green-50 px-2 py-1 text-xs font-medium text-green-900 hover:bg-green-100 dark:border-green-400/40 dark:bg-green-950/40 dark:text-green-200">
                              Palletisasi
                            </Link>
                          )}
                          {row.status === "COMPLETED" && (
                            <Link href={`/inbound-ikan/summary/${row.id}`} className="rounded-md border border-gray-300/80 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              Lihat Detail
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.03]">
                        <td colSpan={8} className="px-4 py-3">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Rincian Ikan ({new Set(row.lines.map((l) => l.speciesId)).size} Spesies)
                          </p>
                          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full text-xs">
                              <thead>
                                <tr className="bg-white dark:bg-dark-card text-left text-gray-600 dark:text-gray-400">
                                  <th className="px-3 py-2 font-medium">SKU</th>
                                  <th className="px-3 py-2 font-medium">Jenis Ikan</th>
                                  <th className="px-3 py-2 font-medium">Size</th>
                                  <th className="px-3 py-2 font-medium">Bentuk</th>
                                  <th className="px-3 py-2 font-medium">Grade</th>
                                  <th className="px-3 py-2 font-medium">Berat QC (kg)</th>
                                  <th className="px-3 py-2 font-medium">Ditolak (kg)</th>
                                  <th className="px-3 py-2 font-medium">Diterima (kg)</th>
                                  <th className="px-3 py-2 font-medium">Suhu (°C)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.lines.map((ln) => (
                                  <tr key={ln.id} className="border-t border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100">
                                    <td className="px-3 py-2 font-mono text-[11px]">{ln.resolvedSkuCode ?? "—"}</td>
                                    <td className="px-3 py-2">{ln.speciesName}</td>
                                    <td className="px-3 py-2">{ln.size}</td>
                                    <td className="px-3 py-2">{ln.bentuk}</td>
                                    <td className="px-3 py-2">{ln.qcGrade ?? "—"}</td>
                                    <td className="px-3 py-2 tabular-nums">{ln.qcTotalBeratKg != null ? formatQuantityKgId(ln.qcTotalBeratKg) : "—"}</td>
                                    <td className="px-3 py-2 tabular-nums text-red-600">{ln.rejectedWeight != null ? formatQuantityKgId(ln.rejectedWeight) : "—"}</td>
                                    <td className="px-3 py-2 tabular-nums font-semibold text-green-700">{ln.acceptedWeightKg != null ? formatQuantityKgId(ln.acceptedWeightKg) : "—"}</td>
                                    <td className="px-3 py-2 tabular-nums">{ln.qcSuhuPenerimaan != null ? String(ln.qcSuhuPenerimaan) : "—"}</td>
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

      {showAddPenerimaan && (
        <AddPenerimaanModal
          onClose={() => setShowAddPenerimaan(false)}
          onSuccess={() => {
            setShowAddPenerimaan(false);
            setToast({ type: "success", message: "Inbound receipt dibuat (DRAFT). Lanjutkan tally weighing." });
            void fetchInboundFish();
          }}
        />
      )}

      {qcRow && (
        <QcModal
          row={qcRow}
          onClose={() => setQcRow(null)}
          onSuccess={() => {
            setQcRow(null);
            setToast({ type: "success", message: "Inspeksi QC disimpan." });
            void fetchInboundFish();
          }}
          onError={(msg) => setToast({ type: "error", message: msg })}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-6 shadow-sm text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

/* ================================================================
   Add Penerimaan Modal — Simplified: Select PO -> auto-populate
   ================================================================ */

function AddPenerimaanModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [poId, setPoId] = useState<number | "">("");
  const [coldStorageId, setColdStorageId] = useState<number | "">("");
  const [tanggalPenerimaan, setTanggalPenerimaan] = useState(() => new Date().toISOString().slice(0, 10));
  const [openPOs, setOpenPOs] = useState<PurchaseOrderRow[]>([]);
  const [coldStorageOptions, setColdStorageOptions] = useState<ColdStorageResponse[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMasters = async () => {
      setLoadingMasters(true);
      try {
        const [coldRes, poRes] = await Promise.all([
          apiClient.get<ApiResponse<ColdStorageResponse[]>>("/v1/master/cold-storage/storages"),
          getOpenPurchaseOrders(),
        ]);
        setColdStorageOptions(coldRes.data.data.filter((cs) => cs.isActive === true));
        setOpenPOs(poRes);
      } catch {
        setError("Gagal memuat master data");
      } finally {
        setLoadingMasters(false);
      }
    };
    void fetchMasters();
  }, []);

  const selectedPO = useMemo(() => openPOs.find((p) => p.poId === poId) ?? null, [openPOs, poId]);

  const inputCls = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan dark:border-gray-600 dark:bg-dark-card dark:text-gray-100 dark:placeholder:text-gray-400";

  const canSubmit = !loadingMasters && poId !== "" && coldStorageId !== "" && tanggalPenerimaan.trim() !== "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedPO) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post<ApiResponse<unknown>>("/inbound-ikan", {
        supplierId: selectedPO.supplierId,
        lokasiGudangId: coldStorageId,
        tanggalPenerimaan,
        poId,
      });
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Gagal membuat inbound receipt");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose} panelClassName="max-w-2xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Registrasi Kedatangan (Catat Penerimaan)</h2>
      {error && <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">{error}</div>}

      {openPOs.length === 0 && !loadingMasters && (
        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
          Tidak ada PO yang tersedia. Buat Purchase Order terlebih dahulu di menu <strong>Inbound Ikan &rarr; Purchase Order</strong>.
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Purchase Order" required>
          <select value={poId === "" ? "" : poId} onChange={(e) => setPoId(e.target.value === "" ? "" : Number(e.target.value))} disabled={loadingMasters} className={inputCls}>
            <option value="">{loadingMasters ? "Memuat…" : "Pilih Purchase Order"}</option>
            {openPOs.map((po) => <option key={po.poId} value={po.poId}>{po.poCode} — {po.supplierName} ({po.expectedArrivalDate})</option>)}
          </select>
        </Field>

        {selectedPO && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-3 space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Supplier</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedPO.supplierName}</p>

            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2">Rincian Ikan dari PO ({selectedPO.details.length} item)</p>
            <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-white dark:bg-dark-card text-left text-gray-600 dark:text-gray-400">
                    <th className="px-2 py-1.5 font-medium">#</th>
                    <th className="px-2 py-1.5 font-medium">Jenis Ikan</th>
                    <th className="px-2 py-1.5 font-medium">Bentuk</th>
                    <th className="px-2 py-1.5 font-medium">Size</th>
                    <th className="px-2 py-1.5 font-medium text-right">Berat (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPO.details.map((d, idx) => (
                    <tr key={d.poDetailId} className="border-t border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100">
                      <td className="px-2 py-1.5 text-gray-500">{idx + 1}</td>
                      <td className="px-2 py-1.5">{d.speciesName ?? "—"}</td>
                      <td className="px-2 py-1.5">{d.formName ?? "—"}</td>
                      <td className="px-2 py-1.5">{d.itemSize ?? "—"}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{d.orderedWeightKg != null ? formatQuantityKgId(d.orderedWeightKg) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Field label="Lokasi Gudang" required>
          <select value={coldStorageId === "" ? "" : coldStorageId} onChange={(e) => setColdStorageId(e.target.value === "" ? "" : Number(e.target.value))} disabled={loadingMasters || coldStorageOptions.length === 0} className={`${inputCls} disabled:bg-gray-100 disabled:text-gray-400`}>
            <option value="">{loadingMasters ? "Memuat…" : "Pilih lokasi gudang"}</option>
            {coldStorageOptions.map((cs) => <option key={cs.coldStorageId} value={cs.coldStorageId}>{cs.csCode} — {cs.csName}</option>)}
          </select>
        </Field>

        <Field label="Tanggal penerimaan" required>
          <input type="date" value={tanggalPenerimaan} onChange={(e) => setTanggalPenerimaan(e.target.value)} className={`${inputCls} dark:[color-scheme:dark]`} />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5">Batal</button>
          <button type="submit" disabled={!canSubmit || submitting} className="rounded-md bg-cyan px-4 py-2 text-sm font-medium text-white hover:bg-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? "Menyimpan…" : "Submit Penerimaan"}</button>
        </div>
      </form>
    </ModalOverlay>
  );
}

/* ================================================================
   QC Modal — Redesigned: auto-calc weights from tally, reject reason
   ================================================================ */

const SUHU_TOLERANSI_C = 2;

function skuMatchesLineSpeciesForm(s: FishSkuResponse, line: InboundFishLineRow): boolean {
  if (s.speciesId !== line.speciesId || !s.isActive) return false;
  if (line.formId != null && line.formId > 0) return s.formId === line.formId;
  return (s.formName || "").trim().toLowerCase() === (line.bentuk || "").trim().toLowerCase();
}

function skusForLineAndGrade(all: FishSkuResponse[], line: InboundFishLineRow, gradeId: number): FishSkuResponse[] {
  return all.filter((s) => skuMatchesLineSpeciesForm(s, line) && s.gradeId === gradeId);
}

type CekMutuLineForm = {
  lineId: string;
  speciesId: number;
  speciesLabel: string;
  size: string;
  bentuk: string;
  formId: number | null;
  gradeId: number | "";
  suhu: string;
  rejectedWeight: string;
  rejectReasonId: number | "";
  tallyWeight: number;
};

function QcModal({ row, onClose, onSuccess, onError }: { row: InboundFishRow; onClose: () => void; onSuccess: () => void; onError: (msg: string) => void; }) {
  const initialHadCekMutu = useMemo(() => row.lines.some((ln) => ln.qcGradeId != null || ln.qcTotalBeratKg != null), [row.lines]);

  const [lines, setLines] = useState<CekMutuLineForm[]>(() =>
    row.lines.map((ln) => ({
      lineId: ln.id,
      speciesId: ln.speciesId,
      speciesLabel: `${ln.speciesCode} — ${ln.speciesName}`,
      size: ln.size,
      bentuk: ln.bentuk,
      formId: ln.formId,
      gradeId: ln.qcGradeId != null ? ln.qcGradeId : "",
      suhu: ln.qcSuhuPenerimaan != null ? String(ln.qcSuhuPenerimaan) : "",
      rejectedWeight: ln.rejectedWeight != null ? String(ln.rejectedWeight) : "0",
      rejectReasonId: ln.rejectReasonId != null ? ln.rejectReasonId : "",
      tallyWeight: 0,
    }))
  );
  const [gradeOptions, setGradeOptions] = useState<FishGradeResponse[]>([]);
  const [skuMaster, setSkuMaster] = useState<FishSkuResponse[]>([]);
  const [rejectReasons, setRejectReasons] = useState<MasterRejectReasonResponse[]>([]);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMastersLoading(true);
      try {
        const [gRes, sRes, rrRes, summRes] = await Promise.all([
          apiClient.get<ApiResponse<FishGradeResponse[]>>("/v1/master/fish/grades"),
          apiClient.get<ApiResponse<FishSkuResponse[]>>("/v1/master/fish/skus"),
          apiClient.get<ApiResponse<MasterRejectReasonResponse[]>>("/v1/master/reject-reasons"),
          getWeighingSummary(row.id),
        ]);
        if (!cancelled) {
          setGradeOptions((gRes.data.data ?? []).filter((g) => g.isActive === true));
          setSkuMaster((sRes.data.data ?? []).filter((s) => s.isActive === true));
          setRejectReasons((rrRes.data.data ?? []).filter((r) => r.isActive === true));
          const summaryMap = new Map<string, number>();
          for (const s of summRes) {
            summaryMap.set(s.lineId, Number(s.totalNetWeightKg) || 0);
          }
          setLines((prev) =>
            prev.map((l) => ({ ...l, tallyWeight: summaryMap.get(l.lineId) ?? 0 }))
          );
        }
      } catch { if (!cancelled) setError("Gagal memuat master data"); }
      finally { if (!cancelled) setMastersLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [row.id]);

  function setLine(lineId: string, patch: Partial<CekMutuLineForm>) {
    setLines((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l)));
  }

  const cekMutuValid = lines.every((l) => {
    if (l.gradeId === "" || mastersLoading) return false;
    if (l.suhu.trim() === "" || !Number.isFinite(Number(l.suhu))) return false;
    const rej = Number(l.rejectedWeight) || 0;
    if (rej > 0 && l.rejectReasonId === "") return false;
    if (rej > l.tallyWeight) return false;
    return true;
  });

  async function postCekMutu() {
    setSubmitting(true);
    setError(null);
    try {
      await submitQcInspection(
        row.id,
        lines.map((l) => ({
          lineId: l.lineId,
          gradeId: Number(l.gradeId),
          suhuPenerimaan: Number(l.suhu),
          rejectedWeight: Number(l.rejectedWeight) || 0,
          rejectReasonId: l.rejectReasonId !== "" ? Number(l.rejectReasonId) : null,
        }))
      );
      setEditConfirmOpen(false);
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || "Gagal menyimpan inspeksi QC";
      setError(msg);
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!cekMutuValid) return;
    if (initialHadCekMutu) { setEditConfirmOpen(true); return; }
    void postCekMutu();
  }

  const inputCls = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan dark:border-gray-600 dark:bg-dark-card dark:text-gray-100 dark:placeholder:text-gray-400";

  return (
    <ModalOverlay onClose={onClose} panelClassName="max-w-3xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Inspeksi QC — {row.batchCode}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{row.supplierName} &middot; {formatDateDdMmYyyy(row.tanggalPenerimaan)}</p>
      {error && <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">{error}</div>}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {lines.map((l, idx) => {
          const rowLine = row.lines.find((x) => x.id === l.lineId);
          const candidates = rowLine && l.gradeId !== "" ? skusForLineAndGrade(skuMaster, rowLine, Number(l.gradeId)) : [];
          const refSku = candidates.find((s) => s.defaultStorageTempC != null && Number.isFinite(Number(s.defaultStorageTempC)));
          const refTemp = refSku != null ? Number(refSku.defaultStorageTempC) : null;
          const suhuNum = Number(l.suhu);
          const suhuOk = refTemp != null && Number.isFinite(suhuNum) ? Math.abs(suhuNum - refTemp) <= SUHU_TOLERANSI_C : null;
          const rejected = Number(l.rejectedWeight) || 0;
          const accepted = l.tallyWeight - rejected;

          return (
            <div key={l.lineId} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50/50 dark:bg-white/[0.03]">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{idx + 1}. {l.speciesLabel}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Size: {l.size || "—"} &middot; Bentuk: {l.bentuk || "—"}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-dark-card">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Total Tally</p>
                  <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatQuantityKgId(l.tallyWeight)} <span className="text-xs font-normal">kg</span></p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-red-500">Ditolak</p>
                  <p className="text-lg font-bold tabular-nums text-red-600">{formatQuantityKgId(rejected)} <span className="text-xs font-normal">kg</span></p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-green-600">Diterima</p>
                  <p className="text-lg font-bold tabular-nums text-green-700">{formatQuantityKgId(accepted > 0 ? accepted : 0)} <span className="text-xs font-normal">kg</span></p>
                </div>
              </div>

              {mastersLoading && <p className="text-xs text-gray-500 dark:text-gray-400">Memuat master data…</p>}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Grade" required>
                  <select value={l.gradeId === "" ? "" : l.gradeId} onChange={(e) => setLine(l.lineId, { gradeId: e.target.value === "" ? "" : Number(e.target.value) })} disabled={mastersLoading} className={`${inputCls} disabled:bg-gray-100`}>
                    <option value="">{mastersLoading ? "Memuat…" : "Pilih grade"}</option>
                    {gradeOptions.map((g) => <option key={g.gradeId} value={g.gradeId}>{g.gradeCode} — {g.gradeName}</option>)}
                  </select>
                </Field>
                <Field label="Suhu penerimaan (°C)" required>
                  <input type="number" step="0.1" value={l.suhu} onChange={(e) => setLine(l.lineId, { suhu: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Rejected Weight (kg)">
                  <input type="number" step="0.001" min={0} value={l.rejectedWeight} onChange={(e) => setLine(l.lineId, { rejectedWeight: e.target.value })} className={inputCls} />
                </Field>
                <Field label={`Reject Reason${rejected > 0 ? " *" : ""}`}>
                  <select value={l.rejectReasonId === "" ? "" : l.rejectReasonId} onChange={(e) => setLine(l.lineId, { rejectReasonId: e.target.value === "" ? "" : Number(e.target.value) })} disabled={mastersLoading} className={`${inputCls} disabled:bg-gray-100`}>
                    <option value="">— Tidak ada —</option>
                    {rejectReasons.map((r) => <option key={r.rejectReasonId} value={r.rejectReasonId}>{r.reasonCode} — {r.reasonName}</option>)}
                  </select>
                </Field>
              </div>

              {rejected > l.tallyWeight && (
                <p className="text-xs text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-950/30 px-2 py-1.5">
                  Rejected weight melebihi total berat tally ({formatQuantityKgId(l.tallyWeight)} kg).
                </p>
              )}
              {rejected > 0 && l.rejectReasonId === "" && (
                <p className="text-xs text-amber-700 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 px-2 py-1.5">
                  Reject reason wajib dipilih jika rejected weight &gt; 0.
                </p>
              )}
              {l.gradeId !== "" && candidates.length === 0 && <p className="text-xs text-blue-700 dark:text-blue-300">Belum ada SKU master untuk kombinasi ini. Sistem akan membuat SKU baru (otomatis).</p>}
              {refTemp != null && <p className="text-xs text-gray-600 dark:text-gray-400">Standar suhu: {refTemp}°C (toleransi &plusmn;{SUHU_TOLERANSI_C}°C).</p>}
              {refTemp != null && l.suhu.trim() !== "" && Number.isFinite(suhuNum) && (
                <p className={`text-xs rounded border px-2 py-1.5 ${suhuOk ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200" : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"}`}>
                  {suhuOk ? `Suhu sesuai standar (${refTemp}°C \u00b1${SUHU_TOLERANSI_C}°C).` : `Peringatan: Suhu di luar standar ${refTemp}°C (\u00b1${SUHU_TOLERANSI_C}°C).`}
                </p>
              )}
            </div>
          );
        })}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5">Batal</button>
          <button type="submit" disabled={!cekMutuValid || submitting} className="rounded-md bg-cyan px-4 py-2 text-sm font-medium text-white hover:bg-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? "Menyimpan…" : "Simpan"}</button>
        </div>
      </form>

      {editConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-600 dark:bg-dark-card">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Ubah inspeksi QC?</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Data QC sudah pernah diisi. Yakin mengubah?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5" onClick={() => setEditConfirmOpen(false)} disabled={submitting}>Batal</button>
              <button type="button" className="rounded-md bg-cyan px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan/80 disabled:opacity-50" disabled={submitting} onClick={() => void postCekMutu()}>{submitting ? "Menyimpan…" : "Ya, ubah"}</button>
            </div>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
}
