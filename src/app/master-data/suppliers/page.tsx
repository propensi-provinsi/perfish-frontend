"use client";

import { Fragment, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  HiOutlineArrowDown,
  HiOutlineArrowUp,
  HiOutlineCheckCircle,
  HiOutlineDocumentMagnifyingGlass,
  HiOutlineExclamationCircle,
  HiOutlinePencilSquare,
  HiOutlineXMark,
} from "react-icons/hi2";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ViewSupplierAuditModal } from "@/components/suppliers/ViewSupplierAuditModal";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import type {
  ApiResponse,
  CurrencyOption,
  PaymentTermOption,
  SupplierAuditPayload,
  SupplierAuditResponse,
  SupplierData,
} from "@/types";
import { SUPPLIER_TYPES, type MasterSupplierApprovalStatus } from "@/types/supplier";

export default function SupplierMasterDataPage() {
  return (
    <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
      <AppShell>
        <SuppliersContent />
      </AppShell>
    </ProtectedRoute>
  );
}

type SortOrder = "asc" | "desc";
type FilterStatus = "" | "active" | "inactive";
type FilterApproval = "" | "APPROVED" | "PENDING_APPROVAL" | "REJECTED";
type Notif = { type: "success" | "error"; message: string };

function SuppliersContent() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingApprovalId, setUpdatingApprovalId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("");
  const [filterApproval, setFilterApproval] = useState<FilterApproval>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierData | null>(null);
  const [viewAuditSupplier, setViewAuditSupplier] = useState<SupplierData | null>(null);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermOption[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);

  const [notif, setNotif] = useState<Notif | null>(null);

  useEffect(() => {
    if (!notif) return;
    const t = setTimeout(() => setNotif(null), 4000);
    return () => clearTimeout(t);
  }, [notif]);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<ApiResponse<SupplierData[]>>("/v1/suppliers");
      setSuppliers(data.data);
    } catch {
      setNotif({ type: "error", message: "Gagal memuat data supplier" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

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
        setNotif({ type: "error", message: "Gagal memuat master payment term/currency." });
      }
    }
    void loadSupplierMasters();
  }, []);

  const displayed = useMemo(() => {
    let rows = suppliers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.supplierName.toLowerCase().includes(q) ||
          s.supplierCode.toLowerCase().includes(q) ||
          (s.alamat ?? "").toLowerCase().includes(q)
      );
    }

    if (filterStatus === "active") rows = rows.filter((s) => s.active);
    else if (filterStatus === "inactive") rows = rows.filter((s) => !s.active);

    if (filterApproval) rows = rows.filter((s) => s.approvalStatus === filterApproval);

    rows = [...rows].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? da - db : db - da;
    });

    return rows;
  }, [suppliers, searchQuery, filterStatus, filterApproval, sortOrder]);

  const paymentTermLabelById = useMemo(
    () => new Map(paymentTerms.map((term) => [term.paymentTermId, term.termName])),
    [paymentTerms]
  );
  const currencyLabelById = useMemo(
    () => new Map(currencies.map((currency) => [currency.currencyId, currency.currencyName])),
    [currencies]
  );

  function getApprovalLabel(approvalStatus?: string) {
    if (approvalStatus === "APPROVED") return "Disetujui";
    if (approvalStatus === "REJECTED") return "Ditolak";
    if (approvalStatus === "PENDING_APPROVAL") return "Menunggu persetujuan";
    return "Menunggu";
  }

  function getActivationBlockedReason(supplier: SupplierData): string | null {
    const approvalStatus = String(supplier.approvalStatus ?? "");
    if (approvalStatus === "PENDING_APPROVAL") {
      return `Supplier "${supplier.supplierName}" tidak bisa diaktifkan karena status persetujuan masih Menunggu.`;
    }
    if (approvalStatus === "REJECTED") {
      return `Supplier "${supplier.supplierName}" tidak bisa diaktifkan karena status persetujuan Ditolak.`;
    }
    return null;
  }

  async function handleApprovalChange(supplier: SupplierData, next: MasterSupplierApprovalStatus) {
    const current = supplier.approvalStatus ?? "PENDING_APPROVAL";
    if (current === next) return;
    setUpdatingApprovalId(supplier.id);
    try {
      await apiClient.patch<ApiResponse<SupplierData>>(`/v1/suppliers/${supplier.id}/approval`, {
        approvalStatus: next,
      });
      setNotif({ type: "success", message: "Status persetujuan supplier diperbarui." });
      await fetchSuppliers();
    } catch {
      setNotif({ type: "error", message: "Gagal memperbarui status persetujuan." });
    } finally {
      setUpdatingApprovalId(null);
    }
  }

  const canAddSupplier = user?.role === "SUPERADMIN" || user?.role === "KEPALA_CABANG";
  const canEditApproval = user?.role === "KEPALA_CABANG" || user?.role === "SUPERADMIN";

  function handleCreated() {
    setShowAddModal(false);
    setNotif({ type: "success", message: "Supplier berhasil ditambahkan" });
    fetchSuppliers();
  }

  function handleUpdated() {
    setEditingSupplier(null);
    setNotif({ type: "success", message: "Supplier berhasil diperbarui" });
    fetchSuppliers();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Master Data Supplier</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Kelola data supplier: tambah, edit, nonaktifkan, dan lihat audit supplier
        </p>
      </div>

      {/* Toast */}
      {notif && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            notif.type === "success"
              ? "border-green/30 bg-green/10 text-green"
              : "border-red/30 bg-red/10 text-red"
          }`}
        >
          {notif.type === "success" ? (
            <HiOutlineCheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{notif.message}</span>
          <button onClick={() => setNotif(null)} className="ml-auto">
            <HiOutlineXMark className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2 max-w-3xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, kode, alamat…"
            className="flex-1 min-w-[180px] rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section
              dark:text-gray-100 px-3 py-2 text-sm focus:border-cyan focus:outline-none
              focus:ring-2 focus:ring-cyan/20 dark:placeholder:text-gray-500 transition-colors"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section dark:text-gray-100 px-3 py-2 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>

          <select
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value as FilterApproval)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section dark:text-gray-100 px-3 py-2 text-sm"
          >
            <option value="">Semua Persetujuan</option>
            <option value="APPROVED">Disetujui</option>
            <option value="PENDING_APPROVAL">Menunggu</option>
            <option value="REJECTED">Ditolak</option>
          </select>

          <button
            onClick={() => setSortOrder((p) => (p === "asc" ? "desc" : "asc"))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600
              px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            {sortOrder === "asc" ? (
              <>
                <HiOutlineArrowUp className="h-4 w-4" /> Terlama
              </>
            ) : (
              <>
                <HiOutlineArrowDown className="h-4 w-4" /> Terbaru
              </>
            )}
          </button>
        </div>

        {canAddSupplier && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white
              hover:bg-cyan-hover active:scale-[0.98] transition-all shrink-0"
          >
            + Tambah Supplier
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400">{displayed.length} supplier ditemukan</p>

      {/* Table */}
      {loading ? (
        <p className="text-gray-400 text-sm">Memuat supplier…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-dark-section">
              <tr>
                {["Kode", "Nama supplier", "Tipe", "Payment Term", "Currency", "Alamat", "Kontak", "Status", "Persetujuan", "Aksi"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">
                    {searchQuery || filterStatus || filterApproval
                      ? "Tidak ada supplier yang cocok."
                      : "Belum ada data supplier."}
                  </td>
                </tr>
              ) : (
                displayed.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {s.supplierCode}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {s.supplierName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{s.supplierType || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {s.paymentTermId != null
                        ? (paymentTermLabelById.get(s.paymentTermId) ?? "—")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {s.currency != null
                        ? (currencyLabelById.get(s.currency) ?? "—")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[180px] truncate">
                      {s.alamat || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {s.nomorKontak || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          s.active ? "bg-green-light text-green" : "bg-red-light text-red"
                        }`}
                      >
                        {s.active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {canEditApproval ? (
                        <select
                          value={(s.approvalStatus ?? "PENDING_APPROVAL") as MasterSupplierApprovalStatus}
                          disabled={updatingApprovalId === s.id}
                          onChange={(e) =>
                            handleApprovalChange(s, e.target.value as MasterSupplierApprovalStatus)
                          }
                          className="max-w-[11rem] rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-800 shadow-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:opacity-60 dark:border-gray-600 dark:bg-dark-section dark:text-gray-100"
                          aria-label={`Persetujuan ${s.supplierName}`}
                        >
                          <option value="PENDING_APPROVAL">{getApprovalLabel("PENDING_APPROVAL")}</option>
                          <option value="APPROVED">{getApprovalLabel("APPROVED")}</option>
                          <option value="REJECTED">{getApprovalLabel("REJECTED")}</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            String(s.approvalStatus ?? "") === "APPROVED"
                              ? "bg-green-100 text-green-700"
                              : String(s.approvalStatus ?? "") === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {getApprovalLabel(s.approvalStatus)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setEditingSupplier(s)}
                          title="Edit supplier"
                          className="rounded-lg p-1.5 text-gray-400 hover:text-cyan hover:bg-cyan/10 transition-colors"
                        >
                          <HiOutlinePencilSquare className="h-4 w-4" />
                        </button>
                        {s.auditId && (
                          <button
                            onClick={() => setViewAuditSupplier(s)}
                            title="Lihat audit"
                            className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors"
                          >
                            <HiOutlineDocumentMagnifyingGlass className="h-4 w-4" />
                          </button>
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

      {/* Modals */}
      {showAddModal && (
        <AddSupplierFlow
          paymentTerms={paymentTerms}
          currencies={currencies}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleCreated}
        />
      )}
      {editingSupplier && (
        <EditSupplierModal
          key={editingSupplier.id}
          supplier={editingSupplier}
          paymentTerms={paymentTerms}
          currencies={currencies}
          getActivationBlockedReason={getActivationBlockedReason}
          onClose={() => setEditingSupplier(null)}
          onSuccess={handleUpdated}
        />
      )}
      {viewAuditSupplier && (
        <ViewSupplierAuditModal
          supplier={viewAuditSupplier}
          onClose={() => setViewAuditSupplier(null)}
          onSaved={() => setNotif({ type: "success", message: "Audit berhasil diperbarui" })}
        />
      )}
    </div>
  );
}

/* ── Audit validation (sama dengan inbound-ikan) ───────────────── */
type AuditFieldKey = keyof SupplierAuditPayload;
const MSG_REQUIRED = "Wajib diisi";
const MSG_RANGE = "Max tidak boleh lebih kecil dari min";

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

function buildAuditRequestBodyFromForm(formEl: HTMLFormElement): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const key of AUDIT_PAYLOAD_KEYS) {
    const el = formEl.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    if (!el) continue;
    const raw = "value" in el ? el.value : "";
    if (el.type === "number") body[key] = raw === "" ? undefined : Number(raw);
    else if (el.tagName === "SELECT" && (raw === "true" || raw === "false")) body[key] = raw === "true";
    else if (key === "tanggalInspeksi" || el.type === "date") body[key] = raw.trim().slice(0, 10) || undefined;
    else body[key] = raw.trim() || undefined;
  }
  return body;
}

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

