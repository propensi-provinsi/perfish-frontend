export interface SupplierData {
  id: string;
  supplierCode: string;
  supplierName: string;
  supplierType: string;
  alamat: string;
  nomorKontak: string;
  nomorIdentitas: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierPayload {
  supplierName: string;
  supplierType: string;
  alamat: string;
  nomorKontak: string;
  nomorIdentitas: string;
}

export const SUPPLIER_TYPES = [
  { value: "Perusahaan", label: "Perusahaan" },
  { value: "Nelayan", label: "Nelayan" },
  { value: "Koperasi", label: "Koperasi" },
];
