"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { HiOutlinePlus, HiOutlineTrash, HiOutlineArrowLeft, HiOutlineExclamationTriangle } from "react-icons/hi2";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import apiClient from "@/lib/api";
import type { ApiResponse, CustomerData } from "@/types";
import type { CreateQuotationPayload, QuotationData, QuotationItemRequest } from "@/types/quotation";

interface MasterSpecies { speciesId: number; speciesName: string; isActive: boolean; }
interface MasterForm { formId: number; formName: string; isActive: boolean; }
interface MasterGrade { gradeId: number; gradeName: string; isActive: boolean; }
interface MasterPackaging { packagingId: number; packagingName: string; isActive: boolean; }

export default function NewQuotationPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <NewQuotationContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function emptyItem(): ItemRow {
  return {
    _key: Date.now() + Math.random(),
    productName: "",
    fishSpeciesName: "",
    fishForm: "",
    fishGrade: "",
    skuCode: "",
    sizeSpec: "",
    packaging: "",
    volumeKg: 0,
    pricePerKg: 0,
  };
}

type ItemRow = QuotationItemRequest & {
  _key: number;
};

function NewQuotationContent() {
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [customerId, setCustomerId] = useState<number | "">("");
  const [dateIssued, setDateIssued] = useState(today());
  const [dateValid, setDateValid] = useState("");
  const [salesType, setSalesType] = useState("DOMESTIC");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

  // Master Data
  const [speciesList, setSpeciesList] = useState<MasterSpecies[]>([]);
  const [formList, setFormList] = useState<MasterForm[]>([]);
  const [gradeList, setGradeList] = useState<MasterGrade[]>([]);
  const [packagingList, setPackagingList] = useState<MasterPackaging[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    apiClient
      .get<ApiResponse<CustomerData[]>>("/v1/customers/active")
      .then(({ data }) => setCustomers(data.data))
      .catch(() => {})
      .finally(() => setLoadingCustomers(false));

    apiClient.get<ApiResponse<MasterSpecies[]>>("/v1/master/fish/species")
      .then(r => setSpeciesList(r.data.data.filter(s => s.isActive !== false))).catch(()=>{});
    apiClient.get<ApiResponse<MasterForm[]>>("/v1/master/fish/forms")
      .then(r => setFormList(r.data.data.filter(s => s.isActive !== false))).catch(()=>{});
    apiClient.get<ApiResponse<MasterGrade[]>>("/v1/master/fish/grades")
      .then(r => setGradeList(r.data.data.filter(s => s.isActive !== false))).catch(()=>{});
    apiClient.get<ApiResponse<MasterPackaging[]>>("/v1/master/fish/packaging-types")
      .then(r => setPackagingList(r.data.data.filter(s => s.isActive !== false))).catch(()=>{});
  }, []);

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(key: number) {
    setItems((prev) => prev.filter((i) => i._key !== key));
  }

  function updateItemText(key: number, field: keyof ItemRow, value: string) {
    setItems((prev) =>
      prev.map((i) => (i._key === key ? { ...i, [field]: value } : i))
    );
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`item_${key}_${field}`];
      return next;
    });
  }

  function updateItemNum(key: number, field: "volumeKg" | "pricePerKg", value: string) {
    setItems((prev) =>
      prev.map((i) =>
        i._key === key ? { ...i, [field]: parseFloat(value) || 0 } : i
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

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customerId = "Customer wajib dipilih";
    if (!dateIssued) errs.dateIssued = "Tanggal terbit wajib diisi";
    if (!dateValid) errs.dateValid = "Tanggal berlaku wajib diisi";
    if (dateValid && dateIssued && dateValid < dateIssued)
      errs.dateValid = "Tanggal berlaku harus >= tanggal terbit";
    if (!salesType) errs.salesType = "Tipe Penjualan wajib diisi";
    if (items.length === 0) errs.items = "Minimal 1 item";

    items.forEach((item) => {
      if (!item.fishSpeciesName || item.fishSpeciesName.trim() === "")
        errs[`item_${item._key}_fishSpeciesName`] = "Spesies wajib dipilih";
      if (!item.volumeKg || item.volumeKg <= 0)
        errs[`item_${item._key}_volumeKg`] = "Volume harus > 0";
      if (!item.pricePerKg || item.pricePerKg <= 0)
        errs[`item_${item._key}_pricePerKg`] = "Harga harus > 0";
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    const payload: CreateQuotationPayload = {
      customerId: customerId as number,
      dateIssued,
      dateValid,
      salesType,
      paymentMethod: paymentMethod.trim() || undefined,
      deliveryMethod: deliveryMethod.trim() || undefined,
      deliveryLocation: deliveryLocation.trim() || undefined,
      notes: notes.trim() || undefined,
      items: items.map(({ fishSpeciesName, fishForm, fishGrade, skuCode, sizeSpec, packaging, volumeKg, pricePerKg }) => ({ 
        productName: fishSpeciesName?.trim() || "Produk", // Use species name as product name
        fishSpeciesName: fishSpeciesName?.trim() || undefined,
        fishForm: fishForm?.trim() || undefined,
        fishGrade: fishGrade?.trim() || undefined,
        skuCode: skuCode?.trim() || undefined,
        sizeSpec: sizeSpec?.trim() || undefined,
        packaging: packaging?.trim() || undefined,
        volumeKg, 
        pricePerKg 
      })),
    };

    setSubmitting(true);
    try {
      await apiClient.post<ApiResponse<QuotationData>>("/v1/quotations", payload);
      router.push("/quotations");
    } catch (err: any) {
      if (err.response?.data?.fieldErrors) setFieldErrors(err.response.data.fieldErrors);
      else setError(err.response?.data?.message || "Gagal membuat quotation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Isi data penawaran harga tanpa batch (pre-order/pesanan)</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-light border border-red/20 p-3 text-sm text-red">
          <HiOutlineExclamationTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Informasi Dasar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
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
            
            <Field label="Tipe Penjualan" required error={fieldErrors.salesType}>
              <select
                value={salesType}
                onChange={(e) => setSalesType(e.target.value)}
                className={selectClass(!!fieldErrors.salesType)}
              >
                <option value="DOMESTIC">Lokal (Domestic)</option>
                <option value="EXPORT">Ekspor (Export)</option>
              </select>
            </Field>

            <Field label="Metode Pembayaran (Opsional)">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={selectClass(false)}
              >
                <option value="">-- Pilih --</option>
                <option value="TRANSFER">Transfer</option>
                <option value="SKBDN">SKBDN</option>
                <option value="TT">Telegraphic Transfer (TT)</option>
                <option value="LC">Letter of Credit (LC)</option>
              </select>
            </Field>

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

        <Section title="Item Quotation">
          {fieldErrors.items && (
            <p className="text-xs text-red mb-2">{fieldErrors.items}</p>
          )}

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item._key} className="rounded-lg border border-gray-200 dark:border-gray-700
                bg-gray-50 dark:bg-dark-section p-4 space-y-3">
                
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <Field label="Spesies Ikan" required error={fieldErrors[`item_${item._key}_fishSpeciesName`]}>
                    <select
                      value={item.fishSpeciesName || ""}
                      onChange={(e) => updateItemText(item._key, "fishSpeciesName", e.target.value)}
                      className={selectClass(!!fieldErrors[`item_${item._key}_fishSpeciesName`])}
                    >
                      <option value="">-- Pilih Spesies --</option>
                      {speciesList.map((s) => (
                        <option key={s.speciesId} value={s.speciesName}>{s.speciesName}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Bentuk (Form)">
                    <select
                      value={item.fishForm || ""}
                      onChange={(e) => updateItemText(item._key, "fishForm", e.target.value)}
                      className={selectClass(false)}
                    >
                      <option value="">-- Pilih Bentuk --</option>
                      {formList.map((f) => (
                        <option key={f.formId} value={f.formName}>{f.formName}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Grade">
                    <select
                      value={item.fishGrade || ""}
                      onChange={(e) => updateItemText(item._key, "fishGrade", e.target.value)}
                      className={selectClass(false)}
                    >
                      <option value="">-- Pilih Grade --</option>
                      {gradeList.map((g) => (
                        <option key={g.gradeId} value={g.gradeName}>{g.gradeName}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Packaging">
                    <select
                      value={item.packaging || ""}
                      onChange={(e) => updateItemText(item._key, "packaging", e.target.value)}
                      className={selectClass(false)}
                    >
                      <option value="">-- Pilih Kemasan --</option>
                      {packagingList.map((p) => (
                        <option key={p.packagingId} value={p.packagingName}>{p.packagingName}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Spesifikasi Ukuran">
                    <input
                      type="text"
                      value={item.sizeSpec || ""}
                      onChange={(e) => updateItemText(item._key, "sizeSpec", e.target.value)}
                      placeholder="Contoh: 2-3 kg"
                      className={inputClass(false)}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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

                {item.volumeKg > 0 && item.pricePerKg > 0 && (
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-3">
                    <span>Subtotal item {idx + 1}</span>
                    <span className="tabular-nums font-semibold text-gray-700 dark:text-gray-300 text-sm">
                      {formatRupiah(itemTotal(item))}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

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
