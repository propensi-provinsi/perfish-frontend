"use client";

import { Fragment, useEffect, useState } from "react";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import apiClient from "@/lib/api";
import type { ApiResponse, SupplierData } from "@/types";
/* ================================================================
   Audit Inspection Table — view + edit
   Structured like the physical inspection form:
   NO | ITEM INSPEKSI | CATATAN (answer)
   ================================================================ */

type AuditRow = {
  key: string;
  label: string;
  type: "boolean" | "text" | "number" | "textarea" | "date";
  rangeWith?: string;
};

type AuditSection = { code: string; title: string; rows: AuditRow[] };

const AUDIT_SECTIONS: AuditSection[] = [
  {
    code: "A",
    title: "Kapal Penangkap Ikan dari Supplier",
    rows: [
      { key: "aIkanDitangkapPakaiKapal", label: "Apakah Ikan ditangkap menggunakan Kapal Penangkap Ikan?", type: "boolean" },
      { key: "aUkuranKapal", label: "Berapa besar Ukuran Kapal yang digunakan untuk menangkap Ikan?", type: "text" },
      { key: "aLamaWaktuPenangkapanMin", label: "Berapa lama waktu penangkapan ikan?", type: "number", rangeWith: "aLamaWaktuPenangkapanMax" },
      { key: "aAlatTangkap", label: "Alat Tangkap apa yang digunakan untuk menangkap Ikan?", type: "text" },
      { key: "aJumlahAlatTangkap", label: "Berapa banyak jumlah alat tangkap yang dibawa selama 1 trip penangkapan ikan?", type: "number" },
      { key: "aBanyakUmpan", label: "Berapa banyak umpan yang dibawa?", type: "number" },
      { key: "aJumlahCrew", label: "Berapa jumlah orang / crew kapal?", type: "number" },
    ],
  },
  {
    code: "B",
    title: "Cara Penanganan Ikan di atas Kapal oleh Supplier",
    rows: [
      { key: "bKapalDenganPembeku", label: "Kapal yang digunakan apakah kapal dengan pembeku?", type: "boolean" },
      { key: "bKapasitasPembekuGudang", label: "Berapa kapasitas pembeku dan gudang beku di atas kapal?", type: "number" },
      { key: "bAlurProsesPenanganan", label: "Bagaimana alur proses penanganan di atas kapal?", type: "textarea" },
      { key: "bPenerapanSanitasiKapal", label: "Bagaimana penerapan sanitasi di atas kapal?", type: "textarea" },
      { key: "bBanyakEsPerTripMin", label: "Berapa banyak es yang dibawa setiap 1 trip?", type: "number", rangeWith: "bBanyakEsPerTripMax" },
      { key: "bLamaProsesHandling", label: "Berapa lama proses penangkapan dan handling ikan di atas kapal?", type: "number" },
      { key: "bPembagianTugasKapal", label: "Bagaimana pembagian tugas di atas kapal?", type: "text" },
    ],
  },
  {
    code: "C",
    title: "Cara Penanganan Ikan di tempat pengumpul sementara oleh Supplier",
    rows: [
      { key: "cIkanDisimpanTempatPengumpul", label: "Apakah ikan disimpan terlebih dahulu di tempat pengumpul?", type: "boolean" },
      { key: "cAlurPenangananPengumpulan", label: "Bagaimana alur penanganan di tempat pengumpulan sementara?", type: "textarea" },
      { key: "cMediaTempatMenampung", label: "Media apa yang digunakan sebagai tempat menampung sementara?", type: "text" },
      { key: "cPenangananIkan", label: "Bagaimana penanganan ikan?", type: "textarea" },
      { key: "cSanitasiPenampungan", label: "Bagaimana penerapan sanitasi di tempat penampungan sementara?", type: "textarea" },
      { key: "cJumlahPekerjaPenampungan", label: "Berapa jumlah pekerja ditempat penampungan sementara?", type: "number" },
      { key: "cPenggunaanEsPenampungan", label: "Berapa banyak penggunaan es untuk menampung ikan?", type: "number" },
    ],
  },
  {
    code: "D",
    title: "Media Pengangkut Ikan",
    rows: [
      { key: "dCaraIkanDiangkut", label: "Bagaimana Ikan diangkut dan dibawa ke Unit Pengolahan?", type: "textarea" },
      { key: "dKapasitasSekaliAngkutMin", label: "Berapa Kapasitas sekali angkut?", type: "number", rangeWith: "dKapasitasSekaliAngkutMax" },
      { key: "dKondisiSanitasiMedia", label: "Bagaimana kondisi Sanitasi Media Pengangkut Ikan?", type: "textarea" },
      { key: "dLamaMuatAngkutBongkarMin", label: "Berapa lama proses Muat, Angkut dan Bongkar menuju Unit Pengolahan?", type: "number", rangeWith: "dLamaMuatAngkutBongkarMax" },
      { key: "dTenagaProsesPengangkutan", label: "Berapa banyak tenaga yang digunakan untuk proses pengangkutan?", type: "number" },
    ],
  },
];

