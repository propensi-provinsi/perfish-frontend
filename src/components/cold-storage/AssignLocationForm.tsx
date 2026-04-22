"use client";

import { useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/api";
import Button from "@/components/ui/Button";
import { getColdStorages } from "@/lib/expiry";
import { assignLocation, getAssignLocationContext, listStorageAreaOptions } from "@/lib/coldstorage-api";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import type { ApiResponse, ColdStorageData } from "@/types";
import type {
  AssignLocationRequest,
  StorageAreaOption,
} from "@/types/coldstorage";

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
  const [coldStorages, setColdStorages] = useState<ColdStorageData[]>([]);
  const [batches, setBatches] = useState<MasterBatchOption[]>([]);

  const [batchId, setBatchId] = useState<number | "">("");
  const [warehouseId, setWarehouseId] = useState<number | "">("");
  const [storageAreaId, setStorageAreaId] = useState<number | "">("");
  const [storageAreas, setStorageAreas] = useState<StorageAreaOption[]>([]);
  const [tanggalMasuk, setTanggalMasuk] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [warehouseLocked, setWarehouseLocked] = useState(false);
  /** yyyy-MM-dd — batas minimum tanggal masuk jika batch punya inbound */
  const [inboundReceiptDate, setInboundReceiptDate] = useState<string | null>(null);

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
          apiClient.get<ApiResponse<MasterBatchOption[]>>("/v1/coldstorage/assignable-batches"),
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

  useEffect(() => {
    async function applyBatchContext() {
      if (!batchId) {
        setWarehouseLocked(false);
        setWarehouseId("");
        setStorageAreas([]);
        setStorageAreaId("");
        setInboundReceiptDate(null);
        return;
      }
      try {
        const ctx = await getAssignLocationContext(Number(batchId));
        setWarehouseLocked(ctx.warehouseLocked);
        setInboundReceiptDate(ctx.inboundReceiptDate ?? null);
        if (ctx.warehouseLocked && ctx.inboundColdStorageId != null) {
          setWarehouseId(ctx.inboundColdStorageId);
        } else if (!ctx.warehouseLocked) {
          setWarehouseId("");
        }
        setStorageAreaId("");
      } catch (err) {
        setWarehouseLocked(false);
        setInboundReceiptDate(null);
        setError(err instanceof Error ? err.message : "Gagal memuat konteks batch");
      }
    }
    void applyBatchContext();
  }, [batchId]);

  useEffect(() => {
    async function loadStorageAreas() {
      if (!warehouseId || !batchId) {
        setStorageAreas([]);
        setStorageAreaId("");
        return;
      }
      try {
        const options = await listStorageAreaOptions(Number(warehouseId), Number(batchId));
        setStorageAreas(options);
        setStorageAreaId("");
      } catch (err) {
        setStorageAreas([]);
        setStorageAreaId("");
        setError(err instanceof Error ? err.message : "Gagal memuat master storage area");
      }
    }
    void loadStorageAreas();
  }, [warehouseId, batchId]);

  const canSubmit = useMemo(
    () => !!batchId && !!warehouseId && !!storageAreaId && !!tanggalMasuk && !submitting,
    [batchId, warehouseId, storageAreaId, tanggalMasuk, submitting]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    if (inboundReceiptDate && tanggalMasuk < inboundReceiptDate) {
      setError(
        `Tanggal masuk tidak boleh sebelum tanggal penerimaan inbound (${inboundReceiptDate}).`
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: AssignLocationRequest = {
        batchId: Number(batchId),
        warehouseId: Number(warehouseId),
        storageAreaId: Number(storageAreaId),
        tanggalMasuk,
        notes: notes.trim() || undefined,
      };
      const response = await assignLocation(payload);
      setSuccess(
        `Lokasi berhasil disimpan untuk batch ${response.batchNumber} di ${response.warehouseCode} — ${response.warehouseName}.`
      );
      setBatchId("");
      setWarehouseId("");
      setWarehouseLocked(false);
      setInboundReceiptDate(null);
      setStorageAreaId("");
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
      <header>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Penentuan Lokasi Penyimpanan Batch</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Menetapkan area penyimpanan pada batch
        </p>
      </header>
      <ColdStorageModuleNav />

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
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Batch <span className="text-red-500">*</span>
            </label>
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
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Gudang <span className="text-red-500">*</span>
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              disabled={loading || warehouseLocked}
              required
            >
              <option value="">Pilih gudang aktif...</option>
              {coldStorages.map((cs) => (
                <option key={cs.coldStorageId} value={cs.coldStorageId}>
                  {cs.csCode} — {cs.csName} ({cs.branchCode})
                </option>
              ))}
            </select>
            {warehouseLocked && (
              <p className="mt-1 text-xs text-gray-500">
                Gudang mengikuti cold storage pada penerimaan inbound. Perubahan gudang dilakukan melalui menu Pemindahan
                Batch.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Storage Area <span className="text-red-500">*</span>
            </label>
            <select
              value={storageAreaId}
              onChange={(e) => setStorageAreaId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              required
              disabled={!warehouseId || !batchId || loading}
            >
              <option value="">
                {warehouseId ? "Pilih storage area..." : "Pilih gudang terlebih dahulu"}
              </option>
              {storageAreas.map((area) => (
                <option key={area.positionId} value={area.positionId}>
                  {area.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Tanggal Masuk <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={tanggalMasuk}
              min={inboundReceiptDate ?? undefined}
              onChange={(e) => setTanggalMasuk(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              required
            />
            {inboundReceiptDate && (
              <p className="mt-1 text-xs text-gray-500">
                Minimal mengikuti tanggal penerimaan inbound: <b>{inboundReceiptDate}</b>.
              </p>
            )}
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
            placeholder="Keterangan tambahan"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="submit"
            disabled={!canSubmit}
            className="bg-cyan text-white hover:bg-cyan-hover focus:ring-cyan/40"
          >
            {submitting ? "Menyimpan..." : "Simpan Lokasi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