function getAuditFieldErrors(f: SupplierAuditPayload): Partial<Record<AuditFieldKey, string>> {
  const err: Partial<Record<AuditFieldKey, string>> = {};
  if (!f.tanggalInspeksi?.trim()) err.tanggalInspeksi = MSG_REQUIRED;
  if (f.aIkanDitangkapPakaiKapal == null) err.aIkanDitangkapPakaiKapal = MSG_REQUIRED;
  if (!(f.aUkuranKapal?.trim())) err.aUkuranKapal = MSG_REQUIRED;
  if (f.aLamaWaktuPenangkapanMin == null) err.aLamaWaktuPenangkapanMin = MSG_REQUIRED;
  if (f.aLamaWaktuPenangkapanMax == null) err.aLamaWaktuPenangkapanMax = MSG_REQUIRED;
  if (f.aLamaWaktuPenangkapanMin != null && f.aLamaWaktuPenangkapanMax != null && f.aLamaWaktuPenangkapanMax < f.aLamaWaktuPenangkapanMin) {
    err.aLamaWaktuPenangkapanMin = MSG_RANGE; err.aLamaWaktuPenangkapanMax = MSG_RANGE;
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
    err.bBanyakEsPerTripMin = MSG_RANGE; err.bBanyakEsPerTripMax = MSG_RANGE;
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
    err.dKapasitasSekaliAngkutMin = MSG_RANGE; err.dKapasitasSekaliAngkutMax = MSG_RANGE;
  }
  if (!(f.dKondisiSanitasiMedia?.trim())) err.dKondisiSanitasiMedia = MSG_REQUIRED;
  if (f.dLamaMuatAngkutBongkarMin == null) err.dLamaMuatAngkutBongkarMin = MSG_REQUIRED;
  if (f.dLamaMuatAngkutBongkarMax == null) err.dLamaMuatAngkutBongkarMax = MSG_REQUIRED;
  if (f.dLamaMuatAngkutBongkarMin != null && f.dLamaMuatAngkutBongkarMax != null && f.dLamaMuatAngkutBongkarMax < f.dLamaMuatAngkutBongkarMin) {
    err.dLamaMuatAngkutBongkarMin = MSG_RANGE; err.dLamaMuatAngkutBongkarMax = MSG_RANGE;
  }
  if (f.dTenagaProsesPengangkutan == null) err.dTenagaProsesPengangkutan = MSG_REQUIRED;
  return err;
}

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

