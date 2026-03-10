"use client";

import { useState, useEffect, useCallback, useMemo, type FormEvent } from "react";
import { HiOutlineArrowUp, HiOutlineArrowDown } from "react-icons/hi2";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import apiClient from "@/lib/api";
import type { ApiResponse, CustomerData, CreateCustomerPayload } from "@/types";

export default function MasterDataCustomersPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <CustomersContent />
      </AppShell>
    </ProtectedRoute>
  );
}

type SortOrder = "asc" | "desc";
type FilterType = "" | "Lokal" | "Ekspor";

/* ================================================================
   Main Content
   ================================================================ */

function CustomersContent() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showAddModal, setShowAddModal] = useState(false);

  /* ── Fetch ───────────────────────────────────────────── */
  const fetchCustomers = useCallback(async (keyword: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = keyword ? `?search=${encodeURIComponent(keyword)}` : "";
      const { data } = await apiClient.get<ApiResponse<CustomerData[]>>(
        `/v1/customers${query}`
      );
      setCustomers(data.data);
    } catch {
      setError("Gagal memuat data customer");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(""); }, [fetchCustomers]);

  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchCustomers]);

  /* ── Client-side: filter by type + sort by id ────────── */
  const displayed = useMemo(() => {
    let rows = filterType
      ? customers.filter((c) => c.customerType === filterType)
      : customers;

    rows = [...rows].sort((a, b) =>
      sortOrder === "asc" ? a.customerId - b.customerId : b.customerId - a.customerId
    );

    return rows;
  }, [customers, filterType, sortOrder]);

  function handleCustomerCreated() {
    setShowAddModal(false);
    setSuccessMsg("Customer berhasil ditambahkan");
    fetchCustomers(searchQuery);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Customer</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Kelola data customer dan tambah customer baru
        </p>
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

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2 max-w-2xl">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, email, kontak, alamat…"
            className="flex-1 min-w-[180px] rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section
              dark:text-gray-100 px-3 py-2 text-sm focus:border-cyan focus:outline-none
              focus:ring-2 focus:ring-cyan/20 dark:placeholder:text-gray-500 transition-colors"
          />

          {/* Filter tipe */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden text-sm">
            {(["", "Lokal", "Ekspor"] as FilterType[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-2 transition-colors
                  ${filterType === t
                    ? "bg-cyan text-white font-semibold"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                  }`}
              >
                {t === "" ? "Semua" : t}
              </button>
            ))}
          </div>

          {/* Sort by ID */}
          <button
            onClick={() => setSortOrder((prev) => prev === "asc" ? "desc" : "asc")}
            title={sortOrder === "asc" ? "Terlama → Terbaru" : "Terbaru → Terlama"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600
              px-3 py-2 text-sm text-gray-600 dark:text-gray-300
              hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            {sortOrder === "asc" ? (
              <><HiOutlineArrowUp className="h-4 w-4" /> Terlama</>
            ) : (
              <><HiOutlineArrowDown className="h-4 w-4" /> Terbaru</>
            )}
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white
            hover:bg-cyan-hover active:scale-[0.98] transition-all shrink-0"
        >
          + Tambah Customer
        </button>
      </div>

      <p className="text-xs text-gray-400">{displayed.length} customer ditemukan</p>

      {/* ── Table ───────────────────────────────────────── */}
      {loading ? (
        <p className="text-gray-400 text-sm">Memuat customer…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-dark-section">
              <tr>
                {["Kode", "Nama Customer", "Tipe", "Email", "Kontak", "Alamat", "Negara Tujuan", "Status"].map((h) => (
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
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                    {searchQuery || filterType
                      ? "Tidak ada customer yang cocok."
                      : "Belum ada data customer."}
                  </td>
                </tr>
              ) : (
                displayed.map((c) => (
                  <tr key={c.customerId} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {c.customerCode}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {c.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex rounded-full bg-cyan/10 px-2.5 py-0.5 text-xs font-medium text-cyan">
                        {c.customerType || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {c.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {c.contactNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[180px] truncate">
                      {c.address || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {c.customerType === "Ekspor" ? (c.destinationCountry || "—") : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${c.isActive ? "bg-green-light text-green" : "bg-red-light text-red"}`}>
                        {c.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleCustomerCreated}
        />
      )}
    </div>
  );
}

/* ================================================================
   Add Customer Modal
   ================================================================ */

function AddCustomerModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<CreateCustomerPayload>({
    customerName: "",
    customerType: "Lokal",
    address: "",
    contactNumber: "",
    email: "",
    destinationCountry: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setError(null);
  }

  function handleTipeChange(tipe: "Lokal" | "Ekspor") {
    setForm((prev) => ({ ...prev, customerType: tipe, destinationCountry: "" }));
    setFieldErrors((prev) => ({ ...prev, destinationCountry: "" }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.customerName?.trim()) errs.customerName = "Nama customer wajib diisi";
    if (form.contactNumber && !/^[0-9+\-\s()]{7,20}$/.test(form.contactNumber))
      errs.contactNumber = "Format nomor kontak tidak valid";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Format email tidak valid";
    if (form.customerType === "Ekspor" && !form.destinationCountry?.trim())
      errs.destinationCountry = "Negara tujuan wajib diisi untuk customer Ekspor";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: CreateCustomerPayload = {
        customerName: form.customerName!.trim(),
        customerType: form.customerType,
        address: form.address?.trim() || undefined,
        contactNumber: form.contactNumber?.trim() || undefined,
        email: form.email?.trim() || undefined,
        destinationCountry:
          form.customerType === "Ekspor" ? form.destinationCountry?.trim() : undefined,
      };
      await apiClient.post<ApiResponse<CustomerData>>("/v1/customers", payload);
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: { message?: string; fieldErrors?: Record<string, string> };
        };
      };
      if (axiosErr.response?.status === 409) {
        setFieldErrors((prev) => ({ ...prev, customerName: "Customer dengan nama ini sudah terdaftar" }));
      } else if (axiosErr.response?.status === 400) {
        const fe = axiosErr.response.data?.fieldErrors;
        if (fe) setFieldErrors(fe);
        else setError(axiosErr.response.data?.message || "Validasi gagal.");
      } else {
        setError(axiosErr.response?.data?.message || "Gagal menyimpan customer.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-dark-card shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
          <h2 className="text-base font-semibold text-navy dark:text-white">Tambah Customer Baru</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">{error}</div>
          )}

          <form id="add-customer-form" onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nama Customer" required error={fieldErrors.customerName}>
              <input name="customerName" value={form.customerName} onChange={handleChange}
                placeholder="Masukkan nama customer" className={inputClass(!!fieldErrors.customerName)} />
            </Field>

            <Field label="Tipe Customer" required>
              <div className="flex gap-4">
                {(["Lokal", "Ekspor"] as const).map((tipe) => (
                  <label key={tipe} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                    <input type="radio" name="customerType" value={tipe}
                      checked={form.customerType === tipe} onChange={() => handleTipeChange(tipe)}
                      className="accent-cyan-500" />
                    {tipe}
                  </label>
                ))}
              </div>
            </Field>

            {form.customerType === "Ekspor" && (
              <Field label="Negara Tujuan" required error={fieldErrors.destinationCountry}>
                <input name="destinationCountry" value={form.destinationCountry} onChange={handleChange}
                  placeholder="Masukkan negara tujuan ekspor" className={inputClass(!!fieldErrors.destinationCountry)} />
              </Field>
            )}

            <Field label="Alamat">
              <input name="address" value={form.address} onChange={handleChange}
                placeholder="Masukkan alamat customer" className={inputClass(false)} />
            </Field>

            <Field label="Nomor Kontak" error={fieldErrors.contactNumber}>
              <input name="contactNumber" value={form.contactNumber} onChange={handleChange}
                placeholder="Contoh: 08123456789" className={inputClass(!!fieldErrors.contactNumber)} />
            </Field>

            <Field label="Email" error={fieldErrors.email}>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="Contoh: customer@email.com" className={inputClass(!!fieldErrors.email)} />
            </Field>
          </form>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium
              text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Batal
          </button>
          <button type="submit" form="add-customer-form" disabled={submitting}
            className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white
              hover:bg-cyan-hover active:scale-[0.98] disabled:opacity-50 transition-all">
            {submitting ? "Menyimpan…" : "Simpan Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Helpers
   ================================================================ */

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm
    dark:bg-dark-section dark:text-gray-100 dark:placeholder:text-gray-500
    focus:outline-none focus:ring-2 transition-colors
    ${hasError
      ? "border-red bg-red-light/30 focus:border-red focus:ring-red/20"
      : "border-gray-300 dark:border-gray-600 focus:border-cyan focus:ring-cyan/20"
    }`;
}

function Field({ label, required, error, children }: {
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