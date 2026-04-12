"use client";

import { useState, useEffect, useCallback, useMemo, Fragment, type FormEvent } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { ModalOverlay, Field } from "@/components/inbound-fish/ModalPrimitives";
import apiClient from "@/lib/api";
import type { ApiResponse, SupplierData } from "@/types";
import {
  type FishSpeciesResponse,
  type FishFormResponse,
  type FishGradeResponse,
  type FishSkuResponse,
  type ColdStorageResponse,
} from "@/types";

export default function InboundIkanPage() {
  return (
    <ProtectedRoute allowedRoles={["SBB_STAFF", "SUPERADMIN", "KEPALA_CABANG"]}>
      <AppShell>
        <InboundIkanContent />
      </AppShell>
    </ProtectedRoute>
  );
}

/* ================================================================
   Main Content
   ================================================================ */

type InboundToast = { type: "success" | "error"; message: string } | null;

/** Baris rincian ikan (GET /inbound-fish → lines) */
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
  qcJumlahBatchKandangMacan: number | null;
  qcTotalBeratKg: number | string | null;
  qcSuhuPenerimaan: number | string | null;
  qcSuhuSesuaiStandar: boolean | null;
};

/** Satu header inbound ikan (GET /inbound-fish) */
type InboundFishRow = {
  id: string;
  batchCode: string;
  status: string;
  supplierId: string;
  supplierName: string;
  coldStorageLabel: string;
  tanggalPenerimaan: string;
  createdAt: string;
  lines: InboundFishLineRow[];
};

function formatQuantityKgId(kg: number | string): string {
  const n = typeof kg === "string" ? Number(kg) : kg;
  if (Number.isNaN(n)) return String(kg);
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(n);
}

/** ISO tanggal (YYYY-MM-DD) → DD/MM/YYYY */
function formatDateDdMmYyyy(isoDate: string): string {
  const s = isoDate.trim().slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return isoDate;
}

/** Contoh backend: "CS-JKT-01 — Cold Storage Jakarta 1" → tampilkan hanya nama gudang. */
function shortColdStorageLabel(full: string): string {
  const sep = " — ";
  const i = full.indexOf(sep);
  if (i === -1) return full.trim();
  const right = full.slice(i + sep.length).trim();
  return right || full.trim();
}

function inboundRowHasCekMutuData(row: InboundFishRow): boolean {
  return row.lines.some(
    (ln) =>
      ln.qcGradeId != null ||
      ln.resolvedSkuId != null ||
      ln.qcTotalBeratKg != null ||
      ln.qcJumlahBatchKandangMacan != null ||
      ln.qcSuhuPenerimaan != null
  );
}

