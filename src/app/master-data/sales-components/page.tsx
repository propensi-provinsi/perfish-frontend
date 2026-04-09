"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import MasterDataShell, {
  type EntityConfig,
} from "@/components/master-data/MasterDataShell";
import {
  useCurrency,
  useBankAccount,
  useTax,
  usePaymentTerm,
} from "@/hooks/useSalesMaster";

export default function SalesMasterDataPage() {
  const currency = useCurrency();
  const bankAccount = useBankAccount();
  const tax = useTax();
  const paymentTerm = usePaymentTerm();

  /* ── Currency ──────────────────────────────────────────── */
  const currencyEntity: EntityConfig = {
    key:       "currency",
    label:     "Mata Uang (Currency)",
    idField:   "currencyId",
    codeField: "currencyCode",
    nameField: "currencyName",
    columns: [
      { key: "currencyCode", label: "Kode ISO" },
      { key: "currencyName", label: "Nama Mata Uang" },
      { key: "isActive",     label: "Status" },
    ],
    data:    currency.data,
    loading: currency.loading,
    isMock:  currency.isMock,
    error:   currency.error,
    filterFields: [
      { key: "currencyCode", label: "Kode",   type: "text" },
      { key: "currencyName", label: "Nama",   type: "text" },
      { key: "isActive",     label: "Status", type: "boolean" },
    ],
    formFields: [
      { key: "currencyCode", label: "Kode ISO (e.g. IDR)", type: "text", required: true, placeholder: "IDR" },
      { key: "currencyName", label: "Nama Mata Uang",      type: "text", required: true, placeholder: "Indonesian Rupiah" },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => currency.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => currency.update(Number(id), data as any),
    onDelete: (id) => currency.remove(Number(id)),
  };

  /* ── Bank Account ─────────────────────────────────────────── */
  const bankAccountEntity: EntityConfig = {
    key:       "bank-account",
    label:     "Rekening Bank",
    idField:   "accountId",
    codeField: "accountNumber",
    nameField: "bankName",
    columns: [
      { key: "bankName",      label: "Bank" },
      { key: "accountNumber", label: "Nomor Rekening" },
      { key: "accountName",   label: "Atas Nama" },
      { key: "branchId",      label: "Branch ID" },
      { key: "isActive",      label: "Status" },
    ],
    data:    bankAccount.data,
    loading: bankAccount.loading,
    isMock:  bankAccount.isMock,
    error:   bankAccount.error,
    filterFields: [
      { key: "bankName",      label: "Bank",      type: "text" },
      { key: "accountNumber", label: "No. Rek",   type: "text" },
      { key: "accountName",   label: "Atas Nama", type: "text" },
      { key: "isActive",      label: "Status",    type: "boolean" },
    ],
    formFields: [
      { key: "bankName",      label: "Nama Bank",      type: "text", required: true, placeholder: "BCA" },
      { key: "accountNumber", label: "Nomor Rekening", type: "text", required: true, placeholder: "1234567890" },
      { key: "accountName",   label: "Atas Nama",      type: "text", required: true, placeholder: "PT Perikanan Indonesia" },
      { key: "branchId",      label: "ID Branch",      type: "number", required: true, placeholder: "1" },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => bankAccount.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => bankAccount.update(Number(id), data as any),
    onDelete: (id) => bankAccount.remove(Number(id)),
  };

  /* ── Tax ───────────────────────────────────────────────────── */
  const taxEntity: EntityConfig = {
    key:       "tax",
    label:     "Pajak / Tax",
    idField:   "taxId",
    codeField: "taxCode",
    nameField: "taxPercentage",
    columns: [
      { key: "taxCode",       label: "Kode Pajak" },
      { key: "taxPercentage", label: "Persentase (%)" },
      { key: "isActive",      label: "Status" },
    ],
    data:    tax.data,
    loading: tax.loading,
    isMock:  tax.isMock,
    error:   tax.error,
    filterFields: [
      { key: "taxCode",  label: "Kode Pajak", type: "text" },
      { key: "isActive", label: "Status",     type: "boolean" },
    ],
    formFields: [
      { key: "taxCode",       label: "Kode Pajak",     type: "text",   required: true, placeholder: "PPN11" },
      { key: "taxPercentage", label: "Persentase (%)", type: "number", required: true, placeholder: "11" },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => tax.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => tax.update(Number(id), data as any),
    onDelete: (id) => tax.remove(Number(id)),
  };

  /* ── Payment Term ────────────────────────────────────────── */
  const paymentTermEntity: EntityConfig = {
    key:       "payment-term",
    label:     "Termin Pembayaran",
    idField:   "paymentTermId",
    codeField: "termCode",
    nameField: "termName",
    columns: [
      { key: "termCode", label: "Kode Termin" },
      { key: "termName", label: "Nama Termin" },
      { key: "days",     label: "Hari Jatuh Tempo" },
      { key: "isActive", label: "Status" },
    ],
    data:    paymentTerm.data,
    loading: paymentTerm.loading,
    isMock:  paymentTerm.isMock,
    error:   paymentTerm.error,
    filterFields: [
      { key: "termCode", label: "Kode",   type: "text" },
      { key: "termName", label: "Nama",   type: "text" },
      { key: "isActive", label: "Status", type: "boolean" },
    ],
    formFields: [
      { key: "termCode", label: "Kode Termin",      type: "text",   required: true, placeholder: "NET30" },
      { key: "termName", label: "Nama Termin",      type: "text",   required: true, placeholder: "Net 30 Days" },
      { key: "days",     label: "Hari Jatuh Tempo", type: "number", required: true, placeholder: "30" },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => paymentTerm.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => paymentTerm.update(Number(id), data as any),
    onDelete: (id) => paymentTerm.remove(Number(id)),
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <MasterDataShell
          title="Komponen Penjualan / Finansial"
          subtitle="Kelola master data finansial & penjualan termasuk Mata Uang, Bank, Pajak, dan Termin"
          entities={[
            currencyEntity,
            bankAccountEntity,
            taxEntity,
            paymentTermEntity,
          ]}
        />
      </AppShell>
    </ProtectedRoute>
  );
}
