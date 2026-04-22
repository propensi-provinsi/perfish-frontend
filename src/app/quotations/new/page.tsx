"use client";

import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { HiOutlinePlus, HiOutlineTrash, HiOutlineArrowLeft, HiOutlineChevronDown, HiOutlineMagnifyingGlass, HiOutlineExclamationTriangle } from "react-icons/hi2";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import apiClient from "@/lib/api";
import type { ApiResponse, CustomerData } from "@/types";
import type { CreateQuotationPayload, QuotationData, QuotationItemRequest } from "@/types/quotation";

// ── Batch type (dari MasterBatchResponse) ────────────────────────
interface BatchOption {
  batchId: number;
  batchNumber: string;
  fishSpeciesId: number;
  fishSpeciesName: string;
  currentQuantity: number;
  unit: string;
  expirationDate?: string;
  qualityGrade?: string;
  supplierName?: string;
}

export default function NewQuotationPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <NewQuotationContent />
      </AppShell>
    </ProtectedRoute>
  );
}

/* ================================================================
   Empty item factory
   ================================================================ */

function emptyItem(): ItemRow {
  return {
    _key: Date.now() + Math.random(),
    batchId: 0,
    volumeKg: 0,
    pricePerKg: 0,
    selectedBatch: null,
  };
}

type ItemRow = QuotationItemRequest & {
  _key: number;
  selectedBatch: BatchOption | null;
};

/* ================================================================
   BatchDropdown — searchable picker per item
   ================================================================ */

