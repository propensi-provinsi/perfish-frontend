"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineDocumentMagnifyingGlass,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { getAuditLogs, getEntityAuditTrail, getAllEntitiesByType, type AuditLogQuery } from "@/lib/audit-api";
import type { AuditLogData, AuditLogPageData } from "@/types";

type TabKey = "logs" | "entity";

const ENTITY_OPTIONS = [
  { value: "MASTER_BATCH", label: "Master Batch" },
  { value: "PALLET", label: "Pallet" },
  { value: "INBOUND_FISH", label: "Inbound Fish" },
  { value: "MASTER_SUPPLIER", label: "Supplier" },
  { value: "MASTER_FISH_SPECIES", label: "Species" },
  { value: "MASTER_FISH_FORM", label: "Form" },
  { value: "MASTER_FISH_GRADE", label: "Grade" },
  { value: "MASTER_PACKAGING_TYPE", label: "Packaging" },
  { value: "MASTER_FISH_SKU", label: "SKU" },
  { value: "MASTER_BRANCH", label: "Branch" },
  { value: "MASTER_COLD_STORAGE", label: "Cold Storage" },
  { value: "MASTER_STORAGE_BLOCK", label: "Storage Block" },
  { value: "MASTER_STORAGE_RACK", label: "Storage Rack" },
  { value: "MASTER_STORAGE_POSITION", label: "Storage Position" },
  { value: "USER", label: "User" },
];

const ACTION_OPTIONS = [
  { value: "", label: "Semua aktivitas" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "STATUS_CHANGE", label: "Status change" },
  { value: "WEIGHT_CORRECTION", label: "Weight correction" },
  { value: "LOCATION_CHANGE", label: "Location change" },
  { value: "QC_APPROVAL", label: "QC approval" },
  { value: "MASTER_DATA_CHANGE", label: "Master data change" },
];

