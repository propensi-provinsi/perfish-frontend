"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { canAccessBatchActivity } from "@/lib/rbac";
import AppShell from "@/components/layout/AppShell";
import { useMasterBatch } from "@/hooks/useMasterBatch";
import { useBatchTraceability } from "@/hooks/useBatchTraceability";
import TraceabilityGraph from "./TraceabilityGraph";
import { FiBox, FiGitBranch, FiLayers, FiSearch } from "react-icons/fi";

type TraceabilityMode = "receiving" | "batch";

function fmtKg(value: number | string | null | undefined) {
  if (value == null || value === "") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);
}

export default function BatchTraceabilityPage() {
  const searchParams = useSearchParams();
  const presetBatchId = searchParams.get("batchId");
  const { data: masterBatches = [] } = useMasterBatch();
  const {
    data,
    receivingGroups,
    loading,
    fetchTraceability,
    fetchReceivingGroups,
    fetchReceivingGroupTraceability,
    error,
  } = useBatchTraceability();

  const [mode, setMode] = useState<TraceabilityMode>("receiving");
  const [selectedBatchId, setSelectedBatchId] = useState<number | "">("");
  const [selectedReceiptId, setSelectedReceiptId] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    void fetchReceivingGroups();
  }, [fetchReceivingGroups]);

  useEffect(() => {
    const id = presetBatchId ? Number(presetBatchId) : NaN;
    if (!Number.isFinite(id) || id <= 0) return;
    setMode("batch");
    setSelectedBatchId(id);
    void fetchTraceability(id);
  }, [presetBatchId, fetchTraceability]);

  const filteredBatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return masterBatches;
    return masterBatches.filter((b) =>
      [b.batchNumber, b.fishSpeciesName, b.supplierName, b.inboundReceiptCode, b.kandangMacanCode, b.fishSkuCode]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [masterBatches, search]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return receivingGroups;
    return receivingGroups.filter((g) =>
      [g.receiptCode, g.supplierName, g.status, ...(g.speciesNames ?? [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [receivingGroups, search]);

  const handleSearch = () => {
    if (mode === "receiving" && selectedReceiptId) {
      void fetchReceivingGroupTraceability(selectedReceiptId);
    }
    if (mode === "batch" && selectedBatchId) {
      void fetchTraceability(Number(selectedBatchId));
    }
  };

  return (
    <ProtectedRoute authorize={canAccessBatchActivity}>
      <AppShell>
        <div className="flex h-full flex-col p-6">
          <div className="mb-6">
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              <FiLayers className="text-blue-600" /> Batch Traceability
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Lacak alur penerimaan sebagai kelompok utama, lalu drill-down ke batch/kandang macan.
            </p>
          </div>

          <div className="mb-6 rounded-2xl border border-gray-100/50 bg-white/80 p-6 shadow-lg backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-800/80">
            <div className="mb-4 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 text-sm font-semibold dark:border-gray-700 dark:bg-gray-900/50">
              <button
                type="button"
                onClick={() => setMode("receiving")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 transition ${
                  mode === "receiving" ? "bg-white text-blue-700 shadow-sm dark:bg-gray-800 dark:text-blue-300" : "text-gray-500"
                }`}
              >
                <FiGitBranch /> Kelompok Penerimaan
              </button>
              <button
                type="button"
                onClick={() => setMode("batch")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 transition ${
                  mode === "batch" ? "bg-white text-blue-700 shadow-sm dark:bg-gray-800 dark:text-blue-300" : "text-gray-500"
                }`}
              >
                <FiBox /> Batch Detail
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] lg:items-end">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Cari</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Receipt, batch, supplier, species..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-medium text-gray-900 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {mode === "receiving" ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Pilih Kelompok Penerimaan / KP</label>
                  <select
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-medium text-gray-900 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={selectedReceiptId}
                    onChange={(e) => setSelectedReceiptId(e.target.value)}
                  >
                    <option value="">-- Pilih Kelompok Penerimaan --</option>
                    {filteredGroups.map((g) => (
                      <option key={g.receiptId} value={g.receiptId}>
                        {g.receiptCode} - {g.supplierName ?? "-"} - {g.batchCount} batch - {fmtKg(g.currentQuantityKg)} kg
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Pilih Master Batch / Kandang Macan</label>
                  <select
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-medium text-gray-900 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">-- Pilih Batch --</option>
                    {filteredBatches.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.batchNumber} - {b.fishSpeciesName} {b.kandangMacanCode ? `(${b.kandangMacanCode})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleSearch}
                disabled={(mode === "receiving" ? !selectedReceiptId : !selectedBatchId) || loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
              >
                {loading ? "Mencari..." : <><FiSearch /> Lacak</>}
              </button>
            </div>

            {error && <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</div>}
          </div>

          <div className="relative h-[620px] w-full overflow-hidden rounded-2xl border border-gray-100 bg-white/50 shadow-inner backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/50">
            {data ? (
              <TraceabilityGraph
                data={data}
                key={mode === "receiving" ? `receiving-${selectedReceiptId}` : `batch-${selectedBatchId}`}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <FiLayers size={96} strokeWidth={1} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">Pilih kelompok penerimaan atau batch untuk menampilkan traceability.</p>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