function BatchDropdown({
  value,
  onChange,
  error,
}: {
  value: BatchOption | null;
  onChange: (batch: BatchOption) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchBatches = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<ApiResponse<BatchOption[]>>(
        "/v1/batch/master-batches/available",
        { params: { search: q } }
      );
      setOptions(data.data);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch awal saat dropdown dibuka
  useEffect(() => {
    if (open) fetchBatches(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchBatches(val), 350);
  }

  function handleSelect(batch: BatchOption) {
    onChange(batch);
    setOpen(false);
    setSearch("");
  }

  function daysUntilExpiry(dateStr?: string): number | null {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  }

  const expiryColor = (days: number | null) => {
    if (days === null) return "";
    if (days <= 7) return "text-red";
    if (days <= 30) return "text-yellow";
    return "text-green";
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm
          text-left bg-white dark:bg-dark-section transition-colors focus:outline-none focus:ring-2
          ${error
            ? "border-red focus:ring-red/20"
            : "border-gray-300 dark:border-gray-600 focus:border-cyan focus:ring-cyan/20"
          }`}
      >
        {value ? (
          <div className="min-w-0">
            <span className="font-medium text-gray-800 dark:text-gray-200 font-mono text-xs">
              {value.batchNumber}
            </span>
            <span className="ml-2 text-gray-500 dark:text-gray-400 text-xs">
              {value.fishSpeciesName}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">Pilih batch…</span>
        )}
        <HiOutlineChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[320px] rounded-xl border border-gray-200
          dark:border-gray-700 bg-white dark:bg-dark-card shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600
              bg-white dark:bg-dark-section px-3 py-2">
              <HiOutlineMagnifyingGlass className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Cari batch atau jenis ikan…"
                className="flex-1 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-200
                  placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-gray-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-cyan" />
                Memuat batch…
              </div>
            ) : options.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">
                {search ? "Tidak ada batch yang cocok." : "Tidak ada batch tersedia."}
              </p>
            ) : (
              options.map((batch) => {
                const days = daysUntilExpiry(batch.expirationDate);
                const isSelected = value?.batchId === batch.batchId;
                return (
                  <button
                    key={batch.batchId}
                    type="button"
                    onClick={() => handleSelect(batch)}
                    className={`w-full text-left px-4 py-3 flex items-start justify-between gap-3
                      hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b
                      border-gray-50 dark:border-gray-800 last:border-0
                      ${isSelected ? "bg-cyan/5 dark:bg-cyan/10" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {batch.batchNumber}
                        </span>
                        {batch.qualityGrade && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100
                            dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                            {batch.qualityGrade}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {batch.fishSpeciesName}
                        {batch.supplierName && (
                          <span className="text-gray-400"> · {batch.supplierName}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                        {Number(batch.currentQuantity).toLocaleString("id-ID")} {batch.unit}
                      </p>
                      {days !== null ? (
                        <p className={`text-xs tabular-nums ${expiryColor(days)}`}>
                          {days > 0 ? `Exp ${days} hari` : "Exp hari ini"}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">Tanpa exp</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red">{error}</p>}
    </div>
  );
}

/* ================================================================
   Form
   ================================================================ */

function NewQuotationContent() {
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [customerId, setCustomerId] = useState<number | "">("");
  const [dateIssued, setDateIssued] = useState(today());
  const [dateValid, setDateValid] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    apiClient
      .get<ApiResponse<CustomerData[]>>("/v1/customers/active")
      .then(({ data }) => setCustomers(data.data))
      .catch(() => {})
      .finally(() => setLoadingCustomers(false));
  }, []);

  /* ── Item helpers ────────────────────────────────── */
  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(key: number) {
    setItems((prev) => prev.filter((i) => i._key !== key));
  }

  function updateItemBatch(key: number, batch: BatchOption) {
    setItems((prev) =>
      prev.map((i) =>
        i._key === key
          ? { ...i, batchId: batch.batchId, selectedBatch: batch }
          : i
      )
    );
    // Clear error for this item
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`item_${key}_batchId`];
      return next;
    });
  }

  function updateItemNum(key: number, field: "volumeKg" | "pricePerKg", value: string) {
    setItems((prev) =>
      prev.map((i) =>
        i._key === key
          ? { ...i, [field]: parseFloat(value) || 0 }
          : i
      )
    );
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`item_${key}_${field}`];
      return next;
    });
  }

  function itemTotal(item: ItemRow) {
    return item.volumeKg * item.pricePerKg;
  }

  const grandTotal = items.reduce((sum, i) => sum + itemTotal(i), 0);

  /* ── Validation ──────────────────────────────────── */
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customerId = "Customer wajib dipilih";
    if (!dateIssued) errs.dateIssued = "Tanggal terbit wajib diisi";
    if (!dateValid) errs.dateValid = "Tanggal berlaku wajib diisi";
    if (dateValid && dateIssued && dateValid < dateIssued)
      errs.dateValid = "Tanggal berlaku harus >= tanggal terbit";
    if (items.length === 0) errs.items = "Minimal 1 item";

    items.forEach((item) => {
      if (!item.batchId || item.batchId <= 0)
        errs[`item_${item._key}_batchId`] = "Pilih batch";
      if (!item.volumeKg || item.volumeKg <= 0)
        errs[`item_${item._key}_volumeKg`] = "Volume harus > 0";
      if (item.selectedBatch && item.volumeKg > Number(item.selectedBatch.currentQuantity))
        errs[`item_${item._key}_volumeKg`] =
          `Melebihi stok tersedia (${Number(item.selectedBatch.currentQuantity).toLocaleString("id-ID")} ${item.selectedBatch.unit})`;
      if (!item.pricePerKg || item.pricePerKg <= 0)
        errs[`item_${item._key}_pricePerKg`] = "Harga harus > 0";
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ── Submit ──────────────────────────────────────── */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    const payload: CreateQuotationPayload = {
      customerId: customerId as number,
      dateIssued,
      dateValid,
      deliveryMethod: deliveryMethod.trim() || undefined,
      deliveryLocation: deliveryLocation.trim() || undefined,
      notes: notes.trim() || undefined,
      items: items.map(({ batchId, volumeKg, pricePerKg }) => ({ batchId, volumeKg, pricePerKg })),
    };

    setSubmitting(true);
    try {
      await apiClient.post<ApiResponse<QuotationData>>("/v1/quotations", payload);
      router.push("/quotations");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; fieldErrors?: Record<string, string> } } };
      if (e.response?.data?.fieldErrors) setFieldErrors(e.response.data.fieldErrors);
      else setError(e.response?.data?.message || "Gagal membuat quotation");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Render ──────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100
            dark:hover:bg-white/10 transition-colors"
        >
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Buat Quotation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Isi data penawaran harga</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">
          <HiOutlineExclamationTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Info Dasar ──────────────────────────────── */}
        <Section title="Informasi Dasar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Customer" required error={fieldErrors.customerId}>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(parseInt(e.target.value) || "")}
                  disabled={loadingCustomers}
                  className={selectClass(!!fieldErrors.customerId)}
                >
                  <option value="">{loadingCustomers ? "Memuat…" : "Pilih customer"}</option>
                  {customers.map((c) => (
                    <option key={c.customerId} value={c.customerId}>
                      {c.customerName} {c.customerType ? `(${c.customerType})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Tanggal Terbit" required error={fieldErrors.dateIssued}>
              <input
                type="date"
                value={dateIssued}
                onChange={(e) => setDateIssued(e.target.value)}
                className={inputClass(!!fieldErrors.dateIssued)}
              />
            </Field>

            <Field label="Berlaku Hingga" required error={fieldErrors.dateValid}>
              <input
                type="date"
                value={dateValid}
                min={dateIssued}
                onChange={(e) => setDateValid(e.target.value)}
                className={inputClass(!!fieldErrors.dateValid)}
              />
            </Field>
          </div>
        </Section>

        {/* ── Pengiriman ──────────────────────────────── */}
        <Section title="Pengiriman (Opsional)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Metode Pengiriman">
              <input
                type="text"
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                placeholder="Contoh: Ekspedisi, FOB, CIF"
                className={inputClass(false)}
              />
            </Field>
            <Field label="Lokasi Tujuan">
              <input
                type="text"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                placeholder="Contoh: Jakarta, Surabaya"
                className={inputClass(false)}
              />
            </Field>
          </div>
        </Section>

        {/* ── Items ───────────────────────────────────── */}
        <Section title="Item Quotation">
          {fieldErrors.items && (
            <p className="text-xs text-red mb-2">{fieldErrors.items}</p>
          )}

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item._key} className="rounded-lg border border-gray-200 dark:border-gray-700
                bg-gray-50 dark:bg-dark-section p-4 space-y-3">

                {/* Item header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Item {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item._key)}
                    disabled={items.length === 1}
                    className="rounded-lg p-1.5 text-gray-400 hover:text-red hover:bg-red-light
                      disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                </div>

                {/* Batch selector */}
                <Field label="Batch" required error={fieldErrors[`item_${item._key}_batchId`]}>
                  <BatchDropdown
                    value={item.selectedBatch}
                    onChange={(batch) => updateItemBatch(item._key, batch)}
                    error={fieldErrors[`item_${item._key}_batchId`]}
                  />
                </Field>

                {/* Stok info jika batch sudah dipilih */}
                {item.selectedBatch && (
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400
                    bg-white dark:bg-dark-card rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                    <span>
                      <span className="font-medium">Stok:</span>{" "}
                      {Number(item.selectedBatch.currentQuantity).toLocaleString("id-ID")}{" "}
                      {item.selectedBatch.unit}
                    </span>
                    {item.selectedBatch.expirationDate && (
                      <span>
                        <span className="font-medium">Exp:</span>{" "}
                        {new Date(item.selectedBatch.expirationDate).toLocaleDateString("id-ID", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </span>
                    )}
                    {item.selectedBatch.qualityGrade && (
                      <span>
                        <span className="font-medium">Grade:</span> {item.selectedBatch.qualityGrade}
                      </span>
                    )}
                  </div>
                )}

                {/* Volume & Harga */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Volume (kg)" required error={fieldErrors[`item_${item._key}_volumeKg`]}>
                    <input
                      type="number"
                      value={item.volumeKg || ""}
                      onChange={(e) => updateItemNum(item._key, "volumeKg", e.target.value)}
                      placeholder="0"
                      min={0.01}
                      step={0.01}
                      className={inputClass(!!fieldErrors[`item_${item._key}_volumeKg`])}
                    />
                  </Field>
                  <Field label="Harga/kg (Rp)" required error={fieldErrors[`item_${item._key}_pricePerKg`]}>
                    <input
                      type="number"
                      value={item.pricePerKg || ""}
                      onChange={(e) => updateItemNum(item._key, "pricePerKg", e.target.value)}
                      placeholder="0"
                      min={0.01}
                      step={0.01}
                      className={inputClass(!!fieldErrors[`item_${item._key}_pricePerKg`])}
                    />
                  </Field>
                </div>

                {/* Subtotal preview */}
                {item.volumeKg > 0 && item.pricePerKg > 0 && (
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-1
                    border-t border-gray-200 dark:border-gray-700">
                    <span>Subtotal item {idx + 1}</span>
                    <span className="tabular-nums font-semibold text-gray-700 dark:text-gray-300">
                      {formatRupiah(itemTotal(item))}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Grand total */}
          {grandTotal > 0 && (
            <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-gray-100
              pt-3 border-t border-gray-200 dark:border-gray-700 mt-2 px-1">
              <span>Estimasi Total</span>
              <span className="tabular-nums">{formatRupiah(grandTotal)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={addItem}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300
              dark:border-gray-600 px-4 py-2 text-sm text-gray-500 dark:text-gray-400
              hover:border-cyan hover:text-cyan transition-colors"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Tambah Item
          </button>
        </Section>

        {/* ── Catatan ─────────────────────────────────── */}
        <Section title="Catatan (Opsional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tambahkan catatan untuk quotation ini…"
            rows={3}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section
              dark:text-gray-100 px-3.5 py-2.5 text-sm resize-none
              focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20
              dark:placeholder:text-gray-500 transition-colors"
          />
        </Section>

        {/* ── Submit ───────────────────────────────────── */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium
              text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-cyan px-6 py-2.5 text-sm font-semibold text-white
              hover:bg-cyan-hover active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            {submitting ? "Menyimpan…" : "Simpan Quotation"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ================================================================
   Helpers
   ================================================================ */

function today() {
  return new Date().toISOString().split("T")[0];
}

function formatRupiah(val: number) {
  if (!val) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm
    dark:bg-dark-section dark:text-gray-100 dark:placeholder:text-gray-500
    focus:outline-none focus:ring-2 transition-colors
    ${hasError
      ? "border-red bg-red-light/30 focus:border-red focus:ring-red/20"
      : "border-gray-300 dark:border-gray-600 focus:border-cyan focus:ring-cyan/20"
    }`;
}

function selectClass(hasError: boolean) {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm
    dark:bg-dark-section dark:text-gray-100
    focus:outline-none focus:ring-2 transition-colors cursor-pointer
    ${hasError
      ? "border-red focus:border-red focus:ring-red/20"
      : "border-gray-300 dark:border-gray-600 focus:border-cyan focus:ring-cyan/20"
    }`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card
      p-5 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold text-navy dark:text-white">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label, required, error, children,
}: {
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