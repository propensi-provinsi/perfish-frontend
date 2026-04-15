"use client";

import React, { useEffect, useRef, useState, type FormEvent } from "react";
import apiClient from "@/lib/api";
import {
  SUPPLIER_TYPES,
  type ApiResponse,
  type SupplierData,
  type CreateSupplierPayload,
  type SupplierAuditPayload,
  type SupplierAuditResponse,
  type PaymentTermOption,
  type CurrencyOption,
} from "@/types";
import { Field, ModalOverlay } from "./ModalPrimitives";
const AUDIT_DEFAULTS: SupplierAuditPayload = {
  tanggalInspeksi: new Date().toISOString().slice(0, 10),
};

/** Hanya field ini yang dikirim ke API audit; nama supplier tidak termasuk (diisi di langkah 2) */
const AUDIT_PAYLOAD_KEYS: (keyof SupplierAuditPayload)[] = [
  "tanggalInspeksi",
  "aIkanDitangkapPakaiKapal", "aUkuranKapal", "aLamaWaktuPenangkapanMin", "aLamaWaktuPenangkapanMax",
  "aAlatTangkap", "aJumlahAlatTangkap", "aBanyakUmpan", "aJumlahCrew",
  "bKapalDenganPembeku", "bKapasitasPembekuGudang", "bAlurProsesPenanganan", "bPenerapanSanitasiKapal",
  "bBanyakEsPerTripMin", "bBanyakEsPerTripMax", "bLamaProsesHandling", "bPembagianTugasKapal",
  "cIkanDisimpanTempatPengumpul", "cAlurPenangananPengumpulan", "cMediaTempatMenampung",
  "cPenangananIkan", "cSanitasiPenampungan", "cJumlahPekerjaPenampungan", "cPenggunaanEsPenampungan",
  "dCaraIkanDiangkut", "dKapasitasSekaliAngkutMin", "dKapasitasSekaliAngkutMax",
  "dKondisiSanitasiMedia", "dLamaMuatAngkutBongkarMin", "dLamaMuatAngkutBongkarMax", "dTenagaProsesPengangkutan",
];

/** Build body dari DOM form agar nilai yang dikirim selalu yang terlihat di input. */
function buildAuditRequestBodyFromForm(formEl: HTMLFormElement): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const key of AUDIT_PAYLOAD_KEYS) {
    const el = formEl.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    if (!el) continue;
    const raw = "value" in el ? el.value : "";
    if (el.type === "number") {
      body[key] = raw === "" ? undefined : Number(raw);
    } else if (el.tagName === "SELECT" && (raw === "true" || raw === "false")) {
      body[key] = raw === "true";
    } else if (key === "tanggalInspeksi" || (el.type === "date")) {
      body[key] = raw.trim().slice(0, 10) || undefined;
    } else {
      body[key] = raw.trim() || undefined;
    }
  }
  return body;
}

/** Semua field audit wajib diisi */
function isAuditFilled(f: SupplierAuditPayload): boolean {
  if (!f.tanggalInspeksi?.trim()) return false;
  if (f.aIkanDitangkapPakaiKapal == null) return false;
  if (!(f.aUkuranKapal?.trim())) return false;
  if (f.aLamaWaktuPenangkapanMin == null || f.aLamaWaktuPenangkapanMax == null) return false;
  if (!(f.aAlatTangkap?.trim())) return false;
  if (f.aJumlahAlatTangkap == null || f.aBanyakUmpan == null || f.aJumlahCrew == null) return false;
  if (f.bKapalDenganPembeku == null || f.bKapasitasPembekuGudang == null) return false;
  if (!(f.bAlurProsesPenanganan?.trim()) || !(f.bPenerapanSanitasiKapal?.trim())) return false;
  if (f.bBanyakEsPerTripMin == null || f.bBanyakEsPerTripMax == null || f.bLamaProsesHandling == null) return false;
  if (!(f.bPembagianTugasKapal?.trim())) return false;
  if (f.cIkanDisimpanTempatPengumpul == null) return false;
  if (!(f.cAlurPenangananPengumpulan?.trim()) || !(f.cMediaTempatMenampung?.trim()) || !(f.cPenangananIkan?.trim()) || !(f.cSanitasiPenampungan?.trim())) return false;
  if (f.cJumlahPekerjaPenampungan == null || f.cPenggunaanEsPenampungan == null) return false;
  if (!(f.dCaraIkanDiangkut?.trim())) return false;
  if (f.dKapasitasSekaliAngkutMin == null || f.dKapasitasSekaliAngkutMax == null) return false;
  if (!(f.dKondisiSanitasiMedia?.trim())) return false;
  if (f.dLamaMuatAngkutBongkarMin == null || f.dLamaMuatAngkutBongkarMax == null) return false;
  if (f.dTenagaProsesPengangkutan == null) return false;
  return true;
}

