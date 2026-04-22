"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import { listBatchMoveHistory } from "@/lib/coldstorage-api";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import type { ApiResponse } from "@/types";
import type { AssignLocationResponse } from "@/types/coldstorage";

interface MasterBatchOption {
  batchId: number;
  batchNumber: string;
  fishSpeciesName?: string;
  status?: string;
}

export default function BatchHistoryPanel() {
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [batches, setBatches] = useState<MasterBatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | "">("");
  const [historyData, setHistoryData] = useState<AssignLocationResponse[] | null>(null);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      setError(null);
      try {
        const batchResp = await apiClient.get<ApiResponse<MasterBatchOption[]>>("/v1/batch/master-batches");
        setBatches(batchResp.data.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data batch");
      } finally {
        setLoading(false);
      }
    }
    void bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedBatchId) {
      setHistoryData(null);
      return;
    }

    async function loadHistory() {
      setLoadingHistory(true);
      setError(null);
      try {
        const data = await listBatchMoveHistory(Number(selectedBatchId));
        setHistoryData(data);
      } catch (err) {
        setHistoryData(null);
        setError(err instanceof Error ? err.message : "Gagal memuat histori perpindahan");
      } finally {
        setLoadingHistory(false);
      }
    }
    void loadHistory();
  }, [selectedBatchId]);

  return (
    <div className="space-y-6">
      <header>
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Histori Perpindahan Batch</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Audit perpindahan lokasi batch secara kronologis.
          </p>
        </div>
      </header>
      <ColdStorageModuleNav />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Pilih Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              disabled={loading}
            >
              <option value="">Pilih batch...</option>
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchNumber}
                  {b.fishSpeciesName ? ` - ${b.fishSpeciesName}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        {!selectedBatchId ? (
          <p className="text-sm text-gray-500">Pilih batch untuk melihat histori perpindahan.</p>
        ) : loadingHistory ? (
          <p className="text-sm text-gray-500">Memuat histori perpindahan...</p>
        ) : historyData && historyData.length > 0 ? (
          <>
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <Info label="Total Perpindahan" value={String(historyData.length)} />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-[13px]">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700">
                    <th className="px-3 py-2">Waktu</th>
                    <th className="px-3 py-2">Batch</th>
                    <th className="px-3 py-2">Gudang / Area</th>
                    <th className="px-3 py-2">Umur Simpan</th>
                    <th className="px-3 py-2">Status Lokasi</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((row) => (
                    <tr key={row.locationId} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2">{new Date(row.createdAt).toLocaleString("id-ID")}</td>
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{row.batchNumber}</td>
                      <td className="px-3 py-2">
                        {row.warehouseCode} - {row.warehouseName}
                        <div className="text-xs text-gray-500">{row.storageArea}</div>
                      </td>
                      <td className="px-3 py-2">{row.umurSimpanDays ?? "-"} hari</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            row.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {row.isActive ? "Aktif" : "Riwayat"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">Belum ada histori perpindahan untuk batch ini.</p>
        )}
      </section>

      <p className="text-xs text-gray-500">
        Histori perpindahan bersifat read-only: data tidak dapat diedit atau dihapus permanen dari halaman ini.
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
