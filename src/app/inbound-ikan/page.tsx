"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import apiClient from "@/lib/api";
import type {
  ApiResponse,
  SupplierData,
  CreateSupplierPayload,
} from "@/types";
import { SUPPLIER_TYPES } from "@/types";

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

function InboundIkanContent() {
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [activeSuppliers, setActiveSuppliers] = useState<SupplierData[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddPenerimaan, setShowAddPenerimaan] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoadingSuppliers(true);
    try {
      const [allRes, activeRes] = await Promise.all([
        apiClient.get<ApiResponse<SupplierData[]>>("/v1/suppliers"),
        apiClient.get<ApiResponse<SupplierData[]>>("/v1/suppliers/active"),
      ]);
      setSuppliers(allRes.data.data);
      setActiveSuppliers(activeRes.data.data);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoadingSuppliers(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSupplierCreated = () => {
    setShowAddSupplier(false);
    fetchSuppliers();
  };

  return (
    <div className="space-y-8">
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
          <SummaryCard label="Total Penerimaan" value="-" />
          <SummaryCard label="Pending Approval" value="-" />
          <SummaryCard label="Approved" value="-" />
          <SummaryCard label="Rejected" value="-" />
        </div>
      </section>

      {/* ── Supplier Table (temporary for GET testing) ───── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Daftar Supplier
        </h2>
        <SupplierTable suppliers={suppliers} loading={loadingSuppliers} />
      </section>

      {/* ── Modals ────────────────────────────────────────── */}
      {showAddSupplier && (
        <AddSupplierModal
          onClose={() => setShowAddSupplier(false)}
          onSuccess={handleSupplierCreated}
        />
      )}

      {showAddPenerimaan && (
        <AddPenerimaanModal
          activeSuppliers={activeSuppliers}
          onClose={() => setShowAddPenerimaan(false)}
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
   Supplier Table (temporary — untuk testing GET)
   ================================================================ */

function SupplierTable({
  suppliers,
  loading,
}: {
  suppliers: SupplierData[];
  loading: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-gray-400">Memuat data supplier…</p>;
  }

  if (suppliers.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Belum ada supplier. Klik &quot;+ Tambah Supplier&quot; untuk menambahkan.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Kode</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Nama Supplier</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Tipe</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Alamat</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Kontak</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {suppliers.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs">{s.supplierCode}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{s.supplierName}</td>
              <td className="px-4 py-3 text-gray-600">{s.supplierType || "-"}</td>
              <td className="px-4 py-3 text-gray-600">{s.alamat || "-"}</td>
              <td className="px-4 py-3 text-gray-600">{s.nomorKontak || "-"}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {s.active ? "Aktif" : "Nonaktif"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================================================================
   Add Supplier Modal (E04-PBI-02)
   ================================================================ */

function AddSupplierModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<CreateSupplierPayload>({
    supplierName: "",
    supplierType: "Perusahaan",
    alamat: "",
    nomorKontak: "",
    nomorIdentitas: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isValid = form.supplierName.trim().length > 0;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post<ApiResponse<SupplierData>>(
        "/v1/suppliers",
        form
      );
      setSuccess("Supplier berhasil ditambahkan");
      setTimeout(onSuccess, 800);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };
      const msg = axiosErr.response?.data?.message;
      if (msg?.toLowerCase().includes("sudah terdaftar")) {
        setError("Supplier sudah terdaftar");
      } else {
        setError(msg || "Gagal menyimpan supplier");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Tambah Supplier Baru
      </h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nama Supplier" required>
          <input
            name="supplierName"
            value={form.supplierName}
            onChange={handleChange}
            placeholder="Masukkan nama supplier"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </Field>

        <Field label="Tipe Supplier">
          <select
            name="supplierType"
            value={form.supplierType}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SUPPLIER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Alamat">
          <input
            name="alamat"
            value={form.alamat}
            onChange={handleChange}
            placeholder="Masukkan alamat"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </Field>

        <Field label="Nomor Kontak">
          <input
            name="nomorKontak"
            value={form.nomorKontak}
            onChange={handleChange}
            placeholder="Masukkan nomor kontak"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </Field>

        <Field label="Nomor Identitas">
          <input
            name="nomorIdentitas"
            value={form.nomorIdentitas}
            onChange={handleChange}
            placeholder="Masukkan nomor identitas"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Menyimpan…" : "Simpan Supplier"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

/* ================================================================
   Add Penerimaan Modal (E04-PBI-01 — dropdown supplier aktif)
   ================================================================ */

function AddPenerimaanModal({
  activeSuppliers,
  onClose,
}: {
  activeSuppliers: SupplierData[];
  onClose: () => void;
}) {
  const [supplierId, setSupplierId] = useState("");

  const noActiveSuppliers = activeSuppliers.length === 0;

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Catat Penerimaan Ikan Baru
      </h2>

      {noActiveSuppliers && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          Tidak ada supplier aktif. Tambahkan supplier terlebih dahulu.
        </div>
      )}

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="Supplier (hanya aktif)" required>
          <select
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Pilih Supplier</option>
            {activeSuppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.supplierName} ({s.supplierCode})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Jenis Ikan" required>
          <select
            disabled
            className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-400"
          >
            <option>Pilih Jenis Ikan</option>
          </select>
        </Field>

        <Field label="Kuantitas (kg)" required>
          <input
            type="number"
            disabled
            placeholder="Masukkan kuantitas"
            className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-400"
          />
        </Field>

        <Field label="Lokasi Gudang" required>
          <select
            disabled
            className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-400"
          >
            <option>Pilih Gudang</option>
          </select>
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Penerimaan
          </button>
        </div>
      </form>

      <p className="mt-3 text-xs text-gray-400 text-center">
        * Jenis Ikan, Kuantitas, dan Lokasi Gudang akan diimplementasi pada PBI berikutnya.
      </p>
    </ModalOverlay>
  );
}

/* ================================================================
   Shared UI Components
   ================================================================ */

function ModalOverlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
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
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
