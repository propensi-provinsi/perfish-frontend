"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import {
  getBatchExpiryStatus,
  getBatchExpirySummary,
  getColdStorages,
  getFishSpecies,
  overrideBatchExpiryDate,
  type ExpiryStatusQuery,
} from "@/lib/expiry";
import type {
  BatchExpiryStatusListData,
  BatchExpiryStatusRow,
  BatchExpirySummaryData,
  ColdStorageData,
  ExpiryStatus,
  FishSpeciesData,
} from "@/types";

const STATUS_OPTIONS: ExpiryStatus[] = ["FRESH", "WARNING", "EXPIRED"];

function statusClass(status: ExpiryStatus) {
  if (status === "EXPIRED") return "bg-red/10 text-red";
  if (status === "WARNING") return "bg-yellow/10 text-yellow";
  return "bg-green/10 text-green";
}

export default function ExpiredAlertDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<BatchExpiryStatusRow | null>(null);
  const [overrideDate, setOverrideDate] = useState("");
  const [savingOverride, setSavingOverride] = useState(false);

  const [species, setSpecies] = useState<FishSpeciesData[]>([]);
  const [coldStorages, setColdStorages] = useState<ColdStorageData[]>([]);
  const [summary, setSummary] = useState<BatchExpirySummaryData | null>(null);
  const [rows, setRows] = useState<BatchExpiryStatusListData | null>(null);

  const [status, setStatus] = useState<ExpiryStatus | "">("");
  const [speciesId, setSpeciesId] = useState<number | "">("");
  const [coldStorageId, setColdStorageId] = useState<number | "">("");
  const [keyword, setKeyword] = useState("");
  const isSuperadmin = user?.role === "SUPERADMIN";

  function clearFilters() {
    setStatus("");
    setSpeciesId("");
    setColdStorageId("");
    setKeyword("");
  }

  const filters = useMemo<ExpiryStatusQuery>(
    () => ({
      status: status || undefined,
      speciesId: speciesId || undefined,
      coldStorageId: coldStorageId || undefined,
      keyword: keyword || undefined,
      page: 0,
      size: 20,
      sort: "daysToExpire,asc",
    }),
    [status, speciesId, coldStorageId, keyword]
  );

  async function loadPageData() {
    setLoading(true);
    setError(null);
    try {
      const [speciesData, coldStorageData, summaryData, statusData] = await Promise.all([
        getFishSpecies(),
        getColdStorages(),
        getBatchExpirySummary({
          coldStorageId: filters.coldStorageId,
          speciesId: filters.speciesId,
        }),
        getBatchExpiryStatus(filters),
      ]);

      setSpecies(speciesData);
      setColdStorages(coldStorageData.filter((item) => item.isActive));
      setSummary(summaryData);
      setRows(statusData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat dashboard expired alert";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.speciesId, filters.coldStorageId, filters.keyword]);

  function openOverrideModal(row: BatchExpiryStatusRow) {
    setSelectedRow(row);
    setOverrideDate(row.manualExpiredDate ?? row.expiredDate);
    setOverrideModalOpen(true);
  }

  function closeOverrideModal() {
    setOverrideModalOpen(false);
    setSelectedRow(null);
    setOverrideDate("");
  }

  async function handleSaveOverride() {
    if (!selectedRow) return;

    setSavingOverride(true);
    setError(null);
    try {
      await overrideBatchExpiryDate(selectedRow.batchId, {
        expiredDate: overrideDate || null,
      });
      closeOverrideModal();
      await loadPageData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengubah expiry date batch";
      setError(message);
    } finally {
      setSavingOverride(false);
    }
  }

  async function handleResetOverride() {
    if (!selectedRow) return;

    setSavingOverride(true);
    setError(null);
    try {
      await overrideBatchExpiryDate(selectedRow.batchId, {
        expiredDate: null,
      });
      closeOverrideModal();
      await loadPageData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mereset expiry date batch";
      setError(message);
    } finally {
      setSavingOverride(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Expired Alert & Notification Monitor</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ringkasan stok fresh dan warning serta daftar batch expiry berdasarkan filter operasional.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard title="Fresh" value={summary?.freshBatch ?? 0} tone="green" />
          <SummaryCard title="Warning" value={summary?.warningBatch ?? 0} tone="yellow" />
          <SummaryCard title="Expired" value={summary?.expiredBatch ?? 0} tone="red" />
          <SummaryCard title="Total Batch" value={summary?.totalBatch ?? 0} tone="slate" />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filter Monitor</h2>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={clearFilters} disabled={loading}>
                Hapus Semua Filter
              </Button>
              <Button size="sm" variant="outline" onClick={() => loadPageData()} disabled={loading}>
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Gudang</label>
              <select
                value={coldStorageId}
                onChange={(e) => setColdStorageId(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              >
                <option value="">Semua Gudang</option>
                {coldStorages.map((cs) => (
                  <option key={cs.coldStorageId} value={cs.coldStorageId}>
                    {cs.csCode} - {cs.csName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Species</label>
              <select
                value={speciesId}
                onChange={(e) => setSpeciesId(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              >
                <option value="">Semua Species</option>
                {species.map((s) => (
                  <option key={s.speciesId} value={s.speciesId}>
                    {s.speciesCode} - {s.speciesName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus((e.target.value as ExpiryStatus) || "")}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              >
                <option value="">Semua Status</option>
                {STATUS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Cari Batch Code</label>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="BT-JKT-..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Daftar Batch Expiry</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700">
                  <th className="px-3 py-2">Batch</th>
                  <th className="px-3 py-2">Species</th>
                  <th className="px-3 py-2">Gudang/Rack</th>
                  <th className="px-3 py-2">Entry</th>
                  <th className="px-3 py-2">Expired</th>
                  <th className="px-3 py-2">Sisa Hari</th>
                  <th className="px-3 py-2">Status</th>
                  {isSuperadmin && <th className="px-3 py-2">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-5 text-gray-500" colSpan={isSuperadmin ? 8 : 7}>
                      Memuat data...
                    </td>
                  </tr>
                ) : rows?.content.length ? (
                  rows.content.map((row) => (
                    <tr key={row.batchId} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{row.batchCode}</td>
                      <td className="px-3 py-2">{row.speciesCode} - {row.speciesName}</td>
                      <td className="px-3 py-2">{row.csCode ?? "-"} / {row.rackCode ?? "-"}</td>
                      <td className="px-3 py-2">{row.entryDate}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          <span>{row.expiredDate}</span>
                          {row.isManualExpiryOverride && (
                            <span className="text-xs font-medium text-cyan">Manual override</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">{row.daysToExpire}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(row.expiryStatus)}`}>
                          {row.expiryStatus}
                        </span>
                      </td>
                      {isSuperadmin && (
                        <td className="px-3 py-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="whitespace-nowrap px-2.5 text-xs"
                            onClick={() => openOverrideModal(row)}
                          >
                            Edit Expiry
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-5 text-gray-500" colSpan={isSuperadmin ? 8 : 7}>
                      Belum ada data batch expiry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {overrideModalOpen && selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-dark-card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Expiry Date Batch</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Batch {selectedRow.batchCode}. Reset untuk kembali ke default calculation dari entry date + shelf life.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Tanggal Expiry Override</label>
                <input
                  type="date"
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
                />
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-dark-section dark:text-gray-300">
                Default calculated expiry: {selectedRow.entryDate} + shelf life = {selectedRow.expiredDate}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => void handleSaveOverride()} disabled={savingOverride || !overrideDate}>
                {savingOverride ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button variant="outline" onClick={() => void handleResetOverride()} disabled={savingOverride}>
                Reset ke Default
              </Button>
              <Button variant="outline" onClick={closeOverrideModal} disabled={savingOverride}>
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SummaryCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: "slate" | "green" | "yellow" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "bg-green/10 text-green"
      : tone === "yellow"
        ? "bg-yellow/10 text-yellow"
        : tone === "red"
          ? "bg-red/10 text-red"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${toneClass}`}>{title}</span>
      </div>
    </div>
  );
}
