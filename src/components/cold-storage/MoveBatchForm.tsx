"use client";

import { useEffect, useMemo, useState } from "react";
import ConfirmActionModal from "@/components/cold-storage/ConfirmActionModal";
import Button from "@/components/ui/Button";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { getColdStorages } from "@/lib/expiry";
import {
  COLD_STORAGE_PENDING_APPROVAL_MSG,
  listActiveLocations,
  listStorageAreaOptions,
  moveBatch,
} from "@/lib/coldstorage-api";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import { alertErrorClass, alertSuccessClass, inputClass, labelClass } from "@/lib/coldstorage-ui";
import type { ColdStorageData } from "@/types";
import type {
  AssignLocationResponse,
  MoveBatchRequest,
  StorageAreaOption,
} from "@/types/coldstorage";

type DestinationType = "LOADING_BAY" | "COLD_STORAGE";

export default function MoveBatchForm() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeLocations, setActiveLocations] = useState<AssignLocationResponse[]>([]);
  const [coldStorages, setColdStorages] = useState<ColdStorageData[]>([]);

  const [batchId, setBatchId] = useState<number | "">("");
  const [destinationType, setDestinationType] = useState<DestinationType>("COLD_STORAGE");
  const [targetWarehouseId, setTargetWarehouseId] = useState<number | "">("");
  const [targetAreaId, setTargetAreaId] = useState<number | "">("");
  const [targetAreas, setTargetAreas] = useState<StorageAreaOption[]>([]);
  const [notes, setNotes] = useState("");

  const selectedLocation = useMemo(
    () => activeLocations.find((loc) => loc.batchId === Number(batchId)),
    [activeLocations, batchId]
  );

  const batchOptions = useMemo(
    () =>
      activeLocations.map((loc) => ({
        value: String(loc.batchId),
        label: `${loc.batchNumber} - ${loc.warehouseCode} (${loc.storageArea})`,
        searchText: `${loc.batchNumber} ${loc.warehouseCode} ${loc.storageArea}`,
      })),
    [activeLocations]
  );

  const targetAreaOptions = useMemo(
    () =>
      targetAreas.map((area) => ({
        value: String(area.positionId),
        label: area.displayName,
        searchText: area.displayName,
      })),
    [targetAreas]
  );

  const targetWarehouses = useMemo(() => {
    const sourceId = selectedLocation?.warehouseId;
    return coldStorages
      .filter((cs) => cs.isActive)
      .filter((cs) => (sourceId ? cs.coldStorageId !== sourceId : true));
  }, [coldStorages, selectedLocation]);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      setError(null);
      try {
        const [locations, warehouses] = await Promise.all([listActiveLocations(), getColdStorages()]);
        setActiveLocations(locations);
        setColdStorages(warehouses.filter((cs) => cs.isActive));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data perpindahan batch");
      } finally {
        setLoading(false);
      }
    }
    void bootstrap();
  }, []);

  useEffect(() => {
    setDestinationType("COLD_STORAGE");
    setTargetWarehouseId("");
    setTargetAreaId("");
  }, [batchId]);

  useEffect(() => {
    if (destinationType !== "COLD_STORAGE" || !targetWarehouseId || batchId === "") {
      setTargetAreas([]);
      setTargetAreaId("");
      return;
    }

    async function loadTargetAreas() {
      try {
        const rows = await listStorageAreaOptions(Number(targetWarehouseId), Number(batchId));
        const sourcePositionId = selectedLocation?.storageAreaId;
        setTargetAreas(rows.filter((area) => area.positionId !== sourcePositionId));
        setTargetAreaId("");
      } catch (err) {
        setTargetAreas([]);
        setTargetAreaId("");
        setError(err instanceof Error ? err.message : "Gagal memuat lokasi tujuan");
      }
    }

    void loadTargetAreas();
  }, [selectedLocation?.storageAreaId, targetWarehouseId, batchId, destinationType]);

  const canSubmit = useMemo(() => {
    if (!selectedLocation || submitting) return false;
    if (destinationType === "LOADING_BAY") return true;
    return !!targetAreaId;
  }, [selectedLocation, targetAreaId, submitting, destinationType]);

  async function doMoveBatch() {
    if (!selectedLocation) return;
    if (destinationType === "COLD_STORAGE" && !targetAreaId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: MoveBatchRequest = {
        batch_id: selectedLocation.batchId,
        lokasi_asal: selectedLocation.locationId,
        destination_type: destinationType,
        lokasi_tujuan: destinationType === "COLD_STORAGE" ? Number(targetAreaId) : undefined,
        notes: notes.trim() || undefined,
      };
      const result = await moveBatch(payload);
      if (result.status === "pending") {
        setSuccess(result.message ?? COLD_STORAGE_PENDING_APPROVAL_MSG);
      } else {
        const moved = result.data;
        setSuccess(
          destinationType === "LOADING_BAY"
            ? `Batch ${moved.batchNumber} dipindahkan ke Loading Bay.`
            : `Batch ${moved.batchNumber} dipindahkan ke ${moved.warehouseTujuanCode} - ${moved.warehouseTujuanName} (${moved.lokasiTujuanLabel}).`
        );
      }
      setNotes("");

      const locations = await listActiveLocations();
      setActiveLocations(locations);
      setBatchId("");
      setTargetWarehouseId("");
      setTargetAreaId("");
      setTargetAreas([]);
    } catch (err) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiMessage ?? (err instanceof Error ? err.message : "Gagal memindahkan batch"));
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  function handleMoveBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setConfirmOpen(true);
  }

  const confirmMessage =
    destinationType === "LOADING_BAY"
      ? `Yakin memindahkan batch ${selectedLocation?.batchNumber ?? ""} ke Loading Bay?`
      : `Yakin memindahkan batch ${selectedLocation?.batchNumber ?? ""} ke storage area tujuan?`;

  return (
    <div className="space-y-6">
      <header>
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Pemindahan Lokasi</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pilih batch aktif, cek lokasi asal otomatis, lalu pilih lokasi tujuan untuk menyimpan histori perpindahan.
          </p>
        </div>
      </header>
      <ColdStorageModuleNav />

      {error && <div className={alertErrorClass}>{error}</div>}
      {success && <div className={alertSuccessClass}>{success}</div>}

      <form
        onSubmit={handleMoveBatch}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-card"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>
              Batch<span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={batchOptions}
              value={batchId === "" ? "" : String(batchId)}
              onChange={(v) => setBatchId(v === "" ? "" : Number(v))}
              disabled={loading || !activeLocations.length}
              placeholder={loading ? "Memuat…" : "Pilih batch..."}
              emptyMessage="Batch tidak ditemukan"
            />
          </div>

          <div>
            <label className={labelClass}>Lokasi Asal</label>
            <input
              value={
                selectedLocation
                  ? `${selectedLocation.warehouseCode} - ${selectedLocation.warehouseName} (${selectedLocation.storageArea})`
                  : "—"
              }
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-dark-section dark:text-gray-200"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>
              Lokasi Pemindahan<span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-6 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="radio"
                  name="destinationType"
                  checked={destinationType === "LOADING_BAY"}
                  onChange={() => {
                    setDestinationType("LOADING_BAY");
                    setTargetWarehouseId("");
                    setTargetAreaId("");
                  }}
                  disabled={!selectedLocation}
                />
                Loading Bay
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="radio"
                  name="destinationType"
                  checked={destinationType === "COLD_STORAGE"}
                  onChange={() => setDestinationType("COLD_STORAGE")}
                  disabled={!selectedLocation}
                />
                Cold Storage
              </label>
            </div>
          </div>

          {destinationType === "COLD_STORAGE" && (
            <>
              <div>
                <label className={labelClass}>
                  Gudang Tujuan<span className="text-red-500">*</span>
                </label>
                <select
                  value={targetWarehouseId}
                  onChange={(e) => setTargetWarehouseId(e.target.value ? Number(e.target.value) : "")}
                  className={inputClass}
                  disabled={!selectedLocation || loading}
                  required
                >
                  <option value="">Pilih gudang tujuan...</option>
                  {targetWarehouses.map((cs) => (
                    <option key={cs.coldStorageId} value={cs.coldStorageId}>
                      {cs.csCode} - {cs.csName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Storage Area Tujuan<span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={targetAreaOptions}
                  value={targetAreaId === "" ? "" : String(targetAreaId)}
                  onChange={(v) => setTargetAreaId(v === "" ? "" : Number(v))}
                  disabled={!targetWarehouseId || loading || targetAreas.length === 0}
                  placeholder="Pilih storage area tujuan..."
                  emptyMessage="Storage area tidak ditemukan"
                />
                {!loading && targetWarehouseId && targetAreas.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Tidak ada storage area aktif yang tersedia.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div>
          <label className={labelClass}>Catatan (opsional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            className={inputClass}
            placeholder="Alasan perpindahan batch..."
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!canSubmit}
            className="bg-cyan text-white hover:bg-cyan-hover focus:ring-cyan/40"
          >
            {submitting ? "Memindahkan..." : "Pindahkan Lokasi"}
          </Button>
        </div>
      </form>

      {confirmOpen && (
        <ConfirmActionModal
          title="Pindahkan Lokasi Batch"
          message={confirmMessage}
          confirmLabel="Pindahkan"
          busy={submitting}
          onConfirm={() => void doMoveBatch()}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