export function ViewSupplierAuditModal({
  supplier,
  onClose,
  onSaved,
}: {
  supplier: SupplierData;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [audit, setAudit] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!supplier.auditId) return;
    (async () => {
      try {
        const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(
          `/v1/supplier-audits/${supplier.auditId}`
        );
        setAudit(data.data);
        setEditValues({ ...data.data });
      } catch {
        setError("Gagal memuat data audit");
      } finally {
        setLoading(false);
      }
    })();
  }, [supplier.auditId]);

  function setVal(key: string, value: unknown) {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaveMsg(null);
    try {
      const body: Record<string, unknown> = {};
      for (const sec of AUDIT_SECTIONS) {
        for (const row of sec.rows) {
          body[row.key] = editValues[row.key] ?? null;
          if (row.rangeWith) body[row.rangeWith] = editValues[row.rangeWith] ?? null;
        }
      }
      body.tanggalInspeksi = editValues.tanggalInspeksi;
      await apiClient.put(`/v1/supplier-audits/${supplier.auditId}`, body);
      setAudit({ ...editValues });
      setEditing(false);
      setSaveMsg("Audit berhasil diperbarui");
      onSaved?.();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax.response?.data?.message || "Gagal menyimpan audit");
    } finally {
      setSaving(false);
    }
  }

  function displayVal(val: unknown): string {
    if (val === true) return "Ya";
    if (val === false) return "Tidak";
    if (val == null || val === "") return "—";
    return String(val);
  }

  const inputCls =
    "w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-section dark:text-gray-100 px-2 py-1 text-sm focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan/20";

  function renderEditCell(row: AuditRow) {
    const val = editValues[row.key];
    if (row.type === "boolean") {
      return (
        <select value={val == null ? "" : String(val)} onChange={(e) => setVal(row.key, e.target.value === "true")} className={inputCls}>
          <option value="true">Ya</option>
          <option value="false">Tidak</option>
        </select>
      );
    }
    if (row.rangeWith) {
      return (
        <div className="flex gap-1 items-center">
          <input type="number" min={0} value={val == null ? "" : String(val)} onChange={(e) => setVal(row.key, e.target.value ? Number(e.target.value) : null)} className={inputCls + " w-20"} placeholder="Min" />
          <span className="text-gray-400 text-xs">s/d</span>
          <input type="number" min={0} value={editValues[row.rangeWith] == null ? "" : String(editValues[row.rangeWith])} onChange={(e) => setVal(row.rangeWith!, e.target.value ? Number(e.target.value) : null)} className={inputCls + " w-20"} placeholder="Max" />
        </div>
      );
    }
    if (row.type === "textarea") {
      return <textarea rows={2} value={val == null ? "" : String(val)} onChange={(e) => setVal(row.key, e.target.value)} className={inputCls} />;
    }
    if (row.type === "number") {
      return <input type="number" min={0} value={val == null ? "" : String(val)} onChange={(e) => setVal(row.key, e.target.value ? Number(e.target.value) : null)} className={inputCls} />;
    }
    return <input type="text" value={val == null ? "" : String(val)} onChange={(e) => setVal(row.key, e.target.value)} className={inputCls} />;
  }

  function renderViewCell(row: AuditRow) {
    if (!audit) return "—";
    const val = audit[row.key];
    if (row.rangeWith) {
      const min = displayVal(val);
      const max = displayVal(audit[row.rangeWith]);
      return `${min} s/d ${max}`;
    }
    return displayVal(val);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-4xl rounded-xl bg-white dark:bg-dark-card shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">✕</button>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Audit Supplier</h2>
          <div className="mt-2 flex gap-8 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Nama Supplier : </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{supplier.supplierName}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Tanggal Inspeksi : </span>
              {editing ? (
                <input type="date" value={editValues.tanggalInspeksi ? String(editValues.tanggalInspeksi).slice(0, 10) : ""} onChange={(e) => setVal("tanggalInspeksi", e.target.value)} className="inline rounded border border-gray-300 dark:border-gray-600 dark:bg-dark-section dark:text-gray-100 px-2 py-0.5 text-sm" />
              ) : (
                <span className="font-medium text-gray-900 dark:text-gray-100">{audit?.tanggalInspeksi ? String(audit.tanggalInspeksi) : "—"}</span>
              )}
            </div>
          </div>
        </div>

        {loading && <div className="px-6 py-8 text-sm text-gray-400">Memuat audit…</div>}
        {error && <div className="mx-6 mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">{error}</div>}
        {saveMsg && <div className="mx-6 mt-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">{saveMsg}</div>}

        {audit && (
          <div className="flex-1 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-section sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-400 w-12 border-b border-gray-200 dark:border-gray-700">NO</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">ITEM INSPEKSI</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-400 w-[280px] border-b border-gray-200 dark:border-gray-700">CATATAN</th>
                </tr>
              </thead>
              <tbody>
                {AUDIT_SECTIONS.map((sec) => (
                  <Fragment key={`sec-${sec.code}`}>
                    <tr className="bg-gray-100 dark:bg-dark-section/60">
                      <td className="px-4 py-2 font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">{sec.code}</td>
                      <td colSpan={2} className="px-4 py-2 font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">{sec.title}</td>
                    </tr>
                    {sec.rows.map((row, ri) => (
                      <tr key={row.key} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 text-center align-top">{ri + 1}.</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-top">{row.label}</td>
                        <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 align-top">
                          {editing ? renderEditCell(row) : (
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{renderViewCell(row)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="shrink-0 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setEditValues({ ...audit! }); setError(null); }} className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving} className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-hover disabled:opacity-50">
                {saving ? "Menyimpan…" : "Simpan Perubahan"}
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">
                Tutup
              </button>
              {audit && (
                <button onClick={() => setEditing(true)} className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-hover inline-flex items-center gap-1.5">
                  <HiOutlinePencilSquare className="h-4 w-4" /> Edit Audit
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
