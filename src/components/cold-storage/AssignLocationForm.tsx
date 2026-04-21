"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import Button from "@/components/ui/Button";
import { getColdStorages } from "@/lib/expiry";
import { assignLocation } from "@/lib/coldstorage-api";
import type { ApiResponse, ColdStorageData } from "@/types";
import type { AssignLocationRequest } from "@/types/coldstorage";

interface MasterBatchOption {
  batchId: number;
  batchNumber: string;
  fishSpeciesName?: string;
  currentQuantity?: number | string;
  unit?: string;
}

/**
 * Form Penentuan Lokasi Penyimpanan Batch (E05-PBI-01).
 *
 * Acceptance criteria yang dicover:
 * - Dropdown hanya menampilkan gudang aktif.
 * - Field area penyimpanan wajib diisi.
 * - Tombol "Simpan Lokasi" aktif jika semua field valid.
 * - Notifikasi sukses muncul setelah berhasil.
 */
export default function AssignLocationForm() {
  const router = useRouter();

  const [coldStorages, setColdStorages] = useState<ColdStorageData[]>([]);
  const [batches, setBatches] = useState<MasterBatchOption[]>([]);

  const [batchId, setBatchId] = useState<number | "">("");
  const [warehouseId, setWarehouseId] = useState<number | "">("");
  const [storageArea, setStorageArea] = useState("");
  const [tanggalMasuk, setTanggalMasuk] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      try {
        const [coldStorageData, batchResp] = await Promise.all([
          getColdStorages(),
          apiClient.get<ApiResponse<MasterBatchOption[]>>("/v1/batch/master-batches"),
        ]);
        setColdStorages(coldStorageData.filter((cs) => cs.isActive));
        setBatches(batchResp.data.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data awal");
      } finally {
        setLoading(false);
      }
    }
    void bootstrap();
  }, []);

  const canSubmit = useMemo(
    () => !!batchId && !!warehouseId && storageArea.trim().length > 0 && !!tanggalMasuk && !submitting,
    [batchId, warehouseId, storageArea, tanggalMasuk, submitting]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: AssignLocationRequest = {
        batchId: Number(batchId),
        warehouseId: Number(warehouseId),
        storageArea: storageArea.trim(),
        tanggalMasuk,
        notes: notes.trim() || undefined,
      };
      const response = await assignLocation(payload);
      setSuccess(
        `Lokasi berhasil disimpan untuk batch ${response.batchNumber} di ${response.warehouseCode} — ${response.warehouseName}.`
      );
      setBatchId("");
      setWarehouseId("");
      setStorageArea("");
      setNotes("");
    } catch (err) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiMessage ?? (err instanceof Error ? err.message : "Gagal menyimpan lokasi batch"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Penentuan Lokasi Penyimpanan Batch</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            E05-PBI-01: Tetapkan gudang dan area penyimpanan pada batch yang aktif.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/cold-storage")}>
          Kembali
        </Button>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Batch</label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              disabled={loading}
              required
            >
              <option value="">Pilih batch...</option>
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchNumber}
                  {b.fishSpeciesName ? ` — ${b.fishSpeciesName}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Gudang (Warehouse ID)</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              disabled={loading}
              required
            >
              <option value="">Pilih gudang aktif...</option>
              {coldStorages.map((cs) => (
                <option key={cs.coldStorageId} value={cs.coldStorageId}>
                  {cs.csCode} — {cs.csName} ({cs.branchCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Storage Area <span className="text-red-500">*</span>
            </label>
            <input
              value={storageArea}
              onChange={(e) => setStorageArea(e.target.value)}
              placeholder="Contoh: Block-A / Rack-01 / Slot-5"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Tanggal Masuk</label>
            <input
              type="date"
              value={tanggalMasuk}
              onChange={(e) => setTanggalMasuk(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Catatan (opsional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
            placeholder="Keterangan tambahan terkait pemindahan..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={!canSubmit}>
            {submitting ? "Menyimpan..." : "Simpan Lokasi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
