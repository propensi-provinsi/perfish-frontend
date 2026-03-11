"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { HiOutlinePlus, HiOutlineTrash, HiOutlineArrowLeft } from "react-icons/hi2";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import apiClient from "@/lib/api";
import type { ApiResponse, CustomerData } from "@/types";
import type { CreateQuotationPayload, QuotationData, QuotationItemRequest } from "@/types/quotation";

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

function emptyItem(): QuotationItemRequest & { _key: number } {
  return { _key: Date.now() + Math.random(), batchId: 0, volumeKg: 0, pricePerKg: 0 };
}

type ItemRow = QuotationItemRequest & { _key: number };

/* ================================================================
   Form
   ================================================================ */

function NewQuotationContent() {
  const router = useRouter();

  // Customer list
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Form state
  const [customerId, setCustomerId] = useState<number | "">("");
  const [dateIssued, setDateIssued] = useState(today());
  const [dateValid, setDateValid] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /* ── Load active customers ───────────────────────── */
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

  function updateItem(key: number, field: keyof QuotationItemRequest, value: string) {
    setItems((prev) =>
      prev.map((i) =>
        i._key === key ? { ...i, [field]: field === "batchId" ? parseInt(value) || 0 : parseFloat(value) || 0 } : i
      )
    );
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
    items.forEach((item, idx) => {
      if (!item.batchId || item.batchId <= 0)
        errs[`item_${idx}_batchId`] = "Batch ID wajib diisi";
      if (!item.volumeKg || item.volumeKg <= 0)
        errs[`item_${idx}_volumeKg`] = "Volume harus > 0";
      if (!item.pricePerKg || item.pricePerKg <= 0)
        errs[`item_${idx}_pricePerKg`] = "Harga harus > 0";
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
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Buat Quotation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Isi data penawaran harga</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Section: Info Dasar ──────────────────────── */}
        <Section title="Informasi Dasar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer */}
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

            {/* Tanggal */}
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

        {/* ── Section: Pengiriman ──────────────────────── */}
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

        {/* ── Section: Items ───────────────────────────── */}
        <Section title="Item Quotation">
          {fieldErrors.items && (
            <p className="text-xs text-red mb-2">{fieldErrors.items}</p>
          )}

          <div className="space-y-3">
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto] gap-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
              <span>Batch ID <span className="text-red">*</span></span>
              <span>Volume (kg) <span className="text-red">*</span></span>
              <span>Harga/kg (Rp) <span className="text-red">*</span></span>
              <span className="w-8" />
            </div>

            {items.map((item, idx) => (
              <div key={item._key} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-start">
                {/* Batch ID */}
                <div>
                  <label className="sm:hidden block text-xs font-medium text-gray-500 mb-1">Batch ID *</label>
                  <input
                    type="number"
                    value={item.batchId || ""}
                    onChange={(e) => updateItem(item._key, "batchId", e.target.value)}
                    placeholder="ID batch"
                    min={1}
                    className={inputClass(!!fieldErrors[`item_${idx}_batchId`])}
                  />
                  {fieldErrors[`item_${idx}_batchId`] && (
                    <p className="mt-0.5 text-xs text-red">{fieldErrors[`item_${idx}_batchId`]}</p>
                  )}
                </div>

                {/* Volume */}
                <div>
                  <label className="sm:hidden block text-xs font-medium text-gray-500 mb-1">Volume (kg) *</label>
                  <input
                    type="number"
                    value={item.volumeKg || ""}
                    onChange={(e) => updateItem(item._key, "volumeKg", e.target.value)}
                    placeholder="0"
                    min={0.01}
                    step={0.01}
                    className={inputClass(!!fieldErrors[`item_${idx}_volumeKg`])}
                  />
                  {fieldErrors[`item_${idx}_volumeKg`] && (
                    <p className="mt-0.5 text-xs text-red">{fieldErrors[`item_${idx}_volumeKg`]}</p>
                  )}
                </div>

                {/* Harga */}
                <div>
                  <label className="sm:hidden block text-xs font-medium text-gray-500 mb-1">Harga/kg (Rp) *</label>
                  <input
                    type="number"
                    value={item.pricePerKg || ""}
                    onChange={(e) => updateItem(item._key, "pricePerKg", e.target.value)}
                    placeholder="0"
                    min={0.01}
                    step={0.01}
                    className={inputClass(!!fieldErrors[`item_${idx}_pricePerKg`])}
                  />
                  {fieldErrors[`item_${idx}_pricePerKg`] && (
                    <p className="mt-0.5 text-xs text-red">{fieldErrors[`item_${idx}_pricePerKg`]}</p>
                  )}
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeItem(item._key)}
                  disabled={items.length === 1}
                  className="mt-0 sm:mt-0 self-start rounded-lg p-2 text-gray-400 hover:text-red hover:bg-red-light
                    disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <HiOutlineTrash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Subtotal preview per item */}
          {items.some((i) => i.volumeKg > 0 && i.pricePerKg > 0) && (
            <div className="mt-3 space-y-1">
              {items.map((item, idx) =>
                item.volumeKg > 0 && item.pricePerKg > 0 ? (
                  <div key={item._key} className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                    <span>Item {idx + 1}</span>
                    <span className="tabular-nums">{formatRupiah(itemTotal(item))}</span>
                  </div>
                ) : null
              )}
              <div className="flex justify-between text-sm font-semibold text-gray-800 dark:text-gray-200 pt-1 border-t border-gray-200 dark:border-gray-700 px-1">
                <span>Estimasi Total</span>
                <span className="tabular-nums">{formatRupiah(grandTotal)}</span>
              </div>
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

        {/* ── Section: Catatan ─────────────────────────── */}
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

        {/* ── Submit bar ───────────────────────────────── */}
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
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
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
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-5 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold text-navy dark:text-white">{title}</h2>
      {children}
    </div>
  );
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