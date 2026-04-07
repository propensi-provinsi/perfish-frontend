"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import MasterDataShell, {
  type EntityConfig,
} from "@/components/master-data/MasterDataShell";
import { useSupplier } from "@/hooks/useSupplier";
import { SUPPLIER_TYPES } from "@/types/supplier";

export default function SupplierMasterDataPage() {
  const supplier = useSupplier();

  const supplierEntity: EntityConfig = {
    key:       "supplier",
    label:     "Supplier",
    idField:   "id",
    codeField: "supplierCode",
    nameField: "supplierName",
    columns: [
      { key: "supplierCode",   label: "Kode" },
      { key: "supplierName",   label: "Nama Supplier" },
      { key: "supplierType",   label: "Tipe" },
      { key: "nomorKontak",    label: "No Kontrak/Kontak" },
      { key: "active",         label: "Status" },
    ],
    data:    supplier.data,
    loading: supplier.loading,
    isMock:  supplier.isMock,
    error:   supplier.error,
    filterFields: [
      { key: "supplierCode", label: "Kode", type: "text" },
      { key: "supplierName", label: "Nama", type: "text" },
      { key: "supplierType", label: "Tipe", type: "select", options: SUPPLIER_TYPES },
      { key: "active",       label: "Status", type: "boolean" },
    ],
    formFields: [
      { key: "supplierName",   label: "Nama Supplier", type: "text", required: true, placeholder: "PT Nelayan Yaa" },
      { key: "supplierType",   label: "Tipe Supplier", type: "select", required: true, options: SUPPLIER_TYPES },
      { key: "alamat",         label: "Alamat",        type: "text", required: true, placeholder: "Jl. Muara Baru" },
      { key: "nomorKontak",    label: "Nomor Kontak",  type: "text", required: true, placeholder: "08123456789" },
      { key: "nomorIdentitas", label: "No Identitas",  type: "text", required: true, placeholder: "NPWP/NIK" },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => supplier.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => supplier.update(String(id), data as any),
    onDelete: (id) => supplier.remove(String(id)),
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <MasterDataShell
          title="Master Supplier"
          subtitle="Kelola data pendaftaran pemasok dan nelayan."
          entities={[supplierEntity]}
        />
      </AppShell>
    </ProtectedRoute>
  );
}
