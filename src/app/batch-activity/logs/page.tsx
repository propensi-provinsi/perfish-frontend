"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { getAuditLogs, type AuditLogQuery } from "@/lib/audit-api";
import { canAccessBatchActivity } from "@/lib/rbac";
import type { AuditLogData } from "@/types";
import { FiFilter, FiSearch, FiX, FiCheck, FiInfo } from "react-icons/fi";

export default function BatchActivityLogsPage() {
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionType, setActionType] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [keyword, setKeyword] = useState("");
  // Note: For real backend date filters we'd pass them. We'll simplify to local string match for keyword over entityId.
  
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLogData | null>(null);

  const fetchLogs = async (currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const query: AuditLogQuery = {
        entityType: "MASTER_BATCH",
        page: currentPage,
        size: 20,
        sort: `timestamp,${sortOrder}`,
      };
      if (actionType) query.actionType = actionType;
      const res = await getAuditLogs(query);
      setLogs(res.content || []);
      setTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).message || "Gagal memuat activity log batch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, actionType, sortOrder]);

  const filteredLogs = useMemo(() => {
    if (!keyword) return logs;
    return logs.filter(l => 
      (l.entityId && l.entityId.toLowerCase().includes(keyword.toLowerCase())) ||
      (l.userName && l.userName.toLowerCase().includes(keyword.toLowerCase()))
    );
  }, [logs, keyword]);

  return (
    <ProtectedRoute authorize={canAccessBatchActivity}>
      <AppShell>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              Batch Activity Logs
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Pantau dan lacak secara mendetail aktivitas mutasi, perubahan grade, hingga update harga batch ikan.</p>
          </div>

          {/* FILTER BAR SECTION */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                 <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input 
                   type="text" 
                   placeholder="Cari Batch Number atau User Pelaksana..." 
                   className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 font-medium"
                   value={keyword}
                   onChange={e => setKeyword(e.target.value)}
                 />
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <select 
                  value={actionType} onChange={e => {setActionType(e.target.value); setPage(0);}}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 font-medium text-gray-700 dark:text-gray-200"
                >
                  <option value="">Semua Tipe Aksi</option>
                  <option value="MASTER_DATA_CHANGE">Master Data Change</option>
                  <option value="WEIGHT_CORRECTION">Weight Correction</option>
                  <option value="STATUS_UPDATE">Status Update</option>
                  <option value="EXPIRY_UPDATE">Expiry Update</option>
                </select>
                <select 
                  value={sortOrder} onChange={e => {setSortOrder(e.target.value); setPage(0);}}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 font-medium text-gray-700 dark:text-gray-200"
                >
                  <option value="desc">Terbaru</option>
                  <option value="asc">Terlama</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLE LOGS */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              {error && <div className="p-4 text-red-500 bg-red-50 border-b border-red-100">{error}</div>}
              
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 border-b border-gray-100 dark:border-gray-700/50">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Batch ID / Ref</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tipe Aksi</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User / System</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {loading && filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-500 animate-pulse font-medium">Memuat history log...</td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-500">
                         <div className="flex flex-col items-center justify-center opacity-50">
                            <FiFilter size={48} className="mb-4" />
                            <p>Tidak ada log ditemukan untuk filter ini.</p>
                         </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer" onClick={() => setSelectedLog(log)}>
                        <td className="p-4 text-sm font-semibold whitespace-nowrap text-gray-600 dark:text-gray-300">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString("id-ID") : "-"}
                        </td>
                        <td className="p-4 text-sm font-bold text-blue-600 dark:text-blue-400">
                          {log.entityName || log.entityId}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md shadow-sm border ${
                            log.actionType === 'WEIGHT_CORRECTION' ? 'bg-orange-50 border-orange-200 text-orange-700' : 
                            log.actionType === 'STATUS_UPDATE' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                            'bg-blue-50 border-blue-200 text-blue-700'
                          }`}>
                            {log.actionType}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {log.userName || "SYSTEM AUTO"}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-blue-600 bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                            onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                          >
                            <FiInfo /> Lihat Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Halaman {page + 1} dari {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0 || loading}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-1.5 bg-white border border-gray-200 shadow-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-semibold"
                >
                  Sebelumnya
                </button>
                <button
                  disabled={page >= totalPages - 1 || loading}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-1.5 bg-white border border-gray-200 shadow-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-semibold"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppShell>

      {/* DETAIL MODAL DIALOG */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <FiInfo className="text-blue-500" /> Detail Perubahan Log
              </h2>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50/50 dark:bg-gray-900/20 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Batch / Entitas</div>
                  <div className="font-bold text-gray-900 dark:text-white">{selectedLog.entityName || selectedLog.entityId}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Pengubah</div>
                  <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    {selectedLog.userName ? <><FiCheck className="text-green-500" /> {selectedLog.userName}</> : "SYSTEM AUTOMATION"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Waktu Kejadian</div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">{selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString("id-ID") : "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Tipe Tindakan</div>
                  <div className="font-bold text-blue-600 dark:text-blue-400">{selectedLog.actionType}</div>
                </div>
              </div>

              {(selectedLog.reason || selectedLog.metadata) && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  {selectedLog.reason && (
                    <div className="mb-3 last:mb-0">
                      <div className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-1">Alasan / Remarks</div>
                      <div className="text-sm font-medium text-amber-900 dark:text-amber-200">{selectedLog.reason}</div>
                    </div>
                  )}
                  {selectedLog.metadata && (
                    <div className="mb-3 last:mb-0">
                      <div className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-1">Metadata Konteks</div>
                      <div className="text-sm font-mono bg-white/50 dark:bg-black/20 p-2 rounded border border-amber-200/50 mt-1 break-all">
                        {selectedLog.metadata}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                  Rincian Modifikasi
                </h3>
                
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                   <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 font-bold text-sm text-gray-700 dark:text-gray-300">
                     Field: {selectedLog.fieldName}
                   </div>
                   <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                     <div className="p-4 bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50 transition-colors">
                       <div className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Nilai Lama (Old)</div>
                       <div className="text-sm text-gray-800 dark:text-gray-300 break-words font-mono opacity-80 line-through">
                         {selectedLog.oldValue || <span className="text-gray-400 italic font-sans">[Kosong]</span>}
                       </div>
                     </div>
                     <div className="p-4 bg-green-50/50 dark:bg-green-900/10 hover:bg-green-50 transition-colors">
                       <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Nilai Baru (New)</div>
                       <div className="text-sm text-gray-900 dark:text-white break-words font-mono font-medium">
                         {selectedLog.newValue || <span className="text-gray-400 italic font-sans">[Dikosongkan]</span>}
                       </div>
                     </div>
                   </div>
                </div>
              </div>
              
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                Tutup Panel
              </button>
            </div>
          </div>
        </div>
      )}

    </ProtectedRoute>
  );
}
