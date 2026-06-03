"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import SearchableSelect from "@/components/ui/SearchableSelect";
import ConfirmActionModal from "@/components/cold-storage/ConfirmActionModal";
import { getColdStorages } from "@/lib/expiry";
import {
  assignLocation,
  getAssignLocationContext,
  listLoadingBayBatches,
  listStorageAreaOptions,
} from "@/lib/coldstorage-api";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import { alertErrorClass, alertSuccessClass, inputClass, labelClass } from "@/lib/coldstorage-ui";
import type { ColdStorageData } from "@/types";
import type {
  AssignLocationRequest,
  LoadingBayBatchRow,
  StorageAreaOption,
} from "@/types/coldstorage";

export default function AssignLocationForm() {
  const searchParams = useSearchParams();
  const [coldStorages, setColdStorages] = useState<ColdStorageData[]>([]);
  const [batches, setBatches] = useState<LoadingBayBatchRow[]>([]);

  const [batchId, setBatchId] = useState<number | "">("");
  const [warehouseId, setWarehouseId] = useState<number | "">("");
  const [storageAreaId, setStorageAreaId] = useState<number | "">("");
  const [storageAreas, setStorageAreas] = useState<StorageAreaOption[]>([]);
  const [tanggalMasuk, setTanggalMasuk] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [warehouseLocked, setWarehouseLocked] = useState(false);
  const [inboundReceiptDate, setInboundReceiptDate] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const batchOptions = useMemo(
    () =>
      batches.map((b) => ({
        value: String(b.batchId),
        label: `${b.batchNumber}${b.fishSpeciesName ? ` — ${b.fishSpeciesName}` : ""}`,
        searchText: `${b.batchNumber} ${b.fishSpeciesName ?? ""}`,
      })),
    [batches]
  );

  const storageAreaOptions = useMemo(
    () =>
      storageAreas.map((area) => ({
        value: String(area.positionId),
        label: area.displayName,
        searchText: area.displayName,
      })),
    [storageAreas]
  );

  useEffect(() => {
    const q = searchParams.get("batchId");
    if (q) {
      const id = Number(q);
      if (Number.isFinite(id) && id > 0) {
        setBatchId(id);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      try {
        const [coldStorageData, batchRows] = await Promise.all([
          getColdStorages(),
          listLoadingBayBatches(),
        ]);
        setColdStorages(coldStorageData.filter((cs) => cs.isActive));
        setBatches(batchRows);
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

  async function doSubmit() {
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
      try {
        setBatches(await listLoadingBayBatches());
      } catch {
        /* daftar loading bay opsional di-refresh */
      }
    } catch (err) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiMessage ?? (err instanceof Error ? err.message : "Gagal menyimpan lokasi batch"));
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setConfirmOpen(true);
  }

  const selectedBatchLabel = batchOptions.find((o) => o.value === String(batchId))?.label ?? "";
  const selectedAreaLabel = storageAreaOptions.find((o) => o.value === String(storageAreaId))?.label ?? "";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Penentuan Lokasi Cold Storage</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
          Menetapkan posisi rack pada batch yang saat ini berada di loading bay
        </p>
      </header>
      <ColdStorageModuleNav />

      {error && <div className={alertErrorClass}>{error}</div>}
      {success && <div className={alertSuccessClass}>{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>
              Batch <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={batchOptions}
              value={batchId === "" ? "" : String(batchId)}
              onChange={(v) => setBatchId(v === "" ? "" : Number(v))}
              disabled={loading}
              placeholder={loading ? "Memuat…" : "Pilih batch..."}
              emptyMessage="Batch tidak ditemukan"
            />
          </div>

          <div>
            <label className={labelClass}>
              Gudang <span className="text-red-500">*</span>
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : "")}
              className={inputClass}
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
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Gudang mengikuti cold storage pada penerimaan inbound. Perubahan gudang dilakukan melalui menu Pemindahan
                Batch.
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Storage Area <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={storageAreaOptions}
              value={storageAreaId === "" ? "" : String(storageAreaId)}
              onChange={(v) => setStorageAreaId(v === "" ? "" : Number(v))}
              disabled={!warehouseId || !batchId || loading}
              placeholder={warehouseId ? "Pilih storage area..." : "Pilih gudang terlebih dahulu"}
              emptyMessage="Storage area tidak ditemukan"
            />
          </div>

          <div>
            <label className={labelClass}>
              Tanggal Masuk <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={tanggalMasuk}
              min={inboundReceiptDate ?? undefined}
              onChange={(e) => setTanggalMasuk(e.target.value)}
              className={inputClass}
              required
            />
            {inboundReceiptDate && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Minimal mengikuti tanggal penerimaan inbound: <b>{inboundReceiptDate}</b>.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Catatan (opsional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            className={inputClass}
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

      {confirmOpen && (
        <ConfirmActionModal
          title="Simpan Lokasi Batch"
          message={`Yakin menyimpan lokasi untuk batch ${selectedBatchLabel} ke ${selectedAreaLabel}?`}
          confirmLabel="Simpan"
          busy={submitting}
          onConfirm={() => void doSubmit()}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