/* ================================================================
   Add Supplier Flow (Step 1: Audit, Step 2: Data Supplier)
   Kata-kata dan validasi sama dengan inbound-ikan; error hanya di field.
   ================================================================ */

const AUDIT_DEFAULTS: SupplierAuditPayload = { tanggalInspeksi: new Date().toISOString().slice(0, 10) };

function AddSupplierFlow({
  paymentTerms,
  currencies,
  onClose,
  onSuccess,
}: {
  paymentTerms: PaymentTermOption[];
  currencies: CurrencyOption[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [auditForm, setAuditForm] = useState<SupplierAuditPayload>(AUDIT_DEFAULTS);
  const [auditFieldErrors, setAuditFieldErrors] = useState<Partial<Record<AuditFieldKey, string>>>({});
  const [supplierFieldErrors, setSupplierFieldErrors] = useState<Partial<Record<string, string>>>({});

  const [supplierForm, setSupplierForm] = useState({
    supplierName: "",
    supplierType: "Perusahaan",
    paymentTermId: null as number | null,
    currency: null as number | null,
    alamat: "",
    nomorKontak: "",
    nomorIdentitas: "",
  });

  const auditFilled = isAuditFilled(auditForm);
  const supplierValid = supplierForm.supplierName.trim().length > 0 && auditId != null;

  const inputClsBase = "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 dark:bg-dark-card dark:text-gray-100 ";
  const inputClsError = "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500";
  const inputClsNormal = "border-gray-300 focus:border-cyan focus:ring-cyan dark:border-gray-600";
  function auditInputCls(fieldKey: AuditFieldKey) {
    return inputClsBase + (auditFieldErrors[fieldKey] ? inputClsError : inputClsNormal);
  }
  const inputCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan dark:border-gray-600 dark:bg-dark-card dark:text-gray-100";
  function supplierInputCls(field: string) {
    return inputClsBase + (supplierFieldErrors[field] ? inputClsError : inputClsNormal);
  }

  function setAudit<K extends keyof SupplierAuditPayload>(key: K, val: SupplierAuditPayload[K]) {
    setAuditForm((prev) => ({ ...prev, [key]: val }));
    setAuditFieldErrors((prev) => { const next = { ...prev }; delete next[key as AuditFieldKey]; return next; });
  }
  function setSupplier(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setSupplierForm((prev) => {
      if (name === "paymentTermId" || name === "currency") {
        return { ...prev, [name]: value === "" ? null : Number(value) };
      }
      return { ...prev, [name]: value };
    });
    setSupplierFieldErrors((prev) => { const next = { ...prev }; delete next[e.target.name]; return next; });
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
      return;
    }
    if (rangeErr) {
      setAuditFieldErrors(getAuditFieldErrors(payloadForValidation));
      return;
    }
    const missingKeys = AUDIT_PAYLOAD_KEYS.filter((k) => {
      const val = body[k];
      return val === undefined || val === null || (typeof val === "string" && !val.trim());
    });
    if (missingKeys.length > 0) {
      setAuditFieldErrors(
        missingKeys.reduce((acc, k) => ({ ...acc, [k]: MSG_REQUIRED }), {} as Partial<Record<AuditFieldKey, string>>)
      );
      return;
    }
    setSubmitting(true);
    setAuditFieldErrors({});
    try {
      const res = await apiClient.post<ApiResponse<SupplierAuditResponse>>("/v1/supplier-audits", body);
      const id = res.data?.data?.id ? String(res.data.data.id) : null;
      if (id) {
        setAuditId(id);
        setSupplierForm((prev) => ({ ...prev, auditId: id }));
        setSuccess("Audit tersimpan. Isi data supplier di bawah.");
        setStep(2);
      } else {
        setAuditFieldErrors({ tanggalInspeksi: "Respons server tidak berisi ID audit." });
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: Record<string, unknown> } };
      const resData = axiosErr.response?.data;
      const backendMsg = (resData?.message as string) || "Gagal menyimpan audit";
      const allFieldErrs: Record<string, string> = {};
      if (axiosErr.response?.status === 400 && resData) {
        const fromData = resData.data;
        if (fromData && typeof fromData === "object" && !Array.isArray(fromData)) {
          for (const [k, v] of Object.entries(fromData)) { if (typeof v === "string") allFieldErrs[k] = v; }
        }
        if (Object.keys(allFieldErrs).length === 0 && typeof resData === "object") {
          for (const [k, v] of Object.entries(resData)) {
            if (k !== "success" && k !== "message" && typeof v === "string") allFieldErrs[k] = v;
          }
        }
        const fromErrors = resData.errors;
        if (Object.keys(allFieldErrs).length === 0 && fromErrors && typeof fromErrors === "object" && !Array.isArray(fromErrors)) {
          for (const [k, v] of Object.entries(fromErrors)) { if (typeof v === "string") allFieldErrs[k] = v; }
        }
      }
      const formOnlyErrs: Partial<Record<AuditFieldKey, string>> = {};
      for (const key of AUDIT_PAYLOAD_KEYS) {
        if (allFieldErrs[key]) formOnlyErrs[key] = allFieldErrs[key];
      }
      if (Object.keys(formOnlyErrs).length === 0) {
        const msgLower = (backendMsg || "").toLowerCase();
        if (msgLower.includes("lama waktu penangkapan") && msgLower.includes("max")) {
          setAuditFieldErrors({ aLamaWaktuPenangkapanMin: backendMsg, aLamaWaktuPenangkapanMax: backendMsg });
        } else if (msgLower.includes("banyak es per trip") && msgLower.includes("max")) {
          setAuditFieldErrors({ bBanyakEsPerTripMin: backendMsg, bBanyakEsPerTripMax: backendMsg });
        } else if (msgLower.includes("kapasitas sekali angkut") && msgLower.includes("max")) {
          setAuditFieldErrors({ dKapasitasSekaliAngkutMin: backendMsg, dKapasitasSekaliAngkutMax: backendMsg });
        } else if (msgLower.includes("muat") && msgLower.includes("angkut") && msgLower.includes("max")) {
          setAuditFieldErrors({ dLamaMuatAngkutBongkarMin: backendMsg, dLamaMuatAngkutBongkarMax: backendMsg });
        } else {
          setAuditFieldErrors({ tanggalInspeksi: backendMsg });
        }
      } else {
        setAuditFieldErrors(formOnlyErrs);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitSupplier(e: FormEvent) {
    e.preventDefault();
    if (!supplierForm.supplierName.trim()) {
      setSupplierFieldErrors({ supplierName: "Nama supplier wajib diisi" });
      return;
    }
    if (supplierForm.paymentTermId == null) {
      setSupplierFieldErrors({ paymentTermId: "Payment term wajib dipilih" });
      return;
    }
    if (supplierForm.currency == null) {
      setSupplierFieldErrors({ currency: "Currency wajib dipilih" });
      return;
    }
    if (!auditId) return;
    setSubmitting(true);
    setSupplierFieldErrors({});
    try {
      await apiClient.post<ApiResponse<SupplierData>>("/v1/suppliers", { ...supplierForm, auditId });
      onSuccess();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const msg = ax.response?.data?.message;
      const errorMsg = msg?.toLowerCase().includes("sudah terdaftar") ? "Supplier sudah terdaftar" : (msg || "Gagal menyimpan supplier");
      setSupplierFieldErrors({ supplierName: errorMsg });
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

        {success && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
            {success}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSubmitAudit} className="space-y-4">
            <AuditFormFieldsMaster auditForm={auditForm} setAudit={setAudit} auditFieldErrors={auditFieldErrors} auditInputCls={auditInputCls} />
            {!auditFilled && (
              <p className="text-sm text-amber-600 dark:text-amber-400">Isi semua field wajib sebelum menyimpan.</p>
            )}
            <div className="flex flex-col items-end gap-2 pt-2">
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
            <Field label="Nama Supplier" required error={supplierFieldErrors.supplierName}>
              <input name="supplierName" value={supplierForm.supplierName} onChange={setSupplier} placeholder="Masukkan nama supplier" maxLength={150} className={supplierInputCls("supplierName")} />
            </Field>
            <Field label="Tipe Supplier">
              <select name="supplierType" value={supplierForm.supplierType} onChange={setSupplier} className={inputCls}>
                {SUPPLIER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Payment Term" error={supplierFieldErrors.paymentTermId}>
              <select name="paymentTermId" value={supplierForm.paymentTermId ?? ""} onChange={setSupplier} className={supplierInputCls("paymentTermId")}>
                <option value="">Pilih payment term</option>
                {paymentTerms.map((term) => (
                  <option key={term.paymentTermId} value={term.paymentTermId}>
                    {term.termCode} - {term.termName} ({term.days} hari)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Currency" error={supplierFieldErrors.currency}>
              <select name="currency" value={supplierForm.currency ?? ""} onChange={setSupplier} className={supplierInputCls("currency")}>
                <option value="">Pilih currency</option>
                {currencies.map((currency) => (
                  <option key={currency.currencyId} value={currency.currencyId}>
                    {currency.currencyCode} - {currency.currencyName}
                  </option>
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

/* ================================================================
   Edit Supplier Modal
   ================================================================ */

function EditSupplierModal({
  supplier,
  paymentTerms,
  currencies,
  getActivationBlockedReason,
  onClose,
  onSuccess,
}: {
  supplier: SupplierData;
  paymentTerms: PaymentTermOption[];
  currencies: CurrencyOption[];
  getActivationBlockedReason: (s: SupplierData) => string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    supplierName: supplier.supplierName,
    supplierType: supplier.supplierType || "Perusahaan",
    paymentTermId: supplier.paymentTermId ?? null,
    currency: supplier.currency ?? null,
    alamat: supplier.alamat || "",
    nomorKontak: supplier.nomorKontak || "",
    nomorIdentitas: supplier.nomorIdentitas || "",
  });
  const [active, setActive] = useState(supplier.active);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const inputClsBase = "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 dark:bg-dark-card dark:text-gray-100 ";
  const inputClsError = "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500";
  const inputClsNormal = "border-gray-300 focus:border-cyan focus:ring-cyan dark:border-gray-600";
  function inputCls(field: string) {
    return inputClsBase + (fieldErrors[field] ? inputClsError : inputClsNormal);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === "paymentTermId" || name === "currency") {
        return { ...prev, [name]: value === "" ? null : Number(value) };
      }
      return { ...prev, [name]: value };
    });
    setFieldErrors((prev) => { const next = { ...prev }; delete next[e.target.name]; return next; });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.supplierName.trim()) {
      setFieldErrors({ supplierName: "Nama supplier wajib diisi" });
      return;
    }
    if (form.paymentTermId == null) {
      setFieldErrors({ paymentTermId: "Payment term wajib dipilih" });
      return;
    }
    if (form.currency == null) {
      setFieldErrors({ currency: "Currency wajib dipilih" });
      return;
    }
    if (active && !supplier.active) {
      const blocked = getActivationBlockedReason(supplier);
      if (blocked) {
        setFieldErrors({ _status: blocked });
        return;
      }
    }
    setSubmitting(true);
    setFieldErrors({});
    try {
      await apiClient.put(`/v1/suppliers/${supplier.id}`, form);
      if (active !== supplier.active) {
        await apiClient.patch<ApiResponse<SupplierData>>(`/v1/suppliers/${supplier.id}`, { active });
      }
      onSuccess();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const msg = ax.response?.data?.message || "Gagal menyimpan perubahan";
      setFieldErrors({ supplierName: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Supplier</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Kode">
          <input disabled value={supplier.supplierCode} className={inputClsBase + inputClsNormal + " opacity-60 cursor-not-allowed"} />
        </Field>
        <Field label="Nama Supplier" required error={fieldErrors.supplierName}>
          <input name="supplierName" value={form.supplierName} onChange={handleChange} maxLength={150} placeholder="Masukkan nama supplier" className={inputCls("supplierName")} />
        </Field>
        <Field label="Tipe Supplier">
          <select name="supplierType" value={form.supplierType} onChange={handleChange} className={inputCls("supplierType")}>
            {SUPPLIER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Payment Term" error={fieldErrors.paymentTermId}>
          <select name="paymentTermId" value={form.paymentTermId ?? ""} onChange={handleChange} className={inputCls("paymentTermId")}>
            <option value="">Pilih payment term</option>
            {paymentTerms.map((term) => (
              <option key={term.paymentTermId} value={term.paymentTermId}>
                {term.termCode} - {term.termName} ({term.days} hari)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Currency" error={fieldErrors.currency}>
          <select name="currency" value={form.currency ?? ""} onChange={handleChange} className={inputCls("currency")}>
            <option value="">Pilih currency</option>
            {currencies.map((currency) => (
              <option key={currency.currencyId} value={currency.currencyId}>
                {currency.currencyCode} - {currency.currencyName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Alamat" error={fieldErrors.alamat}>
          <input name="alamat" value={form.alamat} onChange={handleChange} placeholder="Alamat (maks. 255)" maxLength={255} className={inputCls("alamat")} />
        </Field>
        <Field label="Nomor Kontak" error={fieldErrors.nomorKontak}>
          <input name="nomorKontak" value={form.nomorKontak} onChange={handleChange} placeholder="Maks. 50" maxLength={50} className={inputCls("nomorKontak")} />
        </Field>
        <Field label="Nomor Identitas" error={fieldErrors.nomorIdentitas}>
          <input name="nomorIdentitas" value={form.nomorIdentitas} onChange={handleChange} placeholder="Maks. 100, unik" maxLength={100} className={inputCls("nomorIdentitas")} />
        </Field>
        <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-600 dark:bg-white/5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => {
                setActive(e.target.checked);
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next._status;
                  return next;
                });
              }}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-cyan focus:ring-cyan"
            />
            <span>
              <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">Supplier aktif</span>
              <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                Nonaktifkan supplier dengan menghapus centang. Supplier tidak aktif tidak dipilih di penerimaan ikan.
              </span>
            </span>
          </label>
          {!active && (
            <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">
              Supplier akan dinonaktifkan setelah Anda menyimpan.
            </p>
          )}
          {fieldErrors._status && <p className="mt-2 text-sm text-red-500">{fieldErrors._status}</p>}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">
            Batal
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-hover disabled:opacity-50">
            {submitting ? "Menyimpan…" : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}


/* ================================================================
   Shared components
   ================================================================ */

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-2xl rounded-xl bg-white dark:bg-dark-card shadow-2xl p-6">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">
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

function AuditSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
      {children}
    </div>
  );
}

/* Audit form fields — label dan struktur sama persis dengan inbound-ikan; error ditampilkan di field. */
function AuditFormFieldsMaster({
  auditForm,
  setAudit,
  auditFieldErrors,
  auditInputCls,
}: {
  auditForm: SupplierAuditPayload;
  setAudit: <K extends keyof SupplierAuditPayload>(key: K, val: SupplierAuditPayload[K]) => void;
  auditFieldErrors: Partial<Record<AuditFieldKey, string>>;
  auditInputCls: (fieldKey: AuditFieldKey) => string;
}) {
  return (
    <>
      <Field label="Tanggal Inspeksi" required error={auditFieldErrors.tanggalInspeksi}>
        <input name="tanggalInspeksi" type="date" value={auditForm.tanggalInspeksi} onChange={(e) => setAudit("tanggalInspeksi", e.target.value)} className={auditInputCls("tanggalInspeksi")} />
      </Field>
      <AuditSection title="A: Kapal Penangkap Ikan dari Supplier">
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
          <input name="aBanyakUmpan" type="number" min={0} value={auditForm.aBanyakUmpan ?? ""} onChange={(e) => setAudit("aBanyakUmpan", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("aBanyakUmpan")} placeholder="pieces" />
        </Field>
        <Field label="Berapa jumlah orang / crew kapal?" required error={auditFieldErrors.aJumlahCrew}>
          <input name="aJumlahCrew" type="number" min={0} value={auditForm.aJumlahCrew ?? ""} onChange={(e) => setAudit("aJumlahCrew", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("aJumlahCrew")} placeholder="orang" />
        </Field>
      </AuditSection>
      <AuditSection title="B: Cara Penanganan Ikan di atas Kapal oleh Supplier">
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
      </AuditSection>
      <AuditSection title="C: Cara Penanganan Ikan di tempat pengumpul sementara oleh Supplier">
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
      </AuditSection>
      <AuditSection title="D: Media Pengangkut Ikan">
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
      </AuditSection>
    </>
  );
}