function InboundIkanContent() {
  const [activeSuppliers, setActiveSuppliers] = useState<SupplierData[]>([]);
  const [inboundRows, setInboundRows] = useState<InboundFishRow[]>([]);
  const [loadingReceivings, setLoadingReceivings] = useState(false);

  const [showAddPenerimaan, setShowAddPenerimaan] = useState(false);
  const [toast, setToast] = useState<InboundToast>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchActiveSuppliers = useCallback(async () => {
    try {
      const { data } = await apiClient.get<ApiResponse<SupplierData[]>>("/v1/suppliers/active");
      setActiveSuppliers(data.data);
    } catch {
      /* handled by interceptor */
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchActiveSuppliers();
    });
  }, [fetchActiveSuppliers]);

  const fetchInboundFish = useCallback(async () => {
    setLoadingReceivings(true);
    try {
      const { data } = await apiClient.get<
        ApiResponse<
          {
            id: string;
            batchCode: string;
            status: string;
            supplierId?: string;
            supplierName: string;
            coldStorageLabel: string;
            tanggalPenerimaan: string;
            createdAt: string;
            lines: InboundFishLineRow[];
          }[]
        >
      >("/inbound-fish");
      const raw = data.data ?? [];
      setInboundRows(
        raw.map((r) => ({
          id: r.id,
          batchCode: r.batchCode,
          status: r.status,
          supplierId: r.supplierId ?? "",
          supplierName: r.supplierName,
          coldStorageLabel: r.coldStorageLabel,
          tanggalPenerimaan: r.tanggalPenerimaan,
          createdAt: r.createdAt,
            lines: (r.lines ?? []).map((ln) => ({
            id: ln.id,
            speciesId: ln.speciesId ?? 0,
            speciesCode: ln.speciesCode,
            speciesName: ln.speciesName,
            size: ln.size,
            bentuk: ln.bentuk,
            formId: ln.formId ?? null,
            resolvedSkuId: ln.resolvedSkuId ?? null,
            resolvedSkuCode: ln.resolvedSkuCode ?? null,
            qcGradeId: ln.qcGradeId ?? null,
            qcGrade: ln.qcGrade ?? null,
            qcJumlahBatchKandangMacan: ln.qcJumlahBatchKandangMacan ?? null,
            qcTotalBeratKg: ln.qcTotalBeratKg ?? null,
            qcSuhuPenerimaan: ln.qcSuhuPenerimaan ?? null,
            qcSuhuSesuaiStandar: ln.qcSuhuSesuaiStandar ?? null,
          })),
        }))
      );
    } catch {
      /* interceptor */
    } finally {
      setLoadingReceivings(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchInboundFish();
    });
  }, [fetchInboundFish]);

  const totalRecv = inboundRows.length;
  const pendingCount = inboundRows.filter((r) => r.status === "PENDING").length;
  const approvedCount = inboundRows.filter((r) => r.status === "APPROVED").length;

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [qcRow, setQcRow] = useState<InboundFishRow | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg max-w-md ${
            toast.type === "success"
              ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 shrink-0 text-lg leading-none opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── Page header ───────────────────────────────────── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Penerimaan Ikan
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-xl">
            Catat penerimaan ikan dari supplier untuk memastikan asal dan volume
            tercatat dengan akurat sejak awal proses operasional.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddPenerimaan(true)}
            className="rounded-md bg-cyan px-4 py-2 text-sm font-medium text-white hover:bg-cyan/80"
          >
            + Catat Penerimaan
          </button>
        </div>
      </section>

      {/* ── Summary Cards ─────────────────────────────────── */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Total Penerimaan" value={loadingReceivings ? "…" : String(totalRecv)} />
          <SummaryCard label="Menunggu Cek Mutu (Pending)" value={loadingReceivings ? "…" : String(pendingCount)} />
          <SummaryCard label="Disetujui" value={loadingReceivings ? "…" : String(approvedCount)} />
          <SummaryCard label="Ditolak" value="-" />
        </div>
      </section>

      {/* ── Daftar penerimaan ─────────────────────────────── */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Daftar Penerimaan Ikan
          </h2>
          {loadingReceivings && (
            <span className="text-xs text-gray-500 dark:text-gray-400">Memuat…</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-left text-gray-600 dark:text-gray-400">
                <th className="px-2 py-3 w-10 font-medium" aria-label="Perluas baris" />
                <th className="px-4 py-3 font-medium">Kode Penerimaan</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Lokasi Gudang</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium w-36">Cek Mutu</th>
              </tr>
            </thead>
            <tbody>
              {inboundRows.length === 0 && !loadingReceivings && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Belum ada data penerimaan. Klik &quot;Catat Penerimaan&quot; untuk menambah.
                  </td>
                </tr>
              )}
              {inboundRows.map((row) => {
                const open = expandedIds.has(row.id);
                const hasCekMutuFilled = inboundRowHasCekMutuData(row);
                return (
                  <Fragment key={row.id}>
                    <tr
                      className="border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50/80 dark:hover:bg-white/5"
                    >
                      <td className="px-2 py-3 align-middle">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(row.id)}
                          className="rounded p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                          aria-expanded={open}
                          title={open ? "Sembunyikan rincian" : "Tampilkan rincian ikan"}
                        >
                          <span className="inline-block w-4 text-center text-xs">{open ? "▼" : "▶"}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{row.batchCode}</td>
                      <td className="px-4 py-3">{row.supplierName}</td>
                      <td className="px-4 py-3 max-w-[220px] truncate" title={row.coldStorageLabel}>
                        {shortColdStorageLabel(row.coldStorageLabel)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDateDdMmYyyy(row.tanggalPenerimaan)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.status === "PENDING"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                              : row.status === "APPROVED"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {row.status === "PENDING"
                            ? "Pending"
                            : row.status === "APPROVED"
                              ? "Disetujui"
                              : row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className={
                            hasCekMutuFilled
                              ? "rounded-md border border-violet-500/50 bg-violet-50 px-2 py-1 text-xs font-medium text-violet-900 hover:bg-violet-100 dark:border-violet-400/40 dark:bg-violet-950/40 dark:text-violet-200 dark:hover:bg-violet-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
                              : "rounded-md border border-cyan/60 bg-cyan/10 px-2 py-1 text-xs font-medium text-cyan-800 dark:text-cyan-200 hover:bg-cyan/20 disabled:opacity-40 disabled:cursor-not-allowed"
                          }
                          disabled={row.status !== "PENDING" && row.status !== "APPROVED"}
                          title={
                            row.status !== "PENDING" && row.status !== "APPROVED"
                              ? "Tidak dapat dibuka pada status ini"
                              : hasCekMutuFilled
                                ? "Ubah data cek mutu"
                                : "Buka lembar cek mutu"
                          }
                          onClick={() => setQcRow(row)}
                        >
                          {hasCekMutuFilled ? "Edit" : "Periksa"}
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr key={`${row.id}-detail`} className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.03]">
                        <td colSpan={7} className="px-4 py-3">
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
                                  <th className="px-3 py-2 font-medium">Jumlah Batch (KM)</th>
                                  <th className="px-3 py-2 font-medium">Total Berat (kg)</th>
                                  <th className="px-3 py-2 font-medium">Suhu (°C)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.lines.map((ln) => (
                                  <tr key={ln.id} className="border-t border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100">
                                    <td className="px-3 py-2 font-mono text-[11px]">
                                      {ln.resolvedSkuCode ?? "—"}
                                    </td>
                                    <td className="px-3 py-2" title={`${ln.speciesCode} — ${ln.speciesName}`}>
                                      {ln.speciesName}
                                    </td>
                                    <td className="px-3 py-2">{ln.size}</td>
                                    <td className="px-3 py-2">{ln.bentuk}</td>
                                    <td className="px-3 py-2">{ln.qcGrade ?? "—"}</td>
                                    <td className="px-3 py-2 tabular-nums">
                                      {ln.qcJumlahBatchKandangMacan ?? "—"}
                                    </td>
                                    <td className="px-3 py-2 tabular-nums">
                                      {ln.qcTotalBeratKg != null ? formatQuantityKgId(ln.qcTotalBeratKg) : "—"}
                                    </td>
                                    <td className="px-3 py-2 tabular-nums">
                                      {ln.qcSuhuPenerimaan != null ? String(ln.qcSuhuPenerimaan) : "—"}
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

      {/* ── Modals ────────────────────────────────────────── */}
      {showAddPenerimaan && (
        <AddPenerimaanModal
          activeSuppliers={activeSuppliers}
          onClose={() => setShowAddPenerimaan(false)}
          onSuccess={() => {
            setShowAddPenerimaan(false);
            setToast({
              type: "success",
              message: "Data penerimaan berhasil dikirim dan menunggu cek mutu",
            });
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
            setToast({
              type: "success",
              message: "Cek mutu berhasil disimpan; SKU ditetapkan. Status tetap Pending hingga proses berikutnya.",
            });
            void fetchInboundFish();
          }}
          onError={(msg) => setToast({ type: "error", message: msg })}
        />
      )}
    </div>
  );
}

/* ================================================================
   Summary Card
   ================================================================ */

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-6 shadow-sm text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}



/* ================================================================
   Add Penerimaan Modal — POST /inbound-fish
   ================================================================ */

type RincianDraft = {
  key: string;
  jenisIkan: number | "";
  /** ID master_fish_form — dikirim ke backend sebagai form_id */
  formId: number | "";
  size: string;
  /** Nama bentuk untuk tampilan (sinkron dengan pilihan form) */
  bentuk: string;
};

function AddPenerimaanModal({
  activeSuppliers,
  onClose,
  onSuccess,
}: {
  activeSuppliers: SupplierData[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [coldStorageId, setColdStorageId] = useState<number | "">("");
  const [tanggalPenerimaan, setTanggalPenerimaan] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [rincian, setRincian] = useState<RincianDraft[]>(() => [
    {
      key: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `k-${Date.now()}`,
      jenisIkan: "",
      formId: "",
      size: "",
      bentuk: "",
    },
  ]);
  /** Sub-form rincian ikan: dibuka dengan tombol + di bawah field utama */
  const [rincianSectionOpen, setRincianSectionOpen] = useState(false);

  const [speciesOptions, setSpeciesOptions] = useState<FishSpeciesResponse[]>([]);
  const [formOptions, setFormOptions] = useState<FishFormResponse[]>([]);
  const [coldStorageOptions, setColdStorageOptions] = useState<ColdStorageResponse[]>([]);

  const [loadingMasters, setLoadingMasters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const noActiveSuppliers = activeSuppliers.length === 0;

  useEffect(() => {
    const fetchMasters = async () => {
      setLoadingMasters(true);
      setError(null);
      try {
        const [speciesRes, formsRes, coldRes] = await Promise.all([
          apiClient.get<ApiResponse<FishSpeciesResponse[]>>("/v1/master/fish/species"),
          apiClient.get<ApiResponse<FishFormResponse[]>>("/v1/master/fish/forms"),
          apiClient.get<ApiResponse<ColdStorageResponse[]>>("/v1/master/cold-storage/storages"),
        ]);

        setSpeciesOptions(speciesRes.data.data.filter((s) => s.isActive === true));
        setFormOptions(formsRes.data.data.filter((f) => f.isActive === true));
        setColdStorageOptions(coldRes.data.data.filter((cs) => cs.isActive === true));
      } catch {
        setError("Gagal memuat master data ikan dan lokasi gudang");
      } finally {
        setLoadingMasters(false);
      }
    };

    void fetchMasters();
  }, []);

  const inputCls =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan dark:border-gray-600 dark:bg-dark-card dark:text-gray-100 dark:placeholder:text-gray-400";

  const rincianValid = rincian.every(
    (r) => r.jenisIkan !== "" && r.formId !== "" && r.size.trim() !== "" && r.bentuk.trim() !== ""
  );

  const canSubmit =
    !noActiveSuppliers &&
    !loadingMasters &&
    supplierId &&
    coldStorageId !== "" &&
    tanggalPenerimaan.trim() !== "" &&
    rincianSectionOpen &&
    rincian.length >= 1 &&
    rincianValid;

  function addRincianRow() {
    setRincianSectionOpen(true);
    setRincian((prev) => [
      ...prev,
      {
        key: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `k-${Date.now()}-${prev.length}`,
        jenisIkan: "",
        formId: "",
        size: "",
        bentuk: "",
      },
    ]);
  }

  function openRincianSection() {
    setRincianSectionOpen(true);
  }

  function removeRincianRow(key: string) {
    setRincian((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  }

  function updateRincian(key: string, patch: Partial<RincianDraft>) {
    setRincian((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post<ApiResponse<unknown>>("/inbound-fish", {
        supplierId,
        lokasiGudangId: coldStorageId,
        tanggalPenerimaan,
        lines: rincian.map((r) => ({
          jenisIkan: r.jenisIkan,
          form_id: r.formId,
          size: r.size.trim(),
          bentuk: r.bentuk.trim(),
        })),
      });
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message;
      setError(msg || "Gagal mencatat penerimaan ikan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose} panelClassName="max-w-2xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Catat Penerimaan Ikan Baru
      </h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {noActiveSuppliers && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          Tidak ada supplier aktif. Tambahkan supplier terlebih dahulu.
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Supplier (hanya aktif)" required>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className={inputCls}
          >
            <option value="">Pilih Supplier</option>
            {activeSuppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.supplierName} ({s.supplierCode})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Lokasi Gudang" required>
          <select
            value={coldStorageId === "" ? "" : coldStorageId}
            onChange={(e) => setColdStorageId(e.target.value === "" ? "" : Number(e.target.value))}
            disabled={loadingMasters || coldStorageOptions.length === 0}
            className={`${inputCls} disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800/70 dark:disabled:text-gray-500`}
          >
            <option value="">
              {loadingMasters ? "Memuat lokasi gudang…" : "Pilih lokasi gudang"}
            </option>
            {coldStorageOptions.map((cs) => (
              <option key={cs.coldStorageId} value={cs.coldStorageId}>
                {cs.csCode} — {cs.csName}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tanggal penerimaan" required>
          <input
            type="date"
            value={tanggalPenerimaan}
            onChange={(e) => setTanggalPenerimaan(e.target.value)}
            className={`${inputCls} dark:[color-scheme:dark]`}
          />
        </Field>

        {!rincianSectionOpen && (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-white/[0.02] p-4">
            <button
              type="button"
              onClick={openRincianSection}
              className="inline-flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-cyan/50 bg-cyan/5 px-4 py-3 text-sm font-semibold text-cyan-800 dark:text-cyan-200 hover:bg-cyan/15 w-full sm:w-auto min-w-[120px]"
              title="Tambah jenis ikan"
            >
              <span className="text-lg leading-none">+</span>
              Tambah Jenis Ikan
            </button>
          </div>
        )}

        {rincianSectionOpen && (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Rincian Jenis Ikan <span className="text-red-500">*</span>
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setRincianSectionOpen(false)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
                title="Sembunyikan (data baris tetap tersimpan di form)"
              >
                Sembunyikan
              </button>
              <button
                type="button"
                onClick={addRincianRow}
                className="rounded-md border border-cyan/60 bg-cyan/10 px-3 py-1.5 text-sm font-medium text-cyan-800 dark:text-cyan-200 hover:bg-cyan/20"
                title="Tambah baris rincian"
              >
                +
              </button>
            </div>
          </div>

          {rincian.map((row, idx) => (
            <div
              key={row.key}
              className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-white/5 p-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{idx + 1}.</span>
                {rincian.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRincianRow(row.key)}
                    className="text-xs text-red-600 hover:underline dark:text-red-400"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <Field label="Jenis Ikan" required>
                <select
                  value={row.jenisIkan === "" ? "" : row.jenisIkan}
                  onChange={(e) =>
                    updateRincian(row.key, {
                      jenisIkan: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  disabled={loadingMasters || speciesOptions.length === 0}
                  className={`${inputCls} disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800/70 dark:disabled:text-gray-500`}
                >
                  <option value="">
                    {loadingMasters ? "Memuat jenis ikan…" : "Pilih Jenis Ikan"}
                  </option>
                  {speciesOptions.map((s) => (
                    <option key={s.speciesId} value={s.speciesId}>
                      {s.speciesCode} — {s.speciesName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Size" required>
                <input
                  type="text"
                  value={row.size}
                  onChange={(e) => updateRincian(row.key, { size: e.target.value })}
                  placeholder="Contoh: Small, Medium, Large"
                  maxLength={100}
                  className={inputCls}
                />
              </Field>
              <Field label="Bentuk" required>
                <select
                  value={row.formId === "" ? "" : row.formId}
                  onChange={(e) => {
                    const v = e.target.value === "" ? "" : Number(e.target.value);
                    const opt = formOptions.find((f) => f.formId === v);
                    updateRincian(row.key, {
                      formId: v,
                      bentuk: opt ? opt.formName.trim() : "",
                    });
                  }}
                  disabled={loadingMasters || formOptions.length === 0}
                  className={`${inputCls} disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800/70 dark:disabled:text-gray-500`}
                >
                  <option value="">
                    {loadingMasters ? "Memuat bentuk (form)…" : "Pilih bentuk (Form)"}
                  </option>
                  {formOptions.map((f) => (
                    <option key={f.formId} value={f.formId}>
                      {f.formCode} — {f.formName}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ))}
        </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="rounded-md bg-cyan px-4 py-2 text-sm font-medium text-white hover:bg-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Menyimpan…" : "Submit Penerimaan"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

/* ================================================================
   Modal Cek Mutu — POST /inbound-fish/:id/qc
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

function weightFitsSku(kg: number, s: FishSkuResponse): boolean {
  const min = s.minWeightKg != null && Number.isFinite(Number(s.minWeightKg)) ? Number(s.minWeightKg) : null;
  const max = s.maxWeightKg != null && Number.isFinite(Number(s.maxWeightKg)) ? Number(s.maxWeightKg) : null;
  if (min != null && kg < min) return false;
  if (max != null && kg > max) return false;
  return true;
}

function formatSkuWeightRanges(skus: FishSkuResponse[]): string {
  return skus
    .map((s) => {
      const a = s.minWeightKg != null ? String(s.minWeightKg) : "—";
      const b = s.maxWeightKg != null ? String(s.maxWeightKg) : "—";
      return `${a}–${b} kg`;
    })
    .join(" · ");
}

type CekMutuLineForm = {
  lineId: string;
  speciesId: number;
  speciesLabel: string;
  size: string;
  bentuk: string;
  formId: number | null;
  gradeId: number | "";
  jumlahBatch: string;
  totalBerat: string;
  suhu: string;
};

function QcModal({
  row,
  onClose,
  onSuccess,
  onError,
}: {
  row: InboundFishRow;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const initialHadCekMutu = useMemo(
    () =>
      row.lines.some(
        (ln) =>
          ln.qcGradeId != null ||
          ln.qcTotalBeratKg != null ||
          ln.qcJumlahBatchKandangMacan != null ||
          ln.qcSuhuPenerimaan != null
      ),
    [row.lines]
  );

  const [lines, setLines] = useState<CekMutuLineForm[]>(() =>
    row.lines.map((ln) => ({
      lineId: ln.id,
      speciesId: ln.speciesId,
      speciesLabel: `${ln.speciesCode} — ${ln.speciesName}`,
      size: ln.size,
      bentuk: ln.bentuk,
      formId: ln.formId,
      gradeId: ln.qcGradeId != null ? ln.qcGradeId : "",
      jumlahBatch: ln.qcJumlahBatchKandangMacan != null ? String(ln.qcJumlahBatchKandangMacan) : "",
      totalBerat: ln.qcTotalBeratKg != null ? String(ln.qcTotalBeratKg) : "",
      suhu: ln.qcSuhuPenerimaan != null ? String(ln.qcSuhuPenerimaan) : "",
    }))
  );
  const [gradeOptions, setGradeOptions] = useState<FishGradeResponse[]>([]);
  const [skuMaster, setSkuMaster] = useState<FishSkuResponse[]>([]);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMastersLoading(true);
      try {
        const [gRes, sRes] = await Promise.all([
          apiClient.get<ApiResponse<FishGradeResponse[]>>("/v1/master/fish/grades"),
          apiClient.get<ApiResponse<FishSkuResponse[]>>("/v1/master/fish/skus"),
        ]);
        if (!cancelled) {
          setGradeOptions((gRes.data.data ?? []).filter((g) => g.isActive === true));
          setSkuMaster((sRes.data.data ?? []).filter((s) => s.isActive === true));
        }
      } catch {
        if (!cancelled) {
          setError("Gagal memuat master grade / SKU");
        }
      } finally {
        if (!cancelled) setMastersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function setLine(lineId: string, patch: Partial<CekMutuLineForm>) {
    setLines((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l)));
  }

  const cekMutuValid = lines.every((l) => {
    if (l.gradeId === "" || mastersLoading) return false;
    if (l.jumlahBatch.trim() === "" || !Number.isFinite(Number(l.jumlahBatch)) || Number(l.jumlahBatch) < 1) return false;
    if (l.totalBerat.trim() === "" || !Number.isFinite(Number(l.totalBerat)) || Number(l.totalBerat) <= 0) return false;
    if (l.suhu.trim() === "" || !Number.isFinite(Number(l.suhu))) return false;
    return true;
  });

  async function postCekMutu() {
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`/inbound-fish/${row.id}/qc`, {
        barisQc: lines.map((l) => ({
          lineId: l.lineId,
          gradeId: Number(l.gradeId),
          jumlahBatchKandangMacan: Number(l.jumlahBatch),
          totalBeratKg: Number(l.totalBerat),
          suhuPenerimaan: Number(l.suhu),
        })),
      });
      setEditConfirmOpen(false);
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || "Gagal menyimpan cek mutu";
      setError(msg);
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!cekMutuValid) return;
    if (initialHadCekMutu) {
      setEditConfirmOpen(true);
      return;
    }
    void postCekMutu();
  }

  const inputCls =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan dark:border-gray-600 dark:bg-dark-card dark:text-gray-100 dark:placeholder:text-gray-400";

  return (
    <ModalOverlay onClose={onClose} panelClassName="max-w-3xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Lembar cek mutu — {row.batchCode}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {row.supplierName} · {formatDateDdMmYyyy(row.tanggalPenerimaan)}
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {lines.map((l, idx) => {
          const rowLine = row.lines.find((x) => x.id === l.lineId);
          const candidates =
            rowLine && l.gradeId !== "" ? skusForLineAndGrade(skuMaster, rowLine, Number(l.gradeId)) : [];
          const refSku = candidates.find((s) => s.defaultStorageTempC != null && Number.isFinite(Number(s.defaultStorageTempC)));
          const refTemp = refSku != null ? Number(refSku.defaultStorageTempC) : null;
          const suhuNum = Number(l.suhu);
          const suhuOk =
            refTemp != null && Number.isFinite(suhuNum)
              ? Math.abs(suhuNum - refTemp) <= SUHU_TOLERANSI_C
              : null;
          const kg = Number(l.totalBerat);
          const beratInRange =
            l.gradeId !== "" && candidates.length > 0 && Number.isFinite(kg)
              ? candidates.some((s) => weightFitsSku(kg, s))
              : true;

          return (
            <div
              key={l.lineId}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50/50 dark:bg-white/[0.03]"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {idx + 1}. {l.speciesLabel}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Size: {l.size || "—"} · Bentuk: {l.bentuk || "—"}
                </p>
              </div>
              {mastersLoading && (
                <p className="text-xs text-gray-500 dark:text-gray-400">Memuat master grade & SKU…</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Grade" required>
                  <select
                    value={l.gradeId === "" ? "" : l.gradeId}
                    onChange={(e) =>
                      setLine(l.lineId, {
                        gradeId: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    disabled={mastersLoading || gradeOptions.length === 0}
                    className={`${inputCls} disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800/70 dark:disabled:text-gray-500`}
                  >
                    <option value="">{mastersLoading ? "Memuat…" : "Pilih grade"}</option>
                    {gradeOptions.map((g) => (
                      <option key={g.gradeId} value={g.gradeId}>
                        {g.gradeCode} — {g.gradeName}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Jumlah Batch (KM)" required>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={l.jumlahBatch}
                    onChange={(e) => setLine(l.lineId, { jumlahBatch: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Total Berat (kg)" required>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={l.totalBerat}
                    onChange={(e) => setLine(l.lineId, { totalBerat: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Suhu penerimaan (°C)" required>
                  <input
                    type="number"
                    step="0.1"
                    value={l.suhu}
                    onChange={(e) => setLine(l.lineId, { suhu: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              </div>
              {l.gradeId !== "" && candidates.length > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Rentang berat SKU master (Min–Max) untuk kombinasi ini:{" "}
                  <span className="font-medium">{formatSkuWeightRanges(candidates)}</span>
                </p>
              )}
              {l.gradeId !== "" && candidates.length > 0 && !beratInRange && Number.isFinite(kg) && (
                <p className="text-xs text-amber-800 dark:text-amber-200 rounded border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 px-2 py-1.5">
                  Total berat di luar rentang SKU master di atas. Setelah disimpan, sistem akan membuat SKU baru (otomatis) yang mencakup berat ini.
                </p>
              )}
              {l.gradeId !== "" && candidates.length === 0 && (
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Belum ada SKU master untuk kombinasi ini. Setelah disimpan, sistem akan membuat SKU baru (otomatis).
                </p>
              )}
              {refTemp != null && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Standar suhu SKU ini adalah {refTemp}°C (toleransi ±{SUHU_TOLERANSI_C}°C).
                </p>
              )}
              {refTemp != null && l.suhu.trim() !== "" && Number.isFinite(suhuNum) && (
                <p
                  className={`text-xs rounded border px-2 py-1.5 ${
                    suhuOk
                      ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200"
                      : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"
                  }`}
                >
                  {suhuOk
                    ? `Suhu penerimaan sesuai standar (referensi ${refTemp}°C ±${SUHU_TOLERANSI_C}°C).`
                    : `Peringatan: Standar suhu SKU ini adalah ${refTemp}°C (toleransi ±${SUHU_TOLERANSI_C}°C).`}
                </p>
              )}
            </div>
          );
        })}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!cekMutuValid || submitting}
            className="rounded-md bg-cyan px-4 py-2 text-sm font-medium text-white hover:bg-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </form>

      {editConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-600 dark:bg-dark-card">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Ubah cek mutu?</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Data cek mutu untuk penerimaan ini sudah pernah diisi. Apakah Anda yakin ingin mengubahnya?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5"
                onClick={() => setEditConfirmOpen(false)}
                disabled={submitting}
              >
                Batal
              </button>
              <button
                type="button"
                className="rounded-md bg-cyan px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan/80 disabled:opacity-50"
                disabled={submitting}
                onClick={() => void postCekMutu()}
              >
                {submitting ? "Menyimpan…" : "Ya, ubah"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
}

