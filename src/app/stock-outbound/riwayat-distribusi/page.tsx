"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StockOutboundModuleShell from "../components/StockOutboundModuleShell";
import { stockOutboundApi } from "@/lib/stock-outbound-api";
import type { AllocationStatus, DistributionAudit, DistributionHistory } from "@/types/stock-outbound";
import { formatDateTime, formatKg } from "../components/formatters";

type DistributionRow = DistributionHistory["content"][number];
type DistributionAuditEntry = DistributionAudit["entries"][number];
type SortDirection = "asc" | "desc";
type DetailTab = "detail" | "audit";
type SortKey =
  | "distributionId"
  | "allocationDate"
  | "shippedDate"
  | "soNumber"
  | "batchNumber"
  | "buyerName"
  | "fishSpeciesName"
  | "destination"
  | "allocatedQuantity"
  | "status";

type Filters = {
  batchId: string;
  salesOrderId: string;
  startDate: string;
  endDate: string;
  buyer: string;
  fishSpecies: string;
  destination: string;
  status: "" | AllocationStatus;
};

const defaultFilters: Filters = {
  batchId: "",
  salesOrderId: "",
  startDate: "",
  endDate: "",
  buyer: "",
  fishSpecies: "",
  destination: "",
  status: "",
};

function statusTone(status: AllocationStatus) {
  if (status === "DELIVERED") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  if (status === "DISPATCHED") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  if (status === "ALLOCATED") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
}

