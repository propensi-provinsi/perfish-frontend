"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TableListPaginationFooter,
  TableListPaginationToolbar,
  useClientTablePagination,
} from "@/components/ui/TableListPagination";
import { listBatchMoveHistory, listBatchesWithMovementHistory } from "@/lib/coldstorage-api";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import { alertErrorClass, inputClass, labelClass } from "@/lib/coldstorage-ui";
import type { AssignLocationResponse } from "@/types/coldstorage";

interface MasterBatchOption {
  batchId: number;
  batchNumber: string;
  fishSpeciesName?: string | null;
  status?: string;
}

export default function BatchHistoryPanel() {
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [batches, setBatches] = useState<MasterBatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | "">("");
  const [historyData, setHistoryData] = useState<AssignLocationResponse[] | null>(null);

  const historyRows = useMemo(() => historyData ?? [], [historyData]);
  const historyPagination = useClientTablePagination(historyRows, {
    resetDeps: [selectedBatchId],
  });

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      setError(null);
      try {
        const batchList = await listBatchesWithMovementHistory();
        setBatches(batchList);
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

      {error && <div className={alertErrorClass}>{error}</div>}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <label className={labelClass}>Pilih Batch</label>
        <select
          value={selectedBatchId}
          onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : "")}
          className={`max-w-md ${inputClass}`}
          disabled={loading}
        >
          <option value="">{loading ? "Memuat..." : "Pilih batch..."}</option>
          {batches.map((b) => (
            <option key={b.batchId} value={b.batchId}>
              {b.batchNumber}
              {b.fishSpeciesName ? ` — ${b.fishSpeciesName}` : ""}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        {loadingHistory ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Memuat histori...</p>
        ) : !selectedBatchId ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Pilih batch untuk melihat histori perpindahan.</p>
        ) : historyData && historyData.length > 0 ? (
          <>
            <TableListPaginationToolbar
              totalCount={historyPagination.totalCount}
              itemLabel="perpindahan"
              pageSize={historyPagination.pageSize}
              onPageSizeChange={historyPagination.setPageSize}
            />
            <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="py-2 pr-3">Tanggal</th>
                  <th className="py-2 pr-3">Gudang</th>
                  <th className="py-2 pr-3">Area</th>
                  <th className="py-2 pr-3">Tgl Masuk</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {historyPagination.visibleItems.map((h) => (
                  <tr key={h.locationId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-200">
                      {h.createdAt ? new Date(h.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-200">
                      {h.warehouseCode ?? "—"} {h.warehouseName ? `— ${h.warehouseName}` : ""}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-200">{h.storageArea}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-200">{h.tanggalMasuk ?? "—"}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          h.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {h.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-gray-600 dark:text-gray-400">{h.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <TableListPaginationFooter
              page={historyPagination.page}
              totalPages={historyPagination.totalPages}
              totalCount={historyPagination.totalCount}
              onPageChange={historyPagination.setPage}
              show={historyPagination.totalCount > 0}
            />
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada histori perpindahan untuk batch ini.</p>
        )}
      </section>
    </div>
  );
}
