"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { useMasterBatch } from "@/hooks/useMasterBatch";
import { useBatchTraceability } from "@/hooks/useBatchTraceability";
import TraceabilityGraph from "./TraceabilityGraph"
import { FiSearch, FiLayers } from "react-icons/fi";

export default function BatchTraceabilityPage() {
  const { data: masterBatches = [] } = useMasterBatch();
  const { data, loading, fetchTraceability, error } = useBatchTraceability();
  
  const [selectedBatchId, setSelectedBatchId] = useState<number | "">("");

  const handleSearch = () => {
    if (selectedBatchId) {
      fetchTraceability(Number(selectedBatchId));
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-6 h-full flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
              <FiLayers className="text-blue-600" /> Batch Traceability
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Lacak pergerakan silsilah (lineage) produk ikan dari suplai hingga terjual.</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100/50 dark:border-gray-700/50 p-6 mb-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1 max-w-sm">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pilih Master Batch / Batch Code</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 transition-all font-medium text-gray-900 dark:text-white"
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">-- Pilih Batch --</option>
                  {masterBatches.map(b => (
                    <option key={b.batchId} value={b.batchId}>{b.batchNumber} - {b.fishSpeciesName}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleSearch}
                disabled={!selectedBatchId || loading}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                {loading ? "Mencari..." : <><FiSearch /> Lacak Silsilah</>}
              </button>
            </div>
            
            {error && <div className="mt-4 p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">{error}</div>}
          </div>

          <div className="w-full h-[600px] bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-inner border border-gray-100 dark:border-gray-700 overflow-hidden relative">
            {data ? (
              <TraceabilityGraph data={data} key={selectedBatchId} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <div className="w-24 h-24 mb-4 opacity-50">
                   <FiLayers size={96} strokeWidth={1} />
                </div>
                <p className="text-lg font-medium">Pilih Master Batch di atas untuk menampilkan struktur Linage Graph.</p>
              </div>
            )}
          </div>

          {/* EVENT LOGS SCROLLABLE SECTION */}
          {data && data.eventLogs && data.eventLogs.length > 0 && (
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Riwayat Mutasi Spesifik Batch</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700/50">
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipe Aksi</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Pelaksana</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Detail Perubahan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {data.eventLogs.map((log) => (
                      <tr key={log.logId} className="hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors">
                        <td className="p-4 text-sm whitespace-nowrap text-gray-600 dark:text-gray-300">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString("id-ID") : "-"}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {log.actionType}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                          {log.actorName || "SYSTEM"}
                        </td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400 max-w-sm truncate" title={`Old: ${log.oldValue} -> New: ${log.newValue}`}>
                          <span className="font-medium">{log.fieldName}</span> diubah dari <span className="line-through">{log.oldValue || 'kosong'}</span> menjadi <span className="font-semibold text-gray-800 dark:text-gray-200">{log.newValue}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