function humanize(value?: string | null) {
  if (!value) return "-";
  return value.replace(/_/g, " ");
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function changeLabel(item: AuditLogData) {
  return humanize(item.fieldName);
}

function entityTypeLabel(item: AuditLogData) {
  return humanize(item.entityType);
}

function entityNameLabel(item: AuditLogData) {
  const name = item.entityName?.trim();
  return name || `#${item.entityId}`;
}

function AuditLogTable({ rows, emptyLabel }: { rows: AuditLogData[]; emptyLabel: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-card">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-dark-section">
          <tr>
            {[
              "Tipe Entity",
              "Nama Entity",
              "Atribut",
              "Nilai Lama",
              "Nilai Baru",
              "User",
              "Tanggal",
            ].map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  {entityTypeLabel(row)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                  <div className="font-medium">{entityNameLabel(row)}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                  <span className="inline-flex rounded-full bg-cyan/10 px-2.5 py-0.5 text-xs font-medium text-cyan">
                    {changeLabel(row)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300 break-words">
                  {row.oldValue ?? "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300 break-words">
                  {row.newValue ?? "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                  <div className="font-medium">{row.userName ?? row.userEmail ?? row.userId}</div>
                  <div className="text-xs text-gray-400">{row.userEmail ?? row.userId}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {formatDateTime(row.timestamp)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AuditTrailDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("logs");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logsPage, setLogsPage] = useState<AuditLogPageData | null>(null);

  const [entityLogs, setEntityLogs] = useState<AuditLogData[]>([]);
  const [entityLoading, setEntityLoading] = useState(false);
  const [entityError, setEntityError] = useState<string | null>(null);
  const [entityType, setEntityType] = useState("MASTER_BATCH");
  const [entityId, setEntityId] = useState("");
  const [entityOptions, setEntityOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [entityOptionsLoading, setEntityOptionsLoading] = useState(false);

  const [userId, setUserId] = useState("");
  const [filterEntityType, setFilterEntityType] = useState("");
  const [actionType, setActionType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filters = useMemo<AuditLogQuery>(() => ({
    userId: userId || undefined,
    entityType: filterEntityType || undefined,
    actionType: actionType || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    size,
    sort: `timestamp,${sortOrder}`,
  }), [userId, filterEntityType, actionType, startDate, endDate, page, size, sortOrder]);

  const userOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of logsPage?.content ?? []) {
      if (!row.userId) continue;
      seen.set(row.userId, row.userName ?? row.userEmail ?? row.userId);
    }
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [logsPage]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuditLogs(filters);
      setLogsPage(data);
    } catch {
      setError("Gagal memuat audit logs");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  async function loadEntityOptions(selectedEntityType: string) {
    setEntityOptionsLoading(true);
    try {
      const options = await getAllEntitiesByType(selectedEntityType);
      const formatted = options.map((opt) => ({
        value: opt.id,
        label: opt.name || opt.id,
      }));
      setEntityOptions(formatted);
      setEntityId((prev) => {
        if (prev && formatted.some((item) => item.value === prev)) {
          return prev;
        }
        return formatted[0]?.value ?? "";
      });
    } catch {
      setEntityOptions([]);
      setEntityId("");
    } finally {
      setEntityOptionsLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab !== "logs") return;
    void loadLogs();
  }, [activeTab, loadLogs]);

  useEffect(() => {
    if (activeTab !== "entity") return;
    void loadEntityOptions(entityType);
  }, [activeTab, entityType]);

  async function handleLoadEntityLogs() {
    if (!entityId.trim()) {
      setEntityError("Entity ID wajib diisi");
      return;
    }
    setEntityLoading(true);
    setEntityError(null);
    try {
      const data = await getEntityAuditTrail(entityType, entityId.trim());
      setEntityLogs(data);
    } catch {
      setEntityError("Gagal memuat audit entity");
    } finally {
      setEntityLoading(false);
    }
  }

  function resetFilters() {
    setUserId("");
    setFilterEntityType("");
    setActionType("");
    setStartDate("");
    setEndDate("");
    setPage(0);
    setSortOrder("desc");
  }

  const canPrevious = (logsPage?.page ?? 0) > 0;
  const canNext = logsPage ? logsPage.page + 1 < logsPage.totalPages : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Audit Trail</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitoring perubahan data penting untuk meningkatkan transparansi dan akuntabilitas.
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Role: <span className="font-medium text-gray-700 dark:text-gray-200">{user?.role}</span>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("logs")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === "logs" ? "border-cyan text-cyan" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
        >
          <HiOutlineMagnifyingGlass className="h-4 w-4" />
          Audit Logs
        </button>
        <button
          onClick={() => setActiveTab("entity")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === "entity" ? "border-cyan text-cyan" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
        >
          <HiOutlineDocumentMagnifyingGlass className="h-4 w-4" />
          Entity
        </button>
      </div>

      {activeTab === "logs" ? (
        <>
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filter Audit Logs</h2>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
                <Button size="sm" onClick={loadLogs} className="inline-flex items-center gap-2 whitespace-nowrap">
                  <HiOutlineArrowPath className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Rentang awal</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Rentang akhir</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">User</label>
                <select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section">
                  <option value="">Semua user</option>
                  {userOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Jenis aktivitas</label>
                <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section">
                  {ACTION_OPTIONS.map((item) => (
                    <option key={item.value || "all"} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Tabel/entity</label>
                <select value={filterEntityType} onChange={(e) => setFilterEntityType(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section">
                  <option value="">Semua tabel</option>
                  {ENTITY_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Sort waktu</label>
                <select value={sortOrder} onChange={(e) => { setPage(0); setSortOrder(e.target.value as "asc" | "desc"); }} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section">
                  <option value="desc">Terbaru</option>
                  <option value="asc">Terlama</option>
                </select>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{logsPage?.totalElements ?? 0} log ditemukan</span>
              <span>Sort: {logsPage?.sort ?? "timestamp,desc"}</span>
            </div>
            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-400 dark:border-gray-700 dark:bg-dark-card">
                Memuat audit logs…
              </div>
            ) : (
              <AuditLogTable rows={logsPage?.content ?? []} emptyLabel="Belum ada audit log sesuai filter." />
            )}

            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-gray-700 dark:bg-dark-card sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-gray-500 dark:text-gray-400">
                <span>
                  Halaman {logsPage?.page ? logsPage.page + 1 : 1} dari {logsPage?.totalPages ?? 1}
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium">Baris per halaman</label>
                  <select value={size} onChange={(e) => { setPage(0); setSize(Number(e.target.value)); }} className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-dark-section">
                    {[10, 20, 50].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="inline-flex items-center gap-1 whitespace-nowrap" onClick={() => setPage((prev) => Math.max(prev - 1, 0))} disabled={!canPrevious || loading}>
                  <HiOutlineChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button size="sm" variant="outline" className="inline-flex items-center gap-1 whitespace-nowrap" onClick={() => setPage((prev) => prev + 1)} disabled={!canNext || loading}>
                  Next
                  <HiOutlineChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Entity Audit</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Lihat histori perubahan untuk satu entity spesifik.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto]">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Entity type</label>
              <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setEntityLogs([]); setEntityError(null); }} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section">
                {ENTITY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Entity ID</label>
              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
                disabled={entityOptionsLoading}
              >
                <option value="">{entityOptionsLoading ? "Memuat entity..." : "Pilih entity"}</option>
                {entityOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleLoadEntityLogs} className="h-[42px] inline-flex items-center gap-2 whitespace-nowrap" disabled={entityOptionsLoading || !entityId}>
                <HiOutlineDocumentMagnifyingGlass className="h-4 w-4" />
                Muat Entity
              </Button>
            </div>
          </div>

          {entityError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {entityError}
            </div>
          )}

          {entityLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-400 dark:border-gray-700 dark:bg-dark-card">
              Memuat entity audit…
            </div>
          ) : (
            <AuditLogTable rows={entityLogs} emptyLabel="Belum ada histori untuk entity ini." />
          )}
        </section>
      )}
    </div>
  );
}
