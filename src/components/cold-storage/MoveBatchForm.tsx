"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { getColdStorages } from "@/lib/expiry";
import {
  listActiveLocations,
  listStorageAreaOptions,
  moveBatch,
} from "@/lib/coldstorage-api";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import type { ColdStorageData } from "@/types";
import type {
  AssignLocationResponse,
  MoveBatchRequest,
  StorageAreaOption,
} from "@/types/coldstorage";

export default function MoveBatchForm() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeLocations, setActiveLocations] = useState<AssignLocationResponse[]>([]);
  const [coldStorages, setColdStorages] = useState<ColdStorageData[]>([]);

  const [batchId, setBatchId] = useState<number | "">("");
  const [targetWarehouseId, setTargetWarehouseId] = useState<number | "">("");
  const [targetAreaId, setTargetAreaId] = useState<number | "">("");
  const [targetAreas, setTargetAreas] = useState<StorageAreaOption[]>([]);
  const [notes, setNotes] = useState("");

  const selectedLocation = useMemo(
    () => activeLocations.find((loc) => loc.batchId === Number(batchId)),
    [activeLocations, batchId]
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
        const activeWarehouses = warehouses.filter((cs) => cs.isActive);

        setActiveLocations(locations);
        setColdStorages(activeWarehouses);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data perpindahan batch");
      } finally {
        setLoading(false);
      }
    }
    void bootstrap();
  }, []);

  useEffect(() => {
    setTargetWarehouseId("");
    setTargetAreaId("");
  }, [batchId]);

  useEffect(() => {
    if (!targetWarehouseId || batchId === "") {
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
  }, [selectedLocation?.storageAreaId, targetWarehouseId, batchId]);

  const canSubmit = useMemo(
    () => !!selectedLocation && !!targetAreaId && !submitting,
    [selectedLocation, targetAreaId, submitting]
  );

  async function handleMoveBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLocation || !targetAreaId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: MoveBatchRequest = {
        batch_id: selectedLocation.batchId,
        lokasi_asal: selectedLocation.locationId,
        lokasi_tujuan: Number(targetAreaId),
        notes: notes.trim() || undefined,
      };
      const moved = await moveBatch(payload);
      setSuccess(
        `Batch ${moved.batchNumber} dipindahkan ke ${moved.warehouseTujuanCode} - ${moved.warehouseTujuanName} (${moved.lokasiTujuanLabel}).`
      );
      setNotes("");

      const locations = await listActiveLocations();
      setActiveLocations(locations);

      const refreshed = locations.find((loc) => loc.batchId === selectedLocation.batchId);
      if (!refreshed) {
        setBatchId("");
      }
      setTargetWarehouseId("");
      setTargetAreaId("");
      setTargetAreas([]);
    } catch (err) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiMessage ?? (err instanceof Error ? err.message : "Gagal memindahkan batch"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Pemindahan Batch Antar Gudang</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pilih batch aktif, cek lokasi asal otomatis, lalu pilih lokasi tujuan untuk menyimpan histori perpindahan.
          </p>
        </div>
      </header>
      <ColdStorageModuleNav />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleMoveBatch}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-card"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Batch Aktif</label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              required
              disabled={loading || !activeLocations.length}
            >
              <option value="">Pilih batch...</option>
              {activeLocations.map((loc) => (
                <option key={loc.locationId} value={loc.batchId}>
                  {loc.batchNumber} - {loc.warehouseCode} ({loc.storageArea})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Lokasi Asal</label>
            <input
              value={selectedLocation ? `${selectedLocation.warehouseCode} - ${selectedLocation.warehouseName} (${selectedLocation.storageArea})` : "-"}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-dark-section"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Gudang Tujuan</label>
            <select
              value={targetWarehouseId}
              onChange={(e) => setTargetWarehouseId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
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
            <label className="mb-1 block text-xs font-medium text-gray-500">Storage Area Tujuan</label>
            <select
              value={targetAreaId}
              onChange={(e) => setTargetAreaId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              disabled={!targetWarehouseId || loading || targetAreas.length === 0}
              required
            >
              <option value="">Pilih storage area tujuan...</option>
              {targetAreas.map((area) => (
                <option key={area.positionId} value={area.positionId}>
                  {area.displayName}
                </option>
              ))}
            </select>
            {!loading && targetWarehouseId && targetAreas.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">Tidak ada storage area aktif yang tersedia.</p>
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
            placeholder="Alasan perpindahan batch..."
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!canSubmit}
            className="bg-cyan text-white hover:bg-cyan-hover focus:ring-cyan/40"
          >
            {submitting ? "Memindahkan..." : "Move Batch"}
          </Button>
        </div>
      </form>
    </div>
  );
}