/** Validasi range: max tidak boleh lebih kecil dari min. Return pesan error atau null. */
function getAuditRangeError(f: SupplierAuditPayload): string | null {
  if (f.aLamaWaktuPenangkapanMin != null && f.aLamaWaktuPenangkapanMax != null && f.aLamaWaktuPenangkapanMax < f.aLamaWaktuPenangkapanMin)
    return "Lama waktu penangkapan: nilai max tidak boleh lebih kecil dari min.";
  if (f.bBanyakEsPerTripMin != null && f.bBanyakEsPerTripMax != null && f.bBanyakEsPerTripMax < f.bBanyakEsPerTripMin)
    return "Banyak es per trip: nilai max tidak boleh lebih kecil dari min.";
  if (f.dKapasitasSekaliAngkutMin != null && f.dKapasitasSekaliAngkutMax != null && f.dKapasitasSekaliAngkutMax < f.dKapasitasSekaliAngkutMin)
    return "Kapasitas sekali angkut: nilai max tidak boleh lebih kecil dari min.";
  if (f.dLamaMuatAngkutBongkarMin != null && f.dLamaMuatAngkutBongkarMax != null && f.dLamaMuatAngkutBongkarMax < f.dLamaMuatAngkutBongkarMin)
    return "Lama muat/angkut/bongkar: nilai max tidak boleh lebih kecil dari min.";
  return null;
}

type AuditFieldKey = keyof SupplierAuditPayload;
const MSG_REQUIRED = "Wajib diisi";
const MSG_RANGE = "Max tidak boleh lebih kecil dari min";

/** Label singkat per field untuk ditampilkan di pesan error */
const AUDIT_FIELD_LABELS: Partial<Record<AuditFieldKey, string>> = {
  tanggalInspeksi: "Tanggal Inspeksi",
  aIkanDitangkapPakaiKapal: "Apakah Ikan ditangkap pakai kapal",
  aUkuranKapal: "Ukuran Kapal",
  aLamaWaktuPenangkapanMin: "Lama waktu penangkapan (min)",
  aLamaWaktuPenangkapanMax: "Lama waktu penangkapan (max)",
  aAlatTangkap: "Alat Tangkap",
  aJumlahAlatTangkap: "Jumlah alat tangkap",
  aBanyakUmpan: "Banyak umpan",
  aJumlahCrew: "Jumlah crew kapal",
  bKapalDenganPembeku: "Kapal dengan pembeku",
  bKapasitasPembekuGudang: "Kapasitas pembeku/gudang",
  bAlurProsesPenanganan: "Alur proses penanganan di kapal",
  bPenerapanSanitasiKapal: "Penerapan sanitasi kapal",
  bBanyakEsPerTripMin: "Banyak es per trip (min)",
  bBanyakEsPerTripMax: "Banyak es per trip (max)",
  bLamaProsesHandling: "Lama proses handling",
  bPembagianTugasKapal: "Pembagian tugas kapal",
  cIkanDisimpanTempatPengumpul: "Ikan disimpan di tempat pengumpul",
  cAlurPenangananPengumpulan: "Alur penanganan pengumpulan",
  cMediaTempatMenampung: "Media tempat menampung",
  cPenangananIkan: "Penanganan ikan",
  cSanitasiPenampungan: "Sanitasi penampungan",
  cJumlahPekerjaPenampungan: "Jumlah pekerja penampungan",
  cPenggunaanEsPenampungan: "Penggunaan es penampungan",
  dCaraIkanDiangkut: "Cara ikan diangkut",
  dKapasitasSekaliAngkutMin: "Kapasitas sekali angkut (min)",
  dKapasitasSekaliAngkutMax: "Kapasitas sekali angkut (max)",
  dKondisiSanitasiMedia: "Kondisi sanitasi media pengangkut",
  dLamaMuatAngkutBongkarMin: "Lama muat/angkut/bongkar (min)",
  dLamaMuatAngkutBongkarMax: "Lama muat/angkut/bongkar (max)",
  dTenagaProsesPengangkutan: "Tenaga proses pengangkutan",
};

/** Label untuk field yang kadang dikembalikan backend (bukan bagian form audit), mis. namaSupplier */
const BACKEND_FIELD_LABELS: Record<string, string> = {
  namaSupplier: "Nama Supplier",
  supplierName: "Nama Supplier",
};

function auditFieldErrorsToMessage(
  fieldErrs: Partial<Record<AuditFieldKey, string>> & Record<string, string>
): string {
  const keys = Object.keys(fieldErrs);
  if (keys.length === 0) return "";
  const onlyNamaSupplier = keys.every(
    (k) => k === "namaSupplier" || k === "supplierName"
  );
  if (onlyNamaSupplier) {
    return "Nama supplier tidak diisi di form Audit. Nama supplier diisi di langkah 2 (Data Supplier) setelah Anda simpan audit.";
  }
  const labels = keys.map(
    (k) => AUDIT_FIELD_LABELS[k as AuditFieldKey] || BACKEND_FIELD_LABELS[k] || k
  );
  return "Validasi gagal pada field: " + labels.join(", ");
}

