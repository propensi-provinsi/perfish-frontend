"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Fragment, type FormEvent } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import apiClient from "@/lib/api";
import type {
  ApiResponse,
  SupplierData,
  CreateSupplierPayload,
  SupplierAuditPayload,
  SupplierAuditResponse,
} from "@/types";
import {
  SUPPLIER_TYPES,
  type FishSpeciesResponse,
  type FishFormResponse,
  type FishGradeResponse,
  type FishSkuResponse,
  type ColdStorageResponse,
} from "@/types";

export default function InboundIkanPage() {
  return (
    <ProtectedRoute allowedRoles={["SBB_STAFF", "SUPERADMIN"]}>
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

  const [showAddSupplier, setShowAddSupplier] = useState(false);
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

  const handleSupplierCreated = () => {
    setShowAddSupplier(false);
    setToast({ type: "success", message: "Supplier berhasil ditambahkan. Jika Anda Staf SBB, menunggu persetujuan Kepala Cabang." });
    fetchActiveSuppliers();
  };

  const handleSupplierFailed = (msg: string) => {
    setToast({ type: "error", message: msg });
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
            Inbound Ikan
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-xl">
            Catat penerimaan ikan dari supplier untuk memastikan asal dan volume
            tercatat dengan akurat sejak awal proses operasional.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddSupplier(true)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-white/5"
          >
            + Tambah Supplier
          </button>
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
      {showAddSupplier && (
        <AddSupplierModal
          onClose={() => setShowAddSupplier(false)}
          onSuccess={handleSupplierCreated}
          onError={handleSupplierFailed}
        />
      )}

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
   Add Supplier Modal — Step 1: Audit, Step 2: Data Supplier (E04-PBI-02)
   ================================================================ */

const AUDIT_DEFAULTS: SupplierAuditPayload = {
  tanggalInspeksi: new Date().toISOString().slice(0, 10),
};

/** Hanya field ini yang dikirim ke API audit; nama supplier tidak termasuk (diisi di langkah 2) */
const AUDIT_PAYLOAD_KEYS: (keyof SupplierAuditPayload)[] = [
  "tanggalInspeksi",
  "aIkanDitangkapPakaiKapal", "aUkuranKapal", "aLamaWaktuPenangkapanMin", "aLamaWaktuPenangkapanMax",
  "aAlatTangkap", "aJumlahAlatTangkap", "aBanyakUmpan", "aJumlahCrew",
  "bKapalDenganPembeku", "bKapasitasPembekuGudang", "bAlurProsesPenanganan", "bPenerapanSanitasiKapal",
  "bBanyakEsPerTripMin", "bBanyakEsPerTripMax", "bLamaProsesHandling", "bPembagianTugasKapal",
  "cIkanDisimpanTempatPengumpul", "cAlurPenangananPengumpulan", "cMediaTempatMenampung",
  "cPenangananIkan", "cSanitasiPenampungan", "cJumlahPekerjaPenampungan", "cPenggunaanEsPenampungan",
  "dCaraIkanDiangkut", "dKapasitasSekaliAngkutMin", "dKapasitasSekaliAngkutMax",
  "dKondisiSanitasiMedia", "dLamaMuatAngkutBongkarMin", "dLamaMuatAngkutBongkarMax", "dTenagaProsesPengangkutan",
];

/** Build body dari DOM form agar nilai yang dikirim selalu yang terlihat di input. */
function buildAuditRequestBodyFromForm(formEl: HTMLFormElement): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const key of AUDIT_PAYLOAD_KEYS) {
    const el = formEl.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    if (!el) continue;
    const raw = "value" in el ? el.value : "";
    if (el.type === "number") {
      body[key] = raw === "" ? undefined : Number(raw);
    } else if (el.tagName === "SELECT" && (raw === "true" || raw === "false")) {
      body[key] = raw === "true";
    } else if (key === "tanggalInspeksi" || (el.type === "date")) {
      body[key] = raw.trim().slice(0, 10) || undefined;
    } else {
      body[key] = raw.trim() || undefined;
    }
  }
  return body;
}

/** Semua field audit wajib diisi */
function isAuditFilled(f: SupplierAuditPayload): boolean {
  if (!f.tanggalInspeksi?.trim()) return false;
  if (f.aIkanDitangkapPakaiKapal == null) return false;
  if (!(f.aUkuranKapal?.trim())) return false;
  if (f.aLamaWaktuPenangkapanMin == null || f.aLamaWaktuPenangkapanMax == null) return false;
  if (!(f.aAlatTangkap?.trim())) return false;
  if (f.aJumlahAlatTangkap == null || f.aBanyakUmpan == null || f.aJumlahCrew == null) return false;
  if (f.bKapalDenganPembeku == null || f.bKapasitasPembekuGudang == null) return false;
  if (!(f.bAlurProsesPenanganan?.trim()) || !(f.bPenerapanSanitasiKapal?.trim())) return false;
  if (f.bBanyakEsPerTripMin == null || f.bBanyakEsPerTripMax == null || f.bLamaProsesHandling == null) return false;
  if (!(f.bPembagianTugasKapal?.trim())) return false;
  if (f.cIkanDisimpanTempatPengumpul == null) return false;
  if (!(f.cAlurPenangananPengumpulan?.trim()) || !(f.cMediaTempatMenampung?.trim()) || !(f.cPenangananIkan?.trim()) || !(f.cSanitasiPenampungan?.trim())) return false;
  if (f.cJumlahPekerjaPenampungan == null || f.cPenggunaanEsPenampungan == null) return false;
  if (!(f.dCaraIkanDiangkut?.trim())) return false;
  if (f.dKapasitasSekaliAngkutMin == null || f.dKapasitasSekaliAngkutMax == null) return false;
  if (!(f.dKondisiSanitasiMedia?.trim())) return false;
  if (f.dLamaMuatAngkutBongkarMin == null || f.dLamaMuatAngkutBongkarMax == null) return false;
  if (f.dTenagaProsesPengangkutan == null) return false;
  return true;
}

/** Validasi range: max tidak boleh lebih kecil dari min. Return pesan error atau null. */
function getAuditRangeError(f: SupplierAuditPayload): string | null {
  if (f.aLamaWaktuPenangkapanMin != null && f.aLamaWaktuPenangkapanMax != null && f.aLamaWaktuPenangkapanMax < f.aLamaWaktuPenangkapanMin)
    return "Lama waktu penangkapan: nilai max tidak boleh lebih kecil dari min.";
  if (f.bBanyakEsPerTripMin != null && f.bBanyakEsPerTripMax != null && f.bBanyakEsPerTripMax < f.bBanyakEsPerTripMin)
    return "Banyak es per trip: nilai max tidak boleh lebih kecil dari min.";
  if (f.dKapasitasSekaliAngkutMin != null && f.dKapasitasSekaliAngkutMax != null && f.dKapasitasSekaliAngkutMax < f.dKapasitasSekaliAngkutMin)
    return "Kapasitas sekali angkut: nilai max tidak boleh lebih kecil dari min.";
  if (f.dLamaMuatAngkutBongkarMin != null && f.dLamaMuatAngkutBongkarMax != null && f.dLamaMuatAngkutBongkarMax < f.dLamaMuatAngkutBongkarMin)
    return "Lama muat/angkut/bongkar: nilai max tidak boleh lebih kecil dari min.";
  return null;
}

type AuditFieldKey = keyof SupplierAuditPayload;
const MSG_REQUIRED = "Wajib diisi";
const MSG_RANGE = "Max tidak boleh lebih kecil dari min";

/** Label singkat per field untuk ditampilkan di pesan error */
const AUDIT_FIELD_LABELS: Partial<Record<AuditFieldKey, string>> = {
  tanggalInspeksi: "Tanggal Inspeksi",
  aIkanDitangkapPakaiKapal: "Apakah Ikan ditangkap pakai kapal",
  aUkuranKapal: "Ukuran Kapal",
  aLamaWaktuPenangkapanMin: "Lama waktu penangkapan (min)",
  aLamaWaktuPenangkapanMax: "Lama waktu penangkapan (max)",
  aAlatTangkap: "Alat Tangkap",
  aJumlahAlatTangkap: "Jumlah alat tangkap",
  aBanyakUmpan: "Banyak umpan",
  aJumlahCrew: "Jumlah crew kapal",
  bKapalDenganPembeku: "Kapal dengan pembeku",
  bKapasitasPembekuGudang: "Kapasitas pembeku/gudang",
  bAlurProsesPenanganan: "Alur proses penanganan di kapal",
  bPenerapanSanitasiKapal: "Penerapan sanitasi kapal",
  bBanyakEsPerTripMin: "Banyak es per trip (min)",
  bBanyakEsPerTripMax: "Banyak es per trip (max)",
  bLamaProsesHandling: "Lama proses handling",
  bPembagianTugasKapal: "Pembagian tugas kapal",
  cIkanDisimpanTempatPengumpul: "Ikan disimpan di tempat pengumpul",
  cAlurPenangananPengumpulan: "Alur penanganan pengumpulan",
  cMediaTempatMenampung: "Media tempat menampung",
  cPenangananIkan: "Penanganan ikan",
  cSanitasiPenampungan: "Sanitasi penampungan",
  cJumlahPekerjaPenampungan: "Jumlah pekerja penampungan",
  cPenggunaanEsPenampungan: "Penggunaan es penampungan",
  dCaraIkanDiangkut: "Cara ikan diangkut",
  dKapasitasSekaliAngkutMin: "Kapasitas sekali angkut (min)",
  dKapasitasSekaliAngkutMax: "Kapasitas sekali angkut (max)",
  dKondisiSanitasiMedia: "Kondisi sanitasi media pengangkut",
  dLamaMuatAngkutBongkarMin: "Lama muat/angkut/bongkar (min)",
  dLamaMuatAngkutBongkarMax: "Lama muat/angkut/bongkar (max)",
  dTenagaProsesPengangkutan: "Tenaga proses pengangkutan",
};

/** Label untuk field yang kadang dikembalikan backend (bukan bagian form audit), mis. namaSupplier */
const BACKEND_FIELD_LABELS: Record<string, string> = {
  namaSupplier: "Nama Supplier",
  supplierName: "Nama Supplier",
};

function auditFieldErrorsToMessage(
  fieldErrs: Partial<Record<AuditFieldKey, string>> & Record<string, string>
): string {
  const keys = Object.keys(fieldErrs);
  if (keys.length === 0) return "";
  const onlyNamaSupplier = keys.every(
    (k) => k === "namaSupplier" || k === "supplierName"
  );
  if (onlyNamaSupplier) {
    return "Nama supplier tidak diisi di form Audit. Nama supplier diisi di langkah 2 (Data Supplier) setelah Anda simpan audit.";
  }
  const labels = keys.map(
    (k) => AUDIT_FIELD_LABELS[k as AuditFieldKey] || BACKEND_FIELD_LABELS[k] || k
  );
  return "Validasi gagal pada field: " + labels.join(", ");
}

/** Daftar error per field (untuk border merah + pesan di bawah input) */
function getAuditFieldErrors(f: SupplierAuditPayload): Partial<Record<AuditFieldKey, string>> {
  const err: Partial<Record<AuditFieldKey, string>> = {};
  if (!f.tanggalInspeksi?.trim()) err.tanggalInspeksi = MSG_REQUIRED;
  if (f.aIkanDitangkapPakaiKapal == null) err.aIkanDitangkapPakaiKapal = MSG_REQUIRED;
  if (!(f.aUkuranKapal?.trim())) err.aUkuranKapal = MSG_REQUIRED;
  if (f.aLamaWaktuPenangkapanMin == null) err.aLamaWaktuPenangkapanMin = MSG_REQUIRED;
  if (f.aLamaWaktuPenangkapanMax == null) err.aLamaWaktuPenangkapanMax = MSG_REQUIRED;
  if (f.aLamaWaktuPenangkapanMin != null && f.aLamaWaktuPenangkapanMax != null && f.aLamaWaktuPenangkapanMax < f.aLamaWaktuPenangkapanMin) {
    err.aLamaWaktuPenangkapanMin = MSG_RANGE;
    err.aLamaWaktuPenangkapanMax = MSG_RANGE;
  }
  if (!(f.aAlatTangkap?.trim())) err.aAlatTangkap = MSG_REQUIRED;
  if (f.aJumlahAlatTangkap == null) err.aJumlahAlatTangkap = MSG_REQUIRED;
  if (f.aBanyakUmpan == null) err.aBanyakUmpan = MSG_REQUIRED;
  if (f.aJumlahCrew == null) err.aJumlahCrew = MSG_REQUIRED;
  if (f.bKapalDenganPembeku == null) err.bKapalDenganPembeku = MSG_REQUIRED;
  if (f.bKapasitasPembekuGudang == null) err.bKapasitasPembekuGudang = MSG_REQUIRED;
  if (!(f.bAlurProsesPenanganan?.trim())) err.bAlurProsesPenanganan = MSG_REQUIRED;
  if (!(f.bPenerapanSanitasiKapal?.trim())) err.bPenerapanSanitasiKapal = MSG_REQUIRED;
  if (f.bBanyakEsPerTripMin == null) err.bBanyakEsPerTripMin = MSG_REQUIRED;
  if (f.bBanyakEsPerTripMax == null) err.bBanyakEsPerTripMax = MSG_REQUIRED;
  if (f.bBanyakEsPerTripMin != null && f.bBanyakEsPerTripMax != null && f.bBanyakEsPerTripMax < f.bBanyakEsPerTripMin) {
    err.bBanyakEsPerTripMin = MSG_RANGE;
    err.bBanyakEsPerTripMax = MSG_RANGE;
  }
  if (f.bLamaProsesHandling == null) err.bLamaProsesHandling = MSG_REQUIRED;
  if (!(f.bPembagianTugasKapal?.trim())) err.bPembagianTugasKapal = MSG_REQUIRED;
  if (f.cIkanDisimpanTempatPengumpul == null) err.cIkanDisimpanTempatPengumpul = MSG_REQUIRED;
  if (!(f.cAlurPenangananPengumpulan?.trim())) err.cAlurPenangananPengumpulan = MSG_REQUIRED;
  if (!(f.cMediaTempatMenampung?.trim())) err.cMediaTempatMenampung = MSG_REQUIRED;
  if (!(f.cPenangananIkan?.trim())) err.cPenangananIkan = MSG_REQUIRED;
  if (!(f.cSanitasiPenampungan?.trim())) err.cSanitasiPenampungan = MSG_REQUIRED;
  if (f.cJumlahPekerjaPenampungan == null) err.cJumlahPekerjaPenampungan = MSG_REQUIRED;
  if (f.cPenggunaanEsPenampungan == null) err.cPenggunaanEsPenampungan = MSG_REQUIRED;
  if (!(f.dCaraIkanDiangkut?.trim())) err.dCaraIkanDiangkut = MSG_REQUIRED;
  if (f.dKapasitasSekaliAngkutMin == null) err.dKapasitasSekaliAngkutMin = MSG_REQUIRED;
  if (f.dKapasitasSekaliAngkutMax == null) err.dKapasitasSekaliAngkutMax = MSG_REQUIRED;
  if (f.dKapasitasSekaliAngkutMin != null && f.dKapasitasSekaliAngkutMax != null && f.dKapasitasSekaliAngkutMax < f.dKapasitasSekaliAngkutMin) {
    err.dKapasitasSekaliAngkutMin = MSG_RANGE;
    err.dKapasitasSekaliAngkutMax = MSG_RANGE;
  }
  if (!(f.dKondisiSanitasiMedia?.trim())) err.dKondisiSanitasiMedia = MSG_REQUIRED;
  if (f.dLamaMuatAngkutBongkarMin == null) err.dLamaMuatAngkutBongkarMin = MSG_REQUIRED;
  if (f.dLamaMuatAngkutBongkarMax == null) err.dLamaMuatAngkutBongkarMax = MSG_REQUIRED;
  if (f.dLamaMuatAngkutBongkarMin != null && f.dLamaMuatAngkutBongkarMax != null && f.dLamaMuatAngkutBongkarMax < f.dLamaMuatAngkutBongkarMin) {
    err.dLamaMuatAngkutBongkarMin = MSG_RANGE;
    err.dLamaMuatAngkutBongkarMax = MSG_RANGE;
  }
  if (f.dTenagaProsesPengangkutan == null) err.dTenagaProsesPengangkutan = MSG_REQUIRED;
  return err;
}

function AddSupplierModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onError?: (msg: string) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [auditForm, setAuditForm] = useState<SupplierAuditPayload>(AUDIT_DEFAULTS);
  const auditFormRef = useRef(auditForm);
  auditFormRef.current = auditForm;
  const [supplierForm, setSupplierForm] = useState<CreateSupplierPayload>({
    auditId: "",
    supplierName: "",
    supplierType: "Perusahaan",
    alamat: "",
    nomorKontak: "",
    nomorIdentitas: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [auditFieldErrors, setAuditFieldErrors] = useState<Partial<Record<AuditFieldKey, string>>>({});

  const auditRangeError = getAuditRangeError(auditForm);
  const auditFilled = isAuditFilled(auditForm);
  const supplierValid = supplierForm.supplierName.trim().length > 0 && auditId != null;

  const inputClsBase =
    "w-full rounded-md border px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 dark:bg-dark-card ";
  const inputClsError =
    "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500";
  const inputClsNormal =
    "border-gray-300 focus:border-cyan focus:ring-cyan dark:border-gray-600";
  function auditInputCls(fieldKey: AuditFieldKey) {
    return inputClsBase + (auditFieldErrors[fieldKey] ? inputClsError : inputClsNormal);
  }
  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan dark:border-gray-600 dark:bg-dark-card";

  function setAudit<K extends keyof SupplierAuditPayload>(key: K, value: SupplierAuditPayload[K]) {
    setAuditForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setAuditFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key as AuditFieldKey];
      return next;
    });
  }
  function setSupplier(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setSupplierForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  }

  async function handleSubmitAudit(e: FormEvent) {
    e.preventDefault();
    const formEl = e.target as HTMLFormElement;
    const body = buildAuditRequestBodyFromForm(formEl);
    const payloadForValidation = body as unknown as SupplierAuditPayload;
    const rangeErr = getAuditRangeError(payloadForValidation);
    const fieldErrs = getAuditFieldErrors(payloadForValidation);
    if (Object.keys(fieldErrs).length > 0) {
      setAuditFieldErrors(fieldErrs);
      setError(rangeErr || "Perbaiki field yang ditandai merah.");
      return;
    }
    if (rangeErr) {
      setError(rangeErr);
      setAuditFieldErrors(getAuditFieldErrors(payloadForValidation));
      return;
    }
    const missingKeys = AUDIT_PAYLOAD_KEYS.filter((k) => {
      const val = body[k];
      if (val === undefined || val === null) return true;
      if (typeof val === "string" && val.trim() === "") return true;
      return false;
    });
    if (missingKeys.length > 0) {
      setError("Beberapa field belum terisi. Pastikan semua field wajib diisi sebelum simpan.");
      setAuditFieldErrors(
        missingKeys.reduce((acc, k) => ({ ...acc, [k]: "Wajib diisi" }), {} as Partial<Record<AuditFieldKey, string>>)
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    setAuditFieldErrors({});
    try {
      const res = await apiClient.post<ApiResponse<SupplierAuditResponse>>(
        "/v1/supplier-audits",
        body
      );
      const id = res.data?.data?.id ? String(res.data.data.id) : null;
      if (id) {
        setAuditId(id);
        setSupplierForm((prev) => ({ ...prev, auditId: id }));
        setSuccess("Audit tersimpan. Isi data supplier di bawah.");
        setStep(2);
      } else {
        setError("Respons server tidak berisi ID audit.");
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: Record<string, unknown>;
        };
      };
      const status = axiosErr.response?.status;
      const resData = axiosErr.response?.data as Record<string, unknown> | undefined;
      const backendMsg = (resData?.message as string) || "Gagal menyimpan audit";

      // Ambil field errors dari berbagai format respons backend (semua key dari backend)
      const allFieldErrs: Record<string, string> = {};
      if (status === 400 && resData) {
        const fromData = resData.data;
        if (fromData && typeof fromData === "object" && !Array.isArray(fromData)) {
          for (const [k, v] of Object.entries(fromData)) {
            if (typeof v === "string") allFieldErrs[k] = v;
          }
        }
        if (Object.keys(allFieldErrs).length === 0 && typeof resData === "object") {
          for (const [k, v] of Object.entries(resData)) {
            if (k !== "success" && k !== "message" && typeof v === "string") allFieldErrs[k] = v;
          }
        }
        const fromErrors = resData.errors;
        if (Object.keys(allFieldErrs).length === 0 && fromErrors && typeof fromErrors === "object" && !Array.isArray(fromErrors)) {
          for (const [k, v] of Object.entries(fromErrors)) {
            if (typeof v === "string") allFieldErrs[k] = v;
          }
        }
      }

      // Hanya field yang ada di form audit yang dapat border merah; namaSupplier dll hanya di pesan
      const formOnlyErrs: Partial<Record<AuditFieldKey, string>> = {};
      for (const key of AUDIT_PAYLOAD_KEYS) {
        if (allFieldErrs[key]) formOnlyErrs[key] = allFieldErrs[key];
      }
      setAuditFieldErrors(formOnlyErrs);

      // Pesan error: sebutkan field yang gagal (termasuk namaSupplier dengan penjelasan)
      if (Object.keys(allFieldErrs).length > 0) {
        setError(auditFieldErrorsToMessage(allFieldErrs) + ".");
      } else {
        // Bukan field errors: cek BadRequestException (range dll) → highlight field range
        const msgLower = (backendMsg || "").toLowerCase();
        if (msgLower.includes("lama waktu penangkapan") && msgLower.includes("max")) {
          setAuditFieldErrors({ aLamaWaktuPenangkapanMin: backendMsg, aLamaWaktuPenangkapanMax: backendMsg });
          setError(backendMsg);
        } else if (msgLower.includes("banyak es per trip") && msgLower.includes("max")) {
          setAuditFieldErrors({ bBanyakEsPerTripMin: backendMsg, bBanyakEsPerTripMax: backendMsg });
          setError(backendMsg);
        } else if (msgLower.includes("kapasitas sekali angkut") && msgLower.includes("max")) {
          setAuditFieldErrors({ dKapasitasSekaliAngkutMin: backendMsg, dKapasitasSekaliAngkutMax: backendMsg });
          setError(backendMsg);
        } else if (msgLower.includes("muat") && msgLower.includes("angkut") && msgLower.includes("max")) {
          setAuditFieldErrors({ dLamaMuatAngkutBongkarMin: backendMsg, dLamaMuatAngkutBongkarMax: backendMsg });
          setError(backendMsg);
        } else {
          setError(backendMsg);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitSupplier(e: FormEvent) {
    e.preventDefault();
    if (!supplierValid || !auditId) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post<ApiResponse<SupplierData>>("/v1/suppliers", {
        ...supplierForm,
        auditId,
      });
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message;
      const errorMsg = msg?.toLowerCase().includes("sudah terdaftar")
        ? "Supplier sudah terdaftar"
        : (msg || "Gagal menyimpan supplier");
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {step === 1 ? "Audit Supplier" : "Data Supplier"}
        </h2>

        {(error || (step === 1 && auditRangeError)) && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {step === 1 && auditRangeError ? auditRangeError : error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
            {success}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSubmitAudit} className="space-y-4">
            <Field label="Tanggal Inspeksi" required error={auditFieldErrors.tanggalInspeksi}>
              <input
                name="tanggalInspeksi"
                type="date"
                value={auditForm.tanggalInspeksi}
                onChange={(e) => setAudit("tanggalInspeksi", e.target.value)}
                className={auditInputCls("tanggalInspeksi")}
              />
            </Field>
            <AuditFormSection
              title="A: Kapal Penangkap Ikan dari Supplier"
              fields={
                <>
                  <Field label="Apakah Ikan ditangkap menggunakan Kapal Penangkap Ikan?" required error={auditFieldErrors.aIkanDitangkapPakaiKapal}>
                    <select name="aIkanDitangkapPakaiKapal" value={auditForm.aIkanDitangkapPakaiKapal === true ? "true" : auditForm.aIkanDitangkapPakaiKapal === false ? "false" : ""} onChange={(e) => setAudit("aIkanDitangkapPakaiKapal", e.target.value === "true" ? true : e.target.value === "false" ? false : undefined)} className={auditInputCls("aIkanDitangkapPakaiKapal")}>
                      <option value="">-- Pilih --</option>
                      <option value="true">Ya</option>
                      <option value="false">Tidak</option>
                    </select>
                  </Field>
                  <Field label="Berapa besar Ukuran Kapal yang digunakan untuk menangkap Ikan?" required error={auditFieldErrors.aUkuranKapal}>
                    <input name="aUkuranKapal" maxLength={100} value={auditForm.aUkuranKapal ?? ""} onChange={(e) => setAudit("aUkuranKapal", e.target.value)} className={auditInputCls("aUkuranKapal")} placeholder="..." />
                  </Field>
                  <Field label="Berapa lama waktu penangkapan ikan?" required error={auditFieldErrors.aLamaWaktuPenangkapanMin ?? auditFieldErrors.aLamaWaktuPenangkapanMax}>
                    <div className="flex gap-2 items-center">
                      <input name="aLamaWaktuPenangkapanMin" type="number" min={0} placeholder="Min (jam)" value={auditForm.aLamaWaktuPenangkapanMin ?? ""} onChange={(e) => setAudit("aLamaWaktuPenangkapanMin", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("aLamaWaktuPenangkapanMin")} />
                      <span className="text-gray-500">s/d</span>
                      <input name="aLamaWaktuPenangkapanMax" type="number" min={0} placeholder="Max (jam)" value={auditForm.aLamaWaktuPenangkapanMax ?? ""} onChange={(e) => setAudit("aLamaWaktuPenangkapanMax", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("aLamaWaktuPenangkapanMax")} />
                    </div>
                  </Field>
                  <Field label="Alat Tangkap apa yang digunakan untuk menangkap Ikan?" required error={auditFieldErrors.aAlatTangkap}>
                    <input name="aAlatTangkap" maxLength={255} value={auditForm.aAlatTangkap ?? ""} onChange={(e) => setAudit("aAlatTangkap", e.target.value)} className={auditInputCls("aAlatTangkap")} placeholder="Pukat Harimau" />
                  </Field>
                  <Field label="Berapa banyak jumlah alat tangkap yang dibawa selama 1 trip penangkapan ikan?" required error={auditFieldErrors.aJumlahAlatTangkap}>
                    <input name="aJumlahAlatTangkap" type="number" min={0} value={auditForm.aJumlahAlatTangkap ?? ""} onChange={(e) => setAudit("aJumlahAlatTangkap", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("aJumlahAlatTangkap")} placeholder="pieces" />
                  </Field>
                  <Field label="Berapa banyak umpan yang dibawa?" required error={auditFieldErrors.aBanyakUmpan}>
                    <input name="aBanyakUmpan" type="number" min={0} value={auditForm.aBanyakUmpan ?? ""} onChange={(e) => setAudit("aBanyakUmpan", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("aBanyakUmpan")} placeholder="pieces"/>
                  </Field>
                  <Field label="Berapa jumlah orang / crew kapal?" required error={auditFieldErrors.aJumlahCrew}>
                    <input name="aJumlahCrew" type="number" min={0} value={auditForm.aJumlahCrew ?? ""} onChange={(e) => setAudit("aJumlahCrew", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("aJumlahCrew")} placeholder="orang" />
                  </Field>
                </>
              }
            />
            <AuditFormSection
              title="B: Cara Penanganan Ikan di atas Kapal oleh Supplier"
              fields={
                <>
                  <Field label="Kapal yang digunakan apakah kapal dengan pembeku?" required error={auditFieldErrors.bKapalDenganPembeku}>
                    <select name="bKapalDenganPembeku" value={auditForm.bKapalDenganPembeku === true ? "true" : auditForm.bKapalDenganPembeku === false ? "false" : ""} onChange={(e) => setAudit("bKapalDenganPembeku", e.target.value === "true" ? true : e.target.value === "false" ? false : undefined)} className={auditInputCls("bKapalDenganPembeku")}>
                    <option value="">-- Pilih --</option>
                    <option value="true">Ya</option>
                    <option value="false">Tidak</option>
                  </select>
                  </Field>
                  <Field label="Berapa kapasitas pembeku dan gudang beku di atas kapal?" required error={auditFieldErrors.bKapasitasPembekuGudang}>
                    <input name="bKapasitasPembekuGudang" type="number" min={0} value={auditForm.bKapasitasPembekuGudang ?? ""} onChange={(e) => setAudit("bKapasitasPembekuGudang", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("bKapasitasPembekuGudang")} placeholder="kg" />
                  </Field>
                  <Field label="Bagaimana alur proses penanganan di atas kapal?" required error={auditFieldErrors.bAlurProsesPenanganan}>
                    <textarea name="bAlurProsesPenanganan" maxLength={500} rows={2} value={auditForm.bAlurProsesPenanganan ?? ""} onChange={(e) => setAudit("bAlurProsesPenanganan", e.target.value)} className={auditInputCls("bAlurProsesPenanganan")} placeholder="..." />
                  </Field>
                  <Field label="Bagaimana penerapan sanitasi di atas kapal?" required error={auditFieldErrors.bPenerapanSanitasiKapal}>
                    <textarea name="bPenerapanSanitasiKapal" maxLength={500} rows={2} value={auditForm.bPenerapanSanitasiKapal ?? ""} onChange={(e) => setAudit("bPenerapanSanitasiKapal", e.target.value)} className={auditInputCls("bPenerapanSanitasiKapal")} placeholder="..." />
                  </Field>
                  <Field label="Berapa banyak es yang dibawa setiap 1 trip?" required error={auditFieldErrors.bBanyakEsPerTripMin ?? auditFieldErrors.bBanyakEsPerTripMax}>
                    <div className="flex gap-2 items-center">
                      <input name="bBanyakEsPerTripMin" type="number" min={0} placeholder="Min (kg)" value={auditForm.bBanyakEsPerTripMin ?? ""} onChange={(e) => setAudit("bBanyakEsPerTripMin", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("bBanyakEsPerTripMin")} />
                      <span className="text-gray-500">s/d</span>
                      <input name="bBanyakEsPerTripMax" type="number" min={0} placeholder="Max (kg)" value={auditForm.bBanyakEsPerTripMax ?? ""} onChange={(e) => setAudit("bBanyakEsPerTripMax", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("bBanyakEsPerTripMax")} />
                    </div>
                  </Field>
                  <Field label="Berapa lama proses penangkapan dan handling ikan di atas kapal?" required error={auditFieldErrors.bLamaProsesHandling}>
                    <input name="bLamaProsesHandling" type="number" min={0} value={auditForm.bLamaProsesHandling ?? ""} onChange={(e) => setAudit("bLamaProsesHandling", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("bLamaProsesHandling")} placeholder="jam" />
                  </Field>
                  <Field label="Bagaimana pembagian tugas di atas kapal?" required error={auditFieldErrors.bPembagianTugasKapal}>
                    <input name="bPembagianTugasKapal" maxLength={255} value={auditForm.bPembagianTugasKapal ?? ""} onChange={(e) => setAudit("bPembagianTugasKapal", e.target.value)} className={auditInputCls("bPembagianTugasKapal")} placeholder="..." />
                  </Field>
                </>
              }
            />
            <AuditFormSection
              title="C: Cara Penanganan Ikan di tempat pengumpul sementara oleh Supplier"
              fields={
                <>
                  <Field label="Apakah ikan disimpan terlebih dahulu di tempat pengumpul?" required error={auditFieldErrors.cIkanDisimpanTempatPengumpul}>
                    <select name="cIkanDisimpanTempatPengumpul" value={auditForm.cIkanDisimpanTempatPengumpul === true ? "true" : auditForm.cIkanDisimpanTempatPengumpul === false ? "false" : ""} onChange={(e) => setAudit("cIkanDisimpanTempatPengumpul", e.target.value === "true" ? true : e.target.value === "false" ? false : undefined)} className={auditInputCls("cIkanDisimpanTempatPengumpul")}>
                    <option value="">-- Pilih --</option>
                    <option value="true">Ya</option>
                    <option value="false">Tidak</option>
                  </select>
                  </Field>
                  <Field label="Bagaimana alur penanganan di tempat pengumpulan sementara?" required error={auditFieldErrors.cAlurPenangananPengumpulan}>
                    <textarea name="cAlurPenangananPengumpulan" maxLength={500} rows={2} value={auditForm.cAlurPenangananPengumpulan ?? ""} onChange={(e) => setAudit("cAlurPenangananPengumpulan", e.target.value)} className={auditInputCls("cAlurPenangananPengumpulan")} placeholder="..." />
                  </Field>
                  <Field label="Media apa yang digunakan sebagai tempat menampung sementara?" required error={auditFieldErrors.cMediaTempatMenampung}>
                    <input name="cMediaTempatMenampung" maxLength={255} value={auditForm.cMediaTempatMenampung ?? ""} onChange={(e) => setAudit("cMediaTempatMenampung", e.target.value)} className={auditInputCls("cMediaTempatMenampung")} placeholder="..." />
                  </Field>
                  <Field label="Bagaimana penanganan ikan?" required error={auditFieldErrors.cPenangananIkan}>
                    <textarea name="cPenangananIkan" maxLength={500} rows={2} value={auditForm.cPenangananIkan ?? ""} onChange={(e) => setAudit("cPenangananIkan", e.target.value)} className={auditInputCls("cPenangananIkan")} placeholder="..." />
                  </Field>
                  <Field label="Bagaimana penerapan sanitasi di tempat penampungan sementara?" required error={auditFieldErrors.cSanitasiPenampungan}>
                    <textarea name="cSanitasiPenampungan" maxLength={500} rows={2} value={auditForm.cSanitasiPenampungan ?? ""} onChange={(e) => setAudit("cSanitasiPenampungan", e.target.value)} className={auditInputCls("cSanitasiPenampungan")} placeholder="..." />
                  </Field>
                  <Field label="Berapa jumlah pekerja ditempat penampungan sementara?" required error={auditFieldErrors.cJumlahPekerjaPenampungan}>
                    <input name="cJumlahPekerjaPenampungan" type="number" min={0} value={auditForm.cJumlahPekerjaPenampungan ?? ""} onChange={(e) => setAudit("cJumlahPekerjaPenampungan", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("cJumlahPekerjaPenampungan")} placeholder="orang" />
                  </Field>
                  <Field label="Berapa banyak penggunaan es untuk menampung ikan?" required error={auditFieldErrors.cPenggunaanEsPenampungan}>
                    <input name="cPenggunaanEsPenampungan" type="number" min={0} value={auditForm.cPenggunaanEsPenampungan ?? ""} onChange={(e) => setAudit("cPenggunaanEsPenampungan", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("cPenggunaanEsPenampungan")} placeholder="Integer" />
                  </Field>
                </>
              }
            />
            <AuditFormSection
              title="D: Media Pengangkut Ikan"
              fields={
                <>
                  <Field label="Bagaimana Ikan diangkut dan dibawa ke Unit Pengolahan?" required error={auditFieldErrors.dCaraIkanDiangkut}>
                    <textarea name="dCaraIkanDiangkut" maxLength={500} rows={2} value={auditForm.dCaraIkanDiangkut ?? ""} onChange={(e) => setAudit("dCaraIkanDiangkut", e.target.value)} className={auditInputCls("dCaraIkanDiangkut")} placeholder="..." />
                  </Field>
                  <Field label="Berapa Kapasitas sekali angkut?" required error={auditFieldErrors.dKapasitasSekaliAngkutMin ?? auditFieldErrors.dKapasitasSekaliAngkutMax}>
                    <div className="flex gap-2 items-center">
                      <input name="dKapasitasSekaliAngkutMin" type="number" min={0} placeholder="Min (kg)" value={auditForm.dKapasitasSekaliAngkutMin ?? ""} onChange={(e) => setAudit("dKapasitasSekaliAngkutMin", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("dKapasitasSekaliAngkutMin")} />
                      <span className="text-gray-500">s/d</span>
                      <input name="dKapasitasSekaliAngkutMax" type="number" min={0} placeholder="Max (kg)" value={auditForm.dKapasitasSekaliAngkutMax ?? ""} onChange={(e) => setAudit("dKapasitasSekaliAngkutMax", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("dKapasitasSekaliAngkutMax")} />
                    </div>
                  </Field>
                  <Field label="Bagaimana kondisi Sanitasi Media Pengangkut Ikan?" required error={auditFieldErrors.dKondisiSanitasiMedia}>
                    <textarea name="dKondisiSanitasiMedia" maxLength={500} rows={2} value={auditForm.dKondisiSanitasiMedia ?? ""} onChange={(e) => setAudit("dKondisiSanitasiMedia", e.target.value)} className={auditInputCls("dKondisiSanitasiMedia")} placeholder="..." />
                  </Field>
                  <Field label="Berapa lama proses Muat, Angkut dan Bongkar menuju Unit Pengolahan?" required error={auditFieldErrors.dLamaMuatAngkutBongkarMin ?? auditFieldErrors.dLamaMuatAngkutBongkarMax}>
                    <div className="flex gap-2 items-center">
                      <input name="dLamaMuatAngkutBongkarMin" type="number" min={0} placeholder="Min (jam)" value={auditForm.dLamaMuatAngkutBongkarMin ?? ""} onChange={(e) => setAudit("dLamaMuatAngkutBongkarMin", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("dLamaMuatAngkutBongkarMin")} />
                      <span className="text-gray-500">s/d</span>
                      <input name="dLamaMuatAngkutBongkarMax" type="number" min={0} placeholder="Max (jam)" value={auditForm.dLamaMuatAngkutBongkarMax ?? ""} onChange={(e) => setAudit("dLamaMuatAngkutBongkarMax", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("dLamaMuatAngkutBongkarMax")} />
                    </div>
                  </Field>
                  <Field label="Berapa banyak tenaga yang digunakan untuk proses pengangkutan?" required error={auditFieldErrors.dTenagaProsesPengangkutan}>
                    <input name="dTenagaProsesPengangkutan" type="number" min={0} value={auditForm.dTenagaProsesPengangkutan ?? ""} onChange={(e) => setAudit("dTenagaProsesPengangkutan", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("dTenagaProsesPengangkutan")} placeholder="orang" />
                  </Field>
                </>
              }
            />
            <div className="flex flex-col items-end gap-2 pt-2">
              {!auditFilled && (
                <p className="text-sm text-amber-600 dark:text-amber-400 w-full">Isi semua field wajib sebelum menyimpan.</p>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-white/5">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="rounded-md bg-cyan px-4 py-2 text-sm font-medium text-white hover:bg-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? "Menyimpan…" : "Simpan Audit & Lanjut"}
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmitSupplier} className="space-y-4">
            <Field label="Nama Supplier" required>
              <input name="supplierName" value={supplierForm.supplierName} onChange={setSupplier} placeholder="Masukkan nama supplier" maxLength={150} className={inputCls} />
            </Field>
            <Field label="Tipe Supplier">
              <select name="supplierType" value={supplierForm.supplierType} onChange={setSupplier} className={inputCls}>
                {SUPPLIER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Alamat">
              <input name="alamat" value={supplierForm.alamat} onChange={setSupplier} placeholder="Alamat (maks. 255)" maxLength={255} className={inputCls} />
            </Field>
            <Field label="Nomor Kontak">
              <input name="nomorKontak" value={supplierForm.nomorKontak} onChange={setSupplier} placeholder="Maks. 50" maxLength={50} className={inputCls} />
            </Field>
            <Field label="Nomor Identitas">
              <input name="nomorIdentitas" value={supplierForm.nomorIdentitas} onChange={setSupplier} placeholder="Maks. 100, unik" maxLength={100} className={inputCls} />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-white/5">
                Kembali
              </button>
              <button type="submit" disabled={!supplierValid || submitting} className="rounded-md bg-cyan px-4 py-2 text-sm font-medium text-white hover:bg-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? "Menyimpan…" : "Simpan Supplier"}
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalOverlay>
  );
}

function AuditFormSection({ title, fields }: { title: string; fields: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
      {fields}
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

/* ================================================================
   Shared UI Components
   ================================================================ */

function ModalOverlay({
  onClose,
  children,
  panelClassName,
}: {
  onClose: () => void;
  children: React.ReactNode;
  /** Tambahan kelas panel (sama pola dengan Master Data Supplier: default lebar max-w-2xl) */
  panelClassName?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full rounded-xl bg-white p-6 shadow-2xl dark:bg-dark-card ${
          panelClassName ?? "max-w-2xl"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-lg leading-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Tutup"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
