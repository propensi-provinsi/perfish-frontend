"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import apiClient from "@/lib/api";
import type { ApiResponse, SupplierData } from "@/types";
import {
  type InboundReceiptRow,
  type InboundStatusFilter,
  getInboundReceipts,
  isInputInProgressStatus,
  inboundStatusDisplayLabel,
} from "@/lib/inbound-api";
import {
  TableListPaginationFooter,
  TableListPaginationToolbar,
  useClientTablePagination,
} from "@/components/ui/TableListPagination";

const STATUS_OPTIONS: Array<{ value: InboundStatusFilter; label: string }> = [
  { value: "", label: "Semua Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "INPUT_IN_PROGRESS", label: "Input In Progress" },
  { value: "PENDING", label: "Waiting for Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function InboundHistoryPage() {
  return (
    <ProtectedRoute allowedRoles={["WAREHOUSE_ADMIN", "KEPALA_CABANG", "SUPERADMIN", "SBB_STAFF"]}>
      <AppShell>
        <InboundHistoryContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function InboundHistoryContent() {
  const [rows, setRows] = useState<InboundReceiptRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<InboundStatusFilter>("");
  const [supplierId, setSupplierId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInboundReceipts({
        supplierId: supplierId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const filtered = !status
        ? data
        : status === "INPUT_IN_PROGRESS"
          ? data.filter((r) => isInputInProgressStatus(r.status))
          : data.filter((r) => r.status === status);
      setRows(filtered);
    } finally {
      setLoading(false);
    }
  }, [status, supplierId, startDate, endDate]);

  useEffect(() => { void load(); }, [load]);

  const pagination = useClientTablePagination(rows, {
    resetDeps: [status, supplierId, startDate, endDate],
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get<ApiResponse<SupplierData[]>>("/v1/suppliers/active");
        setSuppliers(data.data ?? []);
      } catch {
        setSuppliers([]);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Histori & Monitoring Penerimaan</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Filter berdasarkan status, supplier, dan rentang tanggal.</p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select value={status} onChange={(e) => setStatus(e.target.value as InboundStatusFilter)} className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-card dark:text-gray-100">
            {STATUS_OPTIONS.map((opt) => <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>)}
          </select>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-card dark:text-gray-100">
            <option value="">Semua Supplier</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-card dark:text-gray-100" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-card dark:text-gray-100" />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Daftar Penerimaan</h2>
          {loading && <span className="text-xs text-gray-500">Memuat…</span>}
        </div>
        <TableListPaginationToolbar
          totalCount={pagination.totalCount}
          itemLabel="penerimaan"
          pageSize={pagination.pageSize}
          onPageSizeChange={pagination.setPageSize}
          className="px-4 pt-3 mb-3 flex flex-wrap items-center justify-between gap-2 text-sm"
        />
        <div className="overflow-x-auto px-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 dark:bg-white/5 dark:text-gray-400">
                <th className="px-4 py-2 font-medium">Kode Penerimaan</th>
                <th className="px-4 py-2 font-medium">Kode PO</th>
                <th className="px-4 py-2 font-medium">Supplier</th>
                <th className="px-4 py-2 font-medium">Tanggal</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Tidak ada data.</td></tr>
              )}
              {pagination.visibleItems.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2 font-mono text-xs">{r.batchCode}</td>
                  <td className="px-4 py-2">{r.poCode ?? "—"}</td>
                  <td className="px-4 py-2">{r.supplierName}</td>
                  <td className="px-4 py-2">{r.tanggalPenerimaan}</td>
                  <td className="px-4 py-2">{inboundStatusDisplayLabel(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TableListPaginationFooter
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          onPageChange={pagination.setPage}
          disabled={loading}
          show={!loading && pagination.totalCount > 0}
          className="px-4 pb-4 mt-4 flex flex-wrap items-center justify-between gap-2 text-sm"
        />
      </section>
    </div>
  );
}