/** Daftar error per field (untuk border merah + pesan di bawah input) */
function getAuditFieldErrors(f: SupplierAuditPayload): Partial<Record<AuditFieldKey, string>> {
  const err: Partial<Record<AuditFieldKey, string>> = {};
  if (!f.tanggalInspeksi?.trim()) err.tanggalInspeksi = MSG_REQUIRED;
  if (f.aIkanDitangkapPakaiKapal == null) err.aIkanDitangkapPakaiKapal = MSG_REQUIRED;
  if (!(f.aUkuranKapal?.trim())) err.aUkuranKapal = MSG_REQUIRED;
  if (f.aLamaWaktuPenangkapanMin == null) err.aLamaWaktuPenangkapanMin = MSG_REQUIRED;
  if (f.aLamaWaktuPenangkapanMax == null) err.aLamaWaktuPenangkapanMax = MSG_REQUIRED;
  if (f.aLamaWaktuPenangkapanMin != null && f.aLamaWaktuPenangkapanMax != null && f.aLamaWaktuPenangkapanMax < f.aLamaWaktuPenangkapanMin) {
    err.aLamaWaktuPenangkapanMin = MSG_RANGE;
    err.aLamaWaktuPenangkapanMax = MSG_RANGE;
  }
  if (!(f.aAlatTangkap?.trim())) err.aAlatTangkap = MSG_REQUIRED;
  if (f.aJumlahAlatTangkap == null) err.aJumlahAlatTangkap = MSG_REQUIRED;
  if (f.aBanyakUmpan == null) err.aBanyakUmpan = MSG_REQUIRED;
  if (f.aJumlahCrew == null) err.aJumlahCrew = MSG_REQUIRED;
  if (f.bKapalDenganPembeku == null) err.bKapalDenganPembeku = MSG_REQUIRED;
  if (f.bKapasitasPembekuGudang == null) err.bKapasitasPembekuGudang = MSG_REQUIRED;
  if (!(f.bAlurProsesPenanganan?.trim())) err.bAlurProsesPenanganan = MSG_REQUIRED;
  if (!(f.bPenerapanSanitasiKapal?.trim())) err.bPenerapanSanitasiKapal = MSG_REQUIRED;
  if (f.bBanyakEsPerTripMin == null) err.bBanyakEsPerTripMin = MSG_REQUIRED;
  if (f.bBanyakEsPerTripMax == null) err.bBanyakEsPerTripMax = MSG_REQUIRED;
  if (f.bBanyakEsPerTripMin != null && f.bBanyakEsPerTripMax != null && f.bBanyakEsPerTripMax < f.bBanyakEsPerTripMin) {
    err.bBanyakEsPerTripMin = MSG_RANGE;
    err.bBanyakEsPerTripMax = MSG_RANGE;
  }
  if (f.bLamaProsesHandling == null) err.bLamaProsesHandling = MSG_REQUIRED;
  if (!(f.bPembagianTugasKapal?.trim())) err.bPembagianTugasKapal = MSG_REQUIRED;
  if (f.cIkanDisimpanTempatPengumpul == null) err.cIkanDisimpanTempatPengumpul = MSG_REQUIRED;
  if (!(f.cAlurPenangananPengumpulan?.trim())) err.cAlurPenangananPengumpulan = MSG_REQUIRED;
  if (!(f.cMediaTempatMenampung?.trim())) err.cMediaTempatMenampung = MSG_REQUIRED;
  if (!(f.cPenangananIkan?.trim())) err.cPenangananIkan = MSG_REQUIRED;
  if (!(f.cSanitasiPenampungan?.trim())) err.cSanitasiPenampungan = MSG_REQUIRED;
  if (f.cJumlahPekerjaPenampungan == null) err.cJumlahPekerjaPenampungan = MSG_REQUIRED;
  if (f.cPenggunaanEsPenampungan == null) err.cPenggunaanEsPenampungan = MSG_REQUIRED;
  if (!(f.dCaraIkanDiangkut?.trim())) err.dCaraIkanDiangkut = MSG_REQUIRED;
  if (f.dKapasitasSekaliAngkutMin == null) err.dKapasitasSekaliAngkutMin = MSG_REQUIRED;
  if (f.dKapasitasSekaliAngkutMax == null) err.dKapasitasSekaliAngkutMax = MSG_REQUIRED;
  if (f.dKapasitasSekaliAngkutMin != null && f.dKapasitasSekaliAngkutMax != null && f.dKapasitasSekaliAngkutMax < f.dKapasitasSekaliAngkutMin) {
    err.dKapasitasSekaliAngkutMin = MSG_RANGE;
    err.dKapasitasSekaliAngkutMax = MSG_RANGE;
  }
  if (!(f.dKondisiSanitasiMedia?.trim())) err.dKondisiSanitasiMedia = MSG_REQUIRED;
  if (f.dLamaMuatAngkutBongkarMin == null) err.dLamaMuatAngkutBongkarMin = MSG_REQUIRED;
  if (f.dLamaMuatAngkutBongkarMax == null) err.dLamaMuatAngkutBongkarMax = MSG_REQUIRED;
  if (f.dLamaMuatAngkutBongkarMin != null && f.dLamaMuatAngkutBongkarMax != null && f.dLamaMuatAngkutBongkarMax < f.dLamaMuatAngkutBongkarMin) {
    err.dLamaMuatAngkutBongkarMin = MSG_RANGE;
    err.dLamaMuatAngkutBongkarMax = MSG_RANGE;
  }
  if (f.dTenagaProsesPengangkutan == null) err.dTenagaProsesPengangkutan = MSG_REQUIRED;
  return err;
}

