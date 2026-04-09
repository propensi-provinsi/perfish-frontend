"use client";

import { useState, useEffect, useCallback, useMemo, useRef, type FormEvent } from "react";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlinePlus,
  HiOutlineXMark,
} from "react-icons/hi2";
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

type Notification = { type: "success" | "error"; message: string };

/* ================================================================
   Main Content
   ================================================================ */

function CustomersContent() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFilter, setShowFilter] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);

  const [notification, setNotification] = useState<Notification | null>(null);
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Notification ────────────────────────────────────── */
  useEffect(() => {
    if (!notification) return;
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(null), 3500);
    return () => { if (notifTimer.current) clearTimeout(notifTimer.current); };
  }, [notification]);

  /* ── Fetch ───────────────────────────────────────────── */
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<ApiResponse<CustomerData[]>>("/v1/customers");
      setCustomers(data.data);
    } catch {
      setNotification({ type: "error", message: "Gagal memuat data customer" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  /* ── Client-side filter ──────────────────────────────── */
  const displayed = useMemo(() => {
    let rows = [...customers];

    const q = (filterValues.search ?? "").toLowerCase().trim();
    if (q) {
      rows = rows.filter((c) =>
        [c.customerName, c.email, c.contactNumber, c.address, c.destinationCountry]
          .some((v) => v?.toLowerCase().includes(q))
      );
    }

    if (filterValues.customerType)
      rows = rows.filter((c) => c.customerType === filterValues.customerType);

    if (filterValues.isActive === "true")
      rows = rows.filter((c) => c.isActive);
    else if (filterValues.isActive === "false")
      rows = rows.filter((c) => !c.isActive);

    return rows;
  }, [customers, filterValues]);

  const activeFilterCount = ["customerType", "isActive"]
    .filter((k) => !!filterValues[k]).length;

  function setFilter(key: string, val: string) {
    setFilterValues((prev) => ({ ...prev, [key]: val }));
  }

  function handleCustomerCreated() {
    setShowAddModal(false);
    setNotification({ type: "success", message: "Customer berhasil ditambahkan" });
    fetchCustomers();
  }

  function handleCustomerUpdated() {
    setEditingCustomer(null);
    setNotification({ type: "success", message: "Customer berhasil diperbarui" });
    fetchCustomers();
  }

  return (
    <div className="space-y-4">
      {/* ── Header ────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Customer</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Kelola data customer dan tambah customer baru
        </p>
      </div>

      {/* ── Toast ─────────────────────────────────────────── */}
      {notification && (
        <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm
          ${notification.type === "success"
            ? "border-green/30 bg-green/10 text-green"
            : "border-red/30 bg-red/10 text-red"
          }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-auto">
            <HiOutlineXMark className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-md">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filterValues.search ?? ""}
              onChange={(e) => setFilter("search", e.target.value)}
              placeholder="Cari nama, email, kontak, alamat…"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-card
                dark:text-gray-100 py-2 pl-9 pr-3 text-sm focus:border-cyan focus:outline-none
                focus:ring-2 focus:ring-cyan/20 dark:placeholder:text-gray-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`relative inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors
              ${showFilter || activeFilterCount > 0
                ? "border-cyan bg-cyan/5 text-cyan"
                : "border-cyan bg-cyan/5 text-cyan hover:bg-cyan/15"
              }`}
          >
            <HiOutlineFunnel className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white
              hover:bg-cyan-hover active:scale-[0.98] transition-all"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Tambah Customer
          </button>
        </div>
      </div>

      {/* ── Filter Panel ──────────────────────────────────── */}
      {showFilter && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-navy dark:text-white">Filter Lanjutan</p>
            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilterValues((prev) => ({ search: prev.search ?? "" }))}
                className="inline-flex items-center gap-1 text-xs text-red hover:underline"
              >
                <HiOutlineXMark className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Tipe Customer */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Tipe Customer
              </label>
              <select
                value={filterValues.customerType ?? ""}
                onChange={(e) => setFilter("customerType", e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section
                  dark:text-gray-100 px-3 py-1.5 text-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
              >
                <option value="">Semua</option>
                <option value="Lokal">Lokal</option>
                <option value="Ekspor">Ekspor</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Status
              </label>
              <select
                value={filterValues.isActive ?? ""}
                onChange={(e) => setFilter("isActive", e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section
                  dark:text-gray-100 px-3 py-1.5 text-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
              >
                <option value="">Semua</option>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Count ─────────────────────────────────────────── */}
      <span className="text-xs text-gray-400">
        {loading ? "Memuat…" : `${displayed.length} customer ditemukan`}
      </span>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-dark-section">
            <tr>
              {["Kode", "Nama Customer", "Tipe", "Email", "Kontak", "Alamat", "Negara Tujuan", "Status", "Aksi"].map((h) => (
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
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">
                  Tidak ada customer yang cocok.
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
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${c.customerType === "Ekspor"
                        ? "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
                        : c.customerType === "Lokal"
                        ? "bg-cyan/10 text-cyan"
                        : "bg-gray-100 text-gray-400"
                      }`}>
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
                      ${c.isActive ? "bg-green/10 text-green" : "bg-red/10 text-red"}`}>
                      {c.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => setEditingCustomer(c)}
                      className="text-cyan hover:text-cyan-hover text-xs font-medium transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleCustomerCreated}
        />
      )}

      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSuccess={handleCustomerUpdated}
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
        response?: { status?: number; data?: { message?: string; fieldErrors?: Record<string, string> } };
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
            <div className="mb-4 rounded-lg bg-red/10 border border-red/20 p-3 text-sm text-red">{error}</div>
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
   Edit Customer Modal
   ================================================================ */

function EditCustomerModal({
  customer,
  onClose,
  onSuccess,
}: {
  customer: CustomerData;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    customerName: customer.customerName,
    address: customer.address ?? "",
    contactNumber: customer.contactNumber ?? "",
    email: customer.email ?? "",
    isActive: customer.isActive,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setError(null);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.customerName.trim()) errs.customerName = "Nama customer wajib diisi";
    if (form.contactNumber && !/^[0-9+\-\s()]{7,20}$/.test(form.contactNumber))
      errs.contactNumber = "Format nomor kontak tidak valid";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Format email tidak valid";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await apiClient.put<ApiResponse<CustomerData>>(
        `/v1/customers/${customer.customerId}`,
        {
          customerName: form.customerName.trim(),
          customerType: customer.customerType,
          destinationCountry: customer.destinationCountry,
          address: form.address.trim() || undefined,
          contactNumber: form.contactNumber.trim() || undefined,
          email: form.email.trim() || undefined,
          isActive: form.isActive,
        }
      );
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string; fieldErrors?: Record<string, string> } };
      };
      if (axiosErr.response?.status === 409) {
        setFieldErrors((prev) => ({ ...prev, customerName: "Customer dengan nama ini sudah terdaftar" }));
      } else if (axiosErr.response?.status === 400) {
        const fe = axiosErr.response.data?.fieldErrors;
        if (fe) setFieldErrors(fe);
        else setError(axiosErr.response.data?.message || "Validasi gagal.");
      } else {
        setError(axiosErr.response?.data?.message || "Gagal menyimpan perubahan.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-dark-card shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-navy dark:text-white">Edit Customer</h2>
            <p className="text-xs text-gray-400 mt-0.5">{customer.customerCode} · {customer.customerType}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg bg-red/10 border border-red/20 p-3 text-sm text-red">{error}</div>
          )}
          <form id="edit-customer-form" onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nama Customer" required error={fieldErrors.customerName}>
              <input name="customerName" value={form.customerName} onChange={handleChange}
                placeholder="Masukkan nama customer" className={inputClass(!!fieldErrors.customerName)} />
            </Field>
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
            <Field label="Status">
              <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange}
                  className="h-4 w-4 accent-cyan-500 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {form.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </label>
            </Field>
          </form>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium
              text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Batal
          </button>
          <button type="submit" form="edit-customer-form" disabled={submitting}
            className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white
              hover:bg-cyan-hover active:scale-[0.98] disabled:opacity-50 transition-all">
            {submitting ? "Menyimpan…" : "Simpan Perubahan"}
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
      ? "border-red bg-red/10 focus:border-red focus:ring-red/20"
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