function toTime(value: string | null | undefined) {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function toNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export default function RiwayatDistribusiPage() {
  const [rows, setRows] = useState<DistributionRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("allocationDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  const [selectedDistributionId, setSelectedDistributionId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState<DetailTab>("detail");
  const [auditByDistribution, setAuditByDistribution] = useState<Record<number, DistributionAuditEntry[]>>({});

  const loadHistory = useCallback(async (activeFilters: Filters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await stockOutboundApi.getDistributionHistory({
        batchId: toNumber(activeFilters.batchId),
        salesOrderId: toNumber(activeFilters.salesOrderId),
        startDate: activeFilters.startDate || undefined,
        endDate: activeFilters.endDate || undefined,
        buyer: activeFilters.buyer || undefined,
        fishSpecies: activeFilters.fishSpecies || undefined,
        destination: activeFilters.destination || undefined,
        status: activeFilters.status || undefined,
      });

      const data = response.data.data;
      setRows(data?.content ?? []);
      setTotalCount(data?.totalCount ?? 0);
      setSelectedDistributionId((prev) => {
        if (prev && (data?.content ?? []).some((item) => item.distributionId === prev)) {
          return prev;
        }
        return data?.content?.[0]?.distributionId ?? null;
      });
      setPage(1);
    } catch {
      setRows([]);
      setTotalCount(0);
      setError("Gagal memuat riwayat distribusi.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAuditTrail = useCallback(
    async (distributionId: number) => {
      if (auditByDistribution[distributionId]) {
        return;
      }

      setLoadingAudit(true);
      setAuditError(null);

      try {
        const response = await stockOutboundApi.getDistributionAudit(distributionId);
        const entries = response.data.data?.entries ?? [];
        setAuditByDistribution((prev) => ({
          ...prev,
          [distributionId]: entries,
        }));
      } catch {
        setAuditError("Gagal memuat detail audit trail distribusi.");
      } finally {
        setLoadingAudit(false);
      }
    },
    [auditByDistribution]
  );

  useEffect(() => {
    loadHistory(defaultFilters);
  }, [loadHistory]);

  useEffect(() => {
    if (selectedDistributionId == null) return;
    loadAuditTrail(selectedDistributionId);
  }, [selectedDistributionId, loadAuditTrail]);

  const processedRows = useMemo(() => {
    const searchKeyword = normalize(search);

    const globallyFiltered = rows.filter((item) => {
      if (!searchKeyword) return true;

      const haystack = [
        item.distributionId,
        item.soId,
        item.soNumber,
        item.shipmentId,
        item.shipmentNumber,
        item.batchId,
        item.batchNumber,
        item.fishSpeciesName,
        item.buyerName,
        item.destination,
        item.user,
        item.status,
        item.allocatedQuantity,
      ]
        .map((value) => normalize(value == null ? "" : String(value)))
        .join(" ");

      return haystack.includes(searchKeyword);
    });

    const sorted = [...globallyFiltered].sort((a, b) => {
      if (sortKey === "distributionId") {
        return sortDirection === "asc"
          ? a.distributionId - b.distributionId
          : b.distributionId - a.distributionId;
      }

      if (sortKey === "allocationDate") {
        return sortDirection === "asc"
          ? toTime(a.allocationDate) - toTime(b.allocationDate)
          : toTime(b.allocationDate) - toTime(a.allocationDate);
      }

      if (sortKey === "shippedDate") {
        return sortDirection === "asc"
          ? toTime(a.shippedDate) - toTime(b.shippedDate)
          : toTime(b.shippedDate) - toTime(a.shippedDate);
      }

      if (sortKey === "allocatedQuantity") {
        const left = Number(a.allocatedQuantity ?? 0);
        const right = Number(b.allocatedQuantity ?? 0);
        return sortDirection === "asc" ? left - right : right - left;
      }

      const left = normalize(String(a[sortKey] ?? ""));
      const right = normalize(String(b[sortKey] ?? ""));
      if (left === right) return 0;
      if (sortDirection === "asc") return left > right ? 1 : -1;
      return left < right ? 1 : -1;
    });

    return sorted;
  }, [rows, search, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visibleRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [page, pageSize, processedRows]);

  const selectedRow = useMemo(
    () => rows.find((item) => item.distributionId === selectedDistributionId) ?? null,
    [rows, selectedDistributionId]
  );

  const selectedAuditEntries = selectedDistributionId != null ? auditByDistribution[selectedDistributionId] ?? [] : [];

  const updateSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  };

  const applyFilters = () => {
    loadHistory(filters);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSearch("");
    setSortKey("allocationDate");
    setSortDirection("desc");
    loadHistory(defaultFilters);
  };

  const exportCsv = () => {
    const url = stockOutboundApi.buildDistributionExportUrl({
      batchId: toNumber(filters.batchId),
      salesOrderId: toNumber(filters.salesOrderId),
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      buyer: filters.buyer || undefined,
      fishSpecies: filters.fishSpecies || undefined,
      destination: filters.destination || undefined,
      status: filters.status || undefined,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <StockOutboundModuleShell
      title="Riwayat Distribusi"
      description="Pantau histori distribusi outbound dengan filter lanjutan, audit trail per distribusi, serta ekspor CSV untuk kebutuhan audit operasional."
    >
      <section className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={filters.startDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
            type="date"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
          />
          <input
            value={filters.endDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
            type="date"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
          />
          <input
            value={filters.batchId}
            onChange={(event) => setFilters((prev) => ({ ...prev, batchId: event.target.value }))}
            placeholder="Batch ID"
            inputMode="numeric"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
          />
          <input
            value={filters.salesOrderId}
            onChange={(event) => setFilters((prev) => ({ ...prev, salesOrderId: event.target.value }))}
            placeholder="Sales Order ID"
            inputMode="numeric"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
          />
          <input
            value={filters.buyer}
            onChange={(event) => setFilters((prev) => ({ ...prev, buyer: event.target.value }))}
            placeholder="Buyer"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
          />
          <input
            value={filters.fishSpecies}
            onChange={(event) => setFilters((prev) => ({ ...prev, fishSpecies: event.target.value }))}
            placeholder="Jenis Ikan"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
          />
          <input
            value={filters.destination}
            onChange={(event) => setFilters((prev) => ({ ...prev, destination: event.target.value }))}
            placeholder="Tujuan"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
          />
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value as Filters["status"] }))}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="ALLOCATED">ALLOCATED</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search global (SO, batch, buyer, user, status, tujuan, dll.)"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white"
          >
            Terapkan Filter
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white"
          >
            Export CSV/Excel
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4 xl:col-span-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-base font-semibold text-navy dark:text-white">Tabel Riwayat Distribusi</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total:</span>
              <span className="font-semibold">{processedRows.length} / {totalCount}</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-2 py-1 text-xs"
              >
                <option value={10}>10/baris</option>
                <option value={20}>20/baris</option>
                <option value={50}>50/baris</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-section text-left">
                <tr>
                  <th className="px-3 py-2">
                    <button type="button" onClick={() => updateSort("distributionId")} className="font-semibold">ID</button>
                  </th>
                  <th className="px-3 py-2">
                    <button type="button" onClick={() => updateSort("soNumber")} className="font-semibold">Sales Order</button>
                  </th>
                  <th className="px-3 py-2">
                    <button type="button" onClick={() => updateSort("batchNumber")} className="font-semibold">Batch</button>
                  </th>
                  <th className="px-3 py-2">
                    <button type="button" onClick={() => updateSort("fishSpeciesName")} className="font-semibold">Jenis Ikan</button>
                  </th>
                  <th className="px-3 py-2 text-right">
                    <button type="button" onClick={() => updateSort("allocatedQuantity")} className="font-semibold">Qty (Kg)</button>
                  </th>
                  <th className="px-3 py-2">
                    <button type="button" onClick={() => updateSort("buyerName")} className="font-semibold">Buyer</button>
                  </th>
                  <th className="px-3 py-2">
                    <button type="button" onClick={() => updateSort("destination")} className="font-semibold">Tujuan</button>
                  </th>
                  <th className="px-3 py-2">
                    <button type="button" onClick={() => updateSort("status")} className="font-semibold">Status</button>
                  </th>
                  <th className="px-3 py-2">
                    <button type="button" onClick={() => updateSort("allocationDate")} className="font-semibold">Tgl Alokasi</button>
                  </th>
                  <th className="px-3 py-2">
                    <button type="button" onClick={() => updateSort("shippedDate")} className="font-semibold">Tgl Kirim</button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">Loading data...</td>
                  </tr>
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">No data available.</td>
                  </tr>
                ) : (
                  visibleRows.map((item) => (
                    <tr
                      key={item.distributionId}
                      onClick={() => {
                        setSelectedDistributionId(item.distributionId);
                        setSelectedTab("detail");
                      }}
                      className={`cursor-pointer border-t border-gray-100 dark:border-gray-800 ${
                        selectedDistributionId === item.distributionId ? "bg-cyan/5" : ""
                      }`}
                    >
                      <td className="px-3 py-2 font-medium">#{item.distributionId}</td>
                      <td className="px-3 py-2">{item.soNumber}</td>
                      <td className="px-3 py-2">{item.batchNumber}</td>
                      <td className="px-3 py-2">{item.fishSpeciesName ?? "-"}</td>
                      <td className="px-3 py-2 text-right">{formatKg(item.allocatedQuantity)}</td>
                      <td className="px-3 py-2">{item.buyerName ?? "-"}</td>
                      <td className="px-3 py-2">{item.destination ?? "-"}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">{formatDateTime(item.allocationDate)}</td>
                      <td className="px-3 py-2">{formatDateTime(item.shippedDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-500 dark:text-gray-400">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
                className="rounded border border-gray-300 dark:border-gray-600 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages}
                className="rounded border border-gray-300 dark:border-gray-600 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </article>

        <article className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
          <div className="flex gap-2 rounded-lg bg-gray-100 dark:bg-dark-section p-1">
            <button
              type="button"
              onClick={() => setSelectedTab("detail")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
                selectedTab === "detail" ? "bg-cyan text-white" : "text-gray-700 dark:text-gray-200"
              }`}
            >
              Detail Distribusi
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab("audit")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
                selectedTab === "audit" ? "bg-cyan text-white" : "text-gray-700 dark:text-gray-200"
              }`}
            >
              Audit Trail
            </button>
          </div>

          {selectedRow == null ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Klik satu baris pada tabel untuk melihat detail distribusi.</p>
          ) : selectedTab === "detail" ? (
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Distribution ID:</span> #{selectedRow.distributionId}</p>
              <p><span className="font-semibold">Sales Order:</span> {selectedRow.soNumber} (#{selectedRow.soId})</p>
              <p><span className="font-semibold">Shipment:</span> {selectedRow.shipmentNumber ?? "-"}</p>
              <p><span className="font-semibold">Batch:</span> {selectedRow.batchNumber} (#{selectedRow.batchId})</p>
              <p><span className="font-semibold">Jenis Ikan:</span> {selectedRow.fishSpeciesName ?? "-"}</p>
              <p><span className="font-semibold">Buyer:</span> {selectedRow.buyerName ?? "-"}</p>
              <p><span className="font-semibold">Tujuan:</span> {selectedRow.destination ?? "-"}</p>
              <p><span className="font-semibold">Qty:</span> {formatKg(selectedRow.allocatedQuantity)} Kg</p>
              <p><span className="font-semibold">Pelaku:</span> {selectedRow.user ?? "-"}</p>
              <p><span className="font-semibold">Tanggal Alokasi:</span> {formatDateTime(selectedRow.allocationDate)}</p>
              <p><span className="font-semibold">Tanggal Kirim:</span> {formatDateTime(selectedRow.shippedDate)}</p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone(selectedRow.status)}`}>
                  {selectedRow.status}
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {auditError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {auditError}
                </div>
              ) : null}

              {loadingAudit ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Memuat audit trail...</p>
              ) : selectedAuditEntries.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada audit trail untuk distribusi ini.</p>
              ) : (
                <ol className="space-y-2">
                  {selectedAuditEntries.map((entry) => (
                    <li key={entry.auditId} className="rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(entry.eventTime)}</p>
                      <p className="text-sm font-semibold text-navy dark:text-white">{entry.actionType}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">User: {entry.actor ?? "system"}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Old: {entry.oldValue ?? "-"}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">New: {entry.newValue ?? "-"}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </article>
      </section>
    </StockOutboundModuleShell>
  );
}