export function AddSupplierModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onError?: (msg: string) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [auditForm, setAuditForm] = useState<SupplierAuditPayload>(AUDIT_DEFAULTS);
  const auditFormRef = useRef(auditForm);
  auditFormRef.current = auditForm;
  const [supplierForm, setSupplierForm] = useState<CreateSupplierPayload>({
    auditId: "",
    supplierName: "",
    supplierType: "Perusahaan",
    paymentTermId: null,
    currency: null,
    alamat: "",
    nomorKontak: "",
    nomorIdentitas: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [auditFieldErrors, setAuditFieldErrors] = useState<Partial<Record<AuditFieldKey, string>>>({});
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermOption[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);

  const auditRangeError = getAuditRangeError(auditForm);
  const auditFilled = isAuditFilled(auditForm);
  const supplierValid = supplierForm.supplierName.trim().length > 0 && auditId != null;

  const inputClsBase =
    "w-full rounded-md border px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 dark:bg-dark-card ";
  const inputClsError =
    "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500";
  const inputClsNormal =
    "border-gray-300 focus:border-cyan focus:ring-cyan dark:border-gray-600";
  function auditInputCls(fieldKey: AuditFieldKey) {
    return inputClsBase + (auditFieldErrors[fieldKey] ? inputClsError : inputClsNormal);
  }
  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan dark:border-gray-600 dark:bg-dark-card";

  useEffect(() => {
    async function loadSupplierMasters() {
      try {
        const [termRes, currencyRes] = await Promise.all([
          apiClient.get<ApiResponse<PaymentTermOption[]>>("/v1/master/payment-terms/active"),
          apiClient.get<ApiResponse<CurrencyOption[]>>("/v1/master/currencies/active"),
        ]);
        setPaymentTerms(termRes.data.data ?? []);
        setCurrencies(currencyRes.data.data ?? []);
      } catch {
        setError("Gagal memuat master payment term/currency.");
      }
    }
    void loadSupplierMasters();
  }, []);

  function setAudit<K extends keyof SupplierAuditPayload>(key: K, value: SupplierAuditPayload[K]) {
    setAuditForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setAuditFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key as AuditFieldKey];
      return next;
    });
  }
  function setSupplier(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setSupplierForm((prev) => {
      if (name === "paymentTermId" || name === "currency") {
        return { ...prev, [name]: value === "" ? null : Number(value) };
      }
      return { ...prev, [name]: value };
    });
    setError(null);
  }

  async function handleSubmitAudit(e: FormEvent) {
    e.preventDefault();
    const formEl = e.target as HTMLFormElement;
    const body = buildAuditRequestBodyFromForm(formEl);
    const payloadForValidation = body as unknown as SupplierAuditPayload;
    const rangeErr = getAuditRangeError(payloadForValidation);
    const fieldErrs = getAuditFieldErrors(payloadForValidation);
    if (Object.keys(fieldErrs).length > 0) {
      setAuditFieldErrors(fieldErrs);
      setError(rangeErr || "Perbaiki field yang ditandai merah.");
      return;
    }
    if (rangeErr) {
      setError(rangeErr);
      setAuditFieldErrors(getAuditFieldErrors(payloadForValidation));
      return;
    }
    const missingKeys = AUDIT_PAYLOAD_KEYS.filter((k) => {
      const val = body[k];
      if (val === undefined || val === null) return true;
      if (typeof val === "string" && val.trim() === "") return true;
      return false;
    });
    if (missingKeys.length > 0) {
      setError("Beberapa field belum terisi. Pastikan semua field wajib diisi sebelum simpan.");
      setAuditFieldErrors(
        missingKeys.reduce((acc, k) => ({ ...acc, [k]: "Wajib diisi" }), {} as Partial<Record<AuditFieldKey, string>>)
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    setAuditFieldErrors({});
    try {
      const res = await apiClient.post<ApiResponse<SupplierAuditResponse>>(
        "/v1/supplier-audits",
        body
      );
      const id = res.data?.data?.id ? String(res.data.data.id) : null;
      if (id) {
        setAuditId(id);
        setSupplierForm((prev) => ({ ...prev, auditId: id }));
        setSuccess("Audit tersimpan. Isi data supplier di bawah.");
        setStep(2);
      } else {
        setError("Respons server tidak berisi ID audit.");
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: Record<string, unknown>;
        };
      };
      const status = axiosErr.response?.status;
      const resData = axiosErr.response?.data as Record<string, unknown> | undefined;
      const backendMsg = (resData?.message as string) || "Gagal menyimpan audit";

      // Ambil field errors dari berbagai format respons backend (semua key dari backend)
      const allFieldErrs: Record<string, string> = {};
      if (status === 400 && resData) {
        const fromData = resData.data;
        if (fromData && typeof fromData === "object" && !Array.isArray(fromData)) {
          for (const [k, v] of Object.entries(fromData)) {
            if (typeof v === "string") allFieldErrs[k] = v;
          }
        }
        if (Object.keys(allFieldErrs).length === 0 && typeof resData === "object") {
          for (const [k, v] of Object.entries(resData)) {
            if (k !== "success" && k !== "message" && typeof v === "string") allFieldErrs[k] = v;
          }
        }
        const fromErrors = resData.errors;
        if (Object.keys(allFieldErrs).length === 0 && fromErrors && typeof fromErrors === "object" && !Array.isArray(fromErrors)) {
          for (const [k, v] of Object.entries(fromErrors)) {
            if (typeof v === "string") allFieldErrs[k] = v;
          }
        }
      }

      // Hanya field yang ada di form audit yang dapat border merah; namaSupplier dll hanya di pesan
      const formOnlyErrs: Partial<Record<AuditFieldKey, string>> = {};
      for (const key of AUDIT_PAYLOAD_KEYS) {
        if (allFieldErrs[key]) formOnlyErrs[key] = allFieldErrs[key];
      }
      setAuditFieldErrors(formOnlyErrs);

      // Pesan error: sebutkan field yang gagal (termasuk namaSupplier dengan penjelasan)
      if (Object.keys(allFieldErrs).length > 0) {
        setError(auditFieldErrorsToMessage(allFieldErrs) + ".");
      } else {
        // Bukan field errors: cek BadRequestException (range dll) → highlight field range
        const msgLower = (backendMsg || "").toLowerCase();
        if (msgLower.includes("lama waktu penangkapan") && msgLower.includes("max")) {
          setAuditFieldErrors({ aLamaWaktuPenangkapanMin: backendMsg, aLamaWaktuPenangkapanMax: backendMsg });
          setError(backendMsg);
        } else if (msgLower.includes("banyak es per trip") && msgLower.includes("max")) {
          setAuditFieldErrors({ bBanyakEsPerTripMin: backendMsg, bBanyakEsPerTripMax: backendMsg });
          setError(backendMsg);
        } else if (msgLower.includes("kapasitas sekali angkut") && msgLower.includes("max")) {
          setAuditFieldErrors({ dKapasitasSekaliAngkutMin: backendMsg, dKapasitasSekaliAngkutMax: backendMsg });
          setError(backendMsg);
        } else if (msgLower.includes("muat") && msgLower.includes("angkut") && msgLower.includes("max")) {
          setAuditFieldErrors({ dLamaMuatAngkutBongkarMin: backendMsg, dLamaMuatAngkutBongkarMax: backendMsg });
          setError(backendMsg);
        } else {
          setError(backendMsg);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitSupplier(e: FormEvent) {
    e.preventDefault();
    if (!supplierValid || !auditId) return;
    if (supplierForm.paymentTermId == null) {
      setError("Payment term wajib dipilih.");
      return;
    }
    if (supplierForm.currency == null) {
      setError("Currency wajib dipilih.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post<ApiResponse<SupplierData>>("/v1/suppliers", {
        ...supplierForm,
        auditId,
      });
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message;
      const errorMsg = msg?.toLowerCase().includes("sudah terdaftar")
        ? "Supplier sudah terdaftar"
        : (msg || "Gagal menyimpan supplier");
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {step === 1 ? "Audit Supplier" : "Data Supplier"}
        </h2>

        {(error || (step === 1 && auditRangeError)) && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {step === 1 && auditRangeError ? auditRangeError : error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
            {success}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSubmitAudit} className="space-y-4">
            <Field label="Tanggal Inspeksi" required error={auditFieldErrors.tanggalInspeksi}>
              <input
                name="tanggalInspeksi"
                type="date"
                value={auditForm.tanggalInspeksi}
                onChange={(e) => setAudit("tanggalInspeksi", e.target.value)}
                className={auditInputCls("tanggalInspeksi")}
              />
            </Field>
            <AuditFormSection
              title="A: Kapal Penangkap Ikan dari Supplier"
              fields={
                <>
                  <Field label="Apakah Ikan ditangkap menggunakan Kapal Penangkap Ikan?" required error={auditFieldErrors.aIkanDitangkapPakaiKapal}>
                    <select name="aIkanDitangkapPakaiKapal" value={auditForm.aIkanDitangkapPakaiKapal === true ? "true" : auditForm.aIkanDitangkapPakaiKapal === false ? "false" : ""} onChange={(e) => setAudit("aIkanDitangkapPakaiKapal", e.target.value === "true" ? true : e.target.value === "false" ? false : undefined)} className={auditInputCls("aIkanDitangkapPakaiKapal")}>
                      <option value="">-- Pilih --</option>
                      <option value="true">Ya</option>
                      <option value="false">Tidak</option>
                    </select>
                  </Field>
                  <Field label="Berapa besar Ukuran Kapal yang digunakan untuk menangkap Ikan?" required error={auditFieldErrors.aUkuranKapal}>
                    <input name="aUkuranKapal" maxLength={100} value={auditForm.aUkuranKapal ?? ""} onChange={(e) => setAudit("aUkuranKapal", e.target.value)} className={auditInputCls("aUkuranKapal")} placeholder="..." />
                  </Field>
                  <Field label="Berapa lama waktu penangkapan ikan?" required error={auditFieldErrors.aLamaWaktuPenangkapanMin ?? auditFieldErrors.aLamaWaktuPenangkapanMax}>
                    <div className="flex gap-2 items-center">
                      <input name="aLamaWaktuPenangkapanMin" type="number" min={0} placeholder="Min (jam)" value={auditForm.aLamaWaktuPenangkapanMin ?? ""} onChange={(e) => setAudit("aLamaWaktuPenangkapanMin", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("aLamaWaktuPenangkapanMin")} />
                      <span className="text-gray-500">s/d</span>
                      <input name="aLamaWaktuPenangkapanMax" type="number" min={0} placeholder="Max (jam)" value={auditForm.aLamaWaktuPenangkapanMax ?? ""} onChange={(e) => setAudit("aLamaWaktuPenangkapanMax", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("aLamaWaktuPenangkapanMax")} />
                    </div>
                  </Field>
                  <Field label="Alat Tangkap apa yang digunakan untuk menangkap Ikan?" required error={auditFieldErrors.aAlatTangkap}>
                    <input name="aAlatTangkap" maxLength={255} value={auditForm.aAlatTangkap ?? ""} onChange={(e) => setAudit("aAlatTangkap", e.target.value)} className={auditInputCls("aAlatTangkap")} placeholder="Pukat Harimau" />
                  </Field>
                  <Field label="Berapa banyak jumlah alat tangkap yang dibawa selama 1 trip penangkapan ikan?" required error={auditFieldErrors.aJumlahAlatTangkap}>
                    <input name="aJumlahAlatTangkap" type="number" min={0} value={auditForm.aJumlahAlatTangkap ?? ""} onChange={(e) => setAudit("aJumlahAlatTangkap", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("aJumlahAlatTangkap")} placeholder="pieces" />
                  </Field>
                  <Field label="Berapa banyak umpan yang dibawa?" required error={auditFieldErrors.aBanyakUmpan}>
                    <input name="aBanyakUmpan" type="number" min={0} value={auditForm.aBanyakUmpan ?? ""} onChange={(e) => setAudit("aBanyakUmpan", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("aBanyakUmpan")} placeholder="pieces"/>
                  </Field>
                  <Field label="Berapa jumlah orang / crew kapal?" required error={auditFieldErrors.aJumlahCrew}>
                    <input name="aJumlahCrew" type="number" min={0} value={auditForm.aJumlahCrew ?? ""} onChange={(e) => setAudit("aJumlahCrew", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("aJumlahCrew")} placeholder="orang" />
                  </Field>
                </>
              }
            />
            <AuditFormSection
              title="B: Cara Penanganan Ikan di atas Kapal oleh Supplier"
              fields={
                <>
                  <Field label="Kapal yang digunakan apakah kapal dengan pembeku?" required error={auditFieldErrors.bKapalDenganPembeku}>
                    <select name="bKapalDenganPembeku" value={auditForm.bKapalDenganPembeku === true ? "true" : auditForm.bKapalDenganPembeku === false ? "false" : ""} onChange={(e) => setAudit("bKapalDenganPembeku", e.target.value === "true" ? true : e.target.value === "false" ? false : undefined)} className={auditInputCls("bKapalDenganPembeku")}>
                    <option value="">-- Pilih --</option>
                    <option value="true">Ya</option>
                    <option value="false">Tidak</option>
                  </select>
                  </Field>
                  <Field label="Berapa kapasitas pembeku dan gudang beku di atas kapal?" required error={auditFieldErrors.bKapasitasPembekuGudang}>
                    <input name="bKapasitasPembekuGudang" type="number" min={0} value={auditForm.bKapasitasPembekuGudang ?? ""} onChange={(e) => setAudit("bKapasitasPembekuGudang", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("bKapasitasPembekuGudang")} placeholder="kg" />
                  </Field>
                  <Field label="Bagaimana alur proses penanganan di atas kapal?" required error={auditFieldErrors.bAlurProsesPenanganan}>
                    <textarea name="bAlurProsesPenanganan" maxLength={500} rows={2} value={auditForm.bAlurProsesPenanganan ?? ""} onChange={(e) => setAudit("bAlurProsesPenanganan", e.target.value)} className={auditInputCls("bAlurProsesPenanganan")} placeholder="..." />
                  </Field>
                  <Field label="Bagaimana penerapan sanitasi di atas kapal?" required error={auditFieldErrors.bPenerapanSanitasiKapal}>
                    <textarea name="bPenerapanSanitasiKapal" maxLength={500} rows={2} value={auditForm.bPenerapanSanitasiKapal ?? ""} onChange={(e) => setAudit("bPenerapanSanitasiKapal", e.target.value)} className={auditInputCls("bPenerapanSanitasiKapal")} placeholder="..." />
                  </Field>
                  <Field label="Berapa banyak es yang dibawa setiap 1 trip?" required error={auditFieldErrors.bBanyakEsPerTripMin ?? auditFieldErrors.bBanyakEsPerTripMax}>
                    <div className="flex gap-2 items-center">
                      <input name="bBanyakEsPerTripMin" type="number" min={0} placeholder="Min (kg)" value={auditForm.bBanyakEsPerTripMin ?? ""} onChange={(e) => setAudit("bBanyakEsPerTripMin", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("bBanyakEsPerTripMin")} />
                      <span className="text-gray-500">s/d</span>
                      <input name="bBanyakEsPerTripMax" type="number" min={0} placeholder="Max (kg)" value={auditForm.bBanyakEsPerTripMax ?? ""} onChange={(e) => setAudit("bBanyakEsPerTripMax", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("bBanyakEsPerTripMax")} />
                    </div>
                  </Field>
                  <Field label="Berapa lama proses penangkapan dan handling ikan di atas kapal?" required error={auditFieldErrors.bLamaProsesHandling}>
                    <input name="bLamaProsesHandling" type="number" min={0} value={auditForm.bLamaProsesHandling ?? ""} onChange={(e) => setAudit("bLamaProsesHandling", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("bLamaProsesHandling")} placeholder="jam" />
                  </Field>
                  <Field label="Bagaimana pembagian tugas di atas kapal?" required error={auditFieldErrors.bPembagianTugasKapal}>
                    <input name="bPembagianTugasKapal" maxLength={255} value={auditForm.bPembagianTugasKapal ?? ""} onChange={(e) => setAudit("bPembagianTugasKapal", e.target.value)} className={auditInputCls("bPembagianTugasKapal")} placeholder="..." />
                  </Field>
                </>
              }
            />
            <AuditFormSection
              title="C: Cara Penanganan Ikan di tempat pengumpul sementara oleh Supplier"
              fields={
                <>
                  <Field label="Apakah ikan disimpan terlebih dahulu di tempat pengumpul?" required error={auditFieldErrors.cIkanDisimpanTempatPengumpul}>
                    <select name="cIkanDisimpanTempatPengumpul" value={auditForm.cIkanDisimpanTempatPengumpul === true ? "true" : auditForm.cIkanDisimpanTempatPengumpul === false ? "false" : ""} onChange={(e) => setAudit("cIkanDisimpanTempatPengumpul", e.target.value === "true" ? true : e.target.value === "false" ? false : undefined)} className={auditInputCls("cIkanDisimpanTempatPengumpul")}>
                    <option value="">-- Pilih --</option>
                    <option value="true">Ya</option>
                    <option value="false">Tidak</option>
                  </select>
                  </Field>
                  <Field label="Bagaimana alur penanganan di tempat pengumpulan sementara?" required error={auditFieldErrors.cAlurPenangananPengumpulan}>
                    <textarea name="cAlurPenangananPengumpulan" maxLength={500} rows={2} value={auditForm.cAlurPenangananPengumpulan ?? ""} onChange={(e) => setAudit("cAlurPenangananPengumpulan", e.target.value)} className={auditInputCls("cAlurPenangananPengumpulan")} placeholder="..." />
                  </Field>
                  <Field label="Media apa yang digunakan sebagai tempat menampung sementara?" required error={auditFieldErrors.cMediaTempatMenampung}>
                    <input name="cMediaTempatMenampung" maxLength={255} value={auditForm.cMediaTempatMenampung ?? ""} onChange={(e) => setAudit("cMediaTempatMenampung", e.target.value)} className={auditInputCls("cMediaTempatMenampung")} placeholder="..." />
                  </Field>
                  <Field label="Bagaimana penanganan ikan?" required error={auditFieldErrors.cPenangananIkan}>
                    <textarea name="cPenangananIkan" maxLength={500} rows={2} value={auditForm.cPenangananIkan ?? ""} onChange={(e) => setAudit("cPenangananIkan", e.target.value)} className={auditInputCls("cPenangananIkan")} placeholder="..." />
                  </Field>
                  <Field label="Bagaimana penerapan sanitasi di tempat penampungan sementara?" required error={auditFieldErrors.cSanitasiPenampungan}>
                    <textarea name="cSanitasiPenampungan" maxLength={500} rows={2} value={auditForm.cSanitasiPenampungan ?? ""} onChange={(e) => setAudit("cSanitasiPenampungan", e.target.value)} className={auditInputCls("cSanitasiPenampungan")} placeholder="..." />
                  </Field>
                  <Field label="Berapa jumlah pekerja ditempat penampungan sementara?" required error={auditFieldErrors.cJumlahPekerjaPenampungan}>
                    <input name="cJumlahPekerjaPenampungan" type="number" min={0} value={auditForm.cJumlahPekerjaPenampungan ?? ""} onChange={(e) => setAudit("cJumlahPekerjaPenampungan", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("cJumlahPekerjaPenampungan")} placeholder="orang" />
                  </Field>
                  <Field label="Berapa banyak penggunaan es untuk menampung ikan?" required error={auditFieldErrors.cPenggunaanEsPenampungan}>
                    <input name="cPenggunaanEsPenampungan" type="number" min={0} value={auditForm.cPenggunaanEsPenampungan ?? ""} onChange={(e) => setAudit("cPenggunaanEsPenampungan", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("cPenggunaanEsPenampungan")} placeholder="Integer" />
                  </Field>
                </>
              }
            />
            <AuditFormSection
              title="D: Media Pengangkut Ikan"
              fields={
                <>
                  <Field label="Bagaimana Ikan diangkut dan dibawa ke Unit Pengolahan?" required error={auditFieldErrors.dCaraIkanDiangkut}>
                    <textarea name="dCaraIkanDiangkut" maxLength={500} rows={2} value={auditForm.dCaraIkanDiangkut ?? ""} onChange={(e) => setAudit("dCaraIkanDiangkut", e.target.value)} className={auditInputCls("dCaraIkanDiangkut")} placeholder="..." />
                  </Field>
                  <Field label="Berapa Kapasitas sekali angkut?" required error={auditFieldErrors.dKapasitasSekaliAngkutMin ?? auditFieldErrors.dKapasitasSekaliAngkutMax}>
                    <div className="flex gap-2 items-center">
                      <input name="dKapasitasSekaliAngkutMin" type="number" min={0} placeholder="Min (kg)" value={auditForm.dKapasitasSekaliAngkutMin ?? ""} onChange={(e) => setAudit("dKapasitasSekaliAngkutMin", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("dKapasitasSekaliAngkutMin")} />
                      <span className="text-gray-500">s/d</span>
                      <input name="dKapasitasSekaliAngkutMax" type="number" min={0} placeholder="Max (kg)" value={auditForm.dKapasitasSekaliAngkutMax ?? ""} onChange={(e) => setAudit("dKapasitasSekaliAngkutMax", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("dKapasitasSekaliAngkutMax")} />
                    </div>
                  </Field>
                  <Field label="Bagaimana kondisi Sanitasi Media Pengangkut Ikan?" required error={auditFieldErrors.dKondisiSanitasiMedia}>
                    <textarea name="dKondisiSanitasiMedia" maxLength={500} rows={2} value={auditForm.dKondisiSanitasiMedia ?? ""} onChange={(e) => setAudit("dKondisiSanitasiMedia", e.target.value)} className={auditInputCls("dKondisiSanitasiMedia")} placeholder="..." />
                  </Field>
                  <Field label="Berapa lama proses Muat, Angkut dan Bongkar menuju Unit Pengolahan?" required error={auditFieldErrors.dLamaMuatAngkutBongkarMin ?? auditFieldErrors.dLamaMuatAngkutBongkarMax}>
                    <div className="flex gap-2 items-center">
                      <input name="dLamaMuatAngkutBongkarMin" type="number" min={0} placeholder="Min (jam)" value={auditForm.dLamaMuatAngkutBongkarMin ?? ""} onChange={(e) => setAudit("dLamaMuatAngkutBongkarMin", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("dLamaMuatAngkutBongkarMin")} />
                      <span className="text-gray-500">s/d</span>
                      <input name="dLamaMuatAngkutBongkarMax" type="number" min={0} placeholder="Max (jam)" value={auditForm.dLamaMuatAngkutBongkarMax ?? ""} onChange={(e) => setAudit("dLamaMuatAngkutBongkarMax", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("dLamaMuatAngkutBongkarMax")} />
                    </div>
                  </Field>
                  <Field label="Berapa banyak tenaga yang digunakan untuk proses pengangkutan?" required error={auditFieldErrors.dTenagaProsesPengangkutan}>
                    <input name="dTenagaProsesPengangkutan" type="number" min={0} value={auditForm.dTenagaProsesPengangkutan ?? ""} onChange={(e) => setAudit("dTenagaProsesPengangkutan", e.target.value ? Number(e.target.value) : undefined)} className={auditInputCls("dTenagaProsesPengangkutan")} placeholder="orang" />
                  </Field>
                </>
              }
            />
            <div className="flex flex-col items-end gap-2 pt-2">
              {!auditFilled && (
                <p className="text-sm text-amber-600 dark:text-amber-400 w-full">Isi semua field wajib sebelum menyimpan.</p>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-white/5">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="rounded-md bg-cyan px-4 py-2 text-sm font-medium text-white hover:bg-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? "Menyimpan…" : "Simpan Audit & Lanjut"}
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmitSupplier} className="space-y-4">
            <Field label="Nama Supplier" required>
              <input name="supplierName" value={supplierForm.supplierName} onChange={setSupplier} placeholder="Masukkan nama supplier" maxLength={150} className={inputCls} />
            </Field>
            <Field label="Tipe Supplier">
              <select name="supplierType" value={supplierForm.supplierType} onChange={setSupplier} className={inputCls}>
                {SUPPLIER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Payment Term">
              <select name="paymentTermId" value={supplierForm.paymentTermId ?? ""} onChange={setSupplier} className={inputCls}>
                <option value="">Pilih payment term</option>
                {paymentTerms.map((term) => (
                  <option key={term.paymentTermId} value={term.paymentTermId}>
                    {term.termCode} - {term.termName} ({term.days} hari)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Currency">
              <select name="currency" value={supplierForm.currency ?? ""} onChange={setSupplier} className={inputCls}>
                <option value="">Pilih currency</option>
                {currencies.map((currency) => (
                  <option key={currency.currencyId} value={currency.currencyId}>
                    {currency.currencyCode} - {currency.currencyName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Alamat">
              <input name="alamat" value={supplierForm.alamat} onChange={setSupplier} placeholder="Alamat (maks. 255)" maxLength={255} className={inputCls} />
            </Field>
            <Field label="Nomor Kontak">
              <input name="nomorKontak" value={supplierForm.nomorKontak} onChange={setSupplier} placeholder="Maks. 50" maxLength={50} className={inputCls} />
            </Field>
            <Field label="Nomor Identitas">
              <input name="nomorIdentitas" value={supplierForm.nomorIdentitas} onChange={setSupplier} placeholder="Maks. 100, unik" maxLength={100} className={inputCls} />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-white/5">
                Kembali
              </button>
              <button type="submit" disabled={!supplierValid || submitting} className="rounded-md bg-cyan px-4 py-2 text-sm font-medium text-white hover:bg-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? "Menyimpan…" : "Simpan Supplier"}
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalOverlay>
  );
}

function AuditFormSection({ title, fields }: { title: string; fields: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
      {fields}
    </div>
  );
}
