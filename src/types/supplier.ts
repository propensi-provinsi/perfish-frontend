/** Status persetujuan supplier (master). */
export type MasterSupplierApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
/** @deprecated Use MasterSupplierApprovalStatus */
export type SupplierApprovalStatus = MasterSupplierApprovalStatus;

export interface SupplierData {
  id: string;
  supplierCode: string;
  supplierName: string;
  supplierType: string;
  paymentTermId?: number | null;
  currency?: number | null;
  alamat: string;
  nomorKontak: string;
  nomorIdentitas: string;
  active: boolean;
  approvalStatus?: MasterSupplierApprovalStatus;
  approvedAt?: string | null;
  approvedBy?: string | null;
  auditId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierPayload {
  auditId: string;
  supplierName: string;
  supplierType: string;
  paymentTermId?: number | null;
  currency?: number | null;
  alamat: string;
  nomorKontak: string;
  nomorIdentitas: string;
}

/** Form Master Audit Supplier — wajib diisi sebelum tambah supplier. Nama supplier dari form Tambah Supplier. */
export interface MasterSupplierAuditPayload {
  tanggalInspeksi: string;    // YYYY-MM-DD
  // A: Kapal Penangkap Ikan dari Supplier
  aIkanDitangkapPakaiKapal?: boolean;
  aUkuranKapal?: string;     // field teks (mis. 5 GT, 10 meter)
  aLamaWaktuPenangkapanMin?: number; // range hari
  aLamaWaktuPenangkapanMax?: number;
  aAlatTangkap?: string;     // max 255
  aJumlahAlatTangkap?: number;
  aBanyakUmpan?: number;
  aJumlahCrew?: number;
  // B: Cara Penanganan Ikan di atas Kapal oleh Supplier
  bKapalDenganPembeku?: boolean;
  bKapasitasPembekuGudang?: number;
  bAlurProsesPenanganan?: string;   // 500
  bPenerapanSanitasiKapal?: string; // 500
  bBanyakEsPerTripMin?: number;
  bBanyakEsPerTripMax?: number;
  bLamaProsesHandling?: number;
  bPembagianTugasKapal?: string;    // 255
  // C: Cara Penanganan di tempat pengumpul sementara
  cIkanDisimpanTempatPengumpul?: boolean;
  cAlurPenangananPengumpulan?: string; // 500
  cMediaTempatMenampung?: string;    // 255
  cPenangananIkan?: string;   // 500
  cSanitasiPenampungan?: string;    // 500
  cJumlahPekerjaPenampungan?: number;
  cPenggunaanEsPenampungan?: number; // integer
  // D: Media Pengangkut Ikan
  dCaraIkanDiangkut?: string; // 500
  dKapasitasSekaliAngkutMin?: number;
  dKapasitasSekaliAngkutMax?: number;
  dKondisiSanitasiMedia?: string;   // 500
  dLamaMuatAngkutBongkarMin?: number;
  dLamaMuatAngkutBongkarMax?: number;
  dTenagaProsesPengangkutan?: number;
}

/** @deprecated Use MasterSupplierAuditPayload */
export type SupplierAuditPayload = MasterSupplierAuditPayload;

export interface MasterSupplierAuditResponse {
  id: string;
  tanggalInspeksi: string;
  [key: string]: unknown;
}

export interface PaymentTermOption {
  paymentTermId: number;
  termCode: string;
  termName: string;
  days: number;
  isActive: boolean;
}

export interface CurrencyOption {
  currencyId: number;
  currencyCode: string;
  currencyName: string;
  isActive: boolean;
}

/** @deprecated Use MasterSupplierAuditResponse */
export type SupplierAuditResponse = MasterSupplierAuditResponse;

export const SUPPLIER_TYPES = [
  { value: "Perusahaan", label: "Perusahaan" },
  { value: "Nelayan", label: "Nelayan" },
  { value: "Koperasi", label: "Koperasi" },
];
