"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TableListPaginationFooter,
  TableListPaginationToolbar,
  useClientTablePagination,
} from "@/components/ui/TableListPagination";
import Link from "next/link";
import { ColdStoragePageGuard } from "@/components/cold-storage/ColdStorageModuleShell";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import { listLoadingBayBatches } from "@/lib/coldstorage-api";
import { actionBtn } from "@/lib/ui-action";
import type { LoadingBayBatchRow, StockCategoryStatus } from "@/types/coldstorage";
import { stockCategoryStatusBadgeClass } from "@/lib/coldstorage-status";
import { textBodySm } from "@/lib/coldstorage-ui";
import BatchQrCode from "@/components/cold-storage/BatchQrCode";
import RejectBatchLegend from "@/components/cold-storage/RejectBatchLegend";
import { batchDetailHref } from "@/lib/batch-detail-url";
import { isInboundRejectBatchRow, rejectBatchRowClass } from "@/lib/batch-quality";
import { ListFilterField, ListFilterSection, listFilterInputClass } from "@/components/inbound-fish/ListFilterSection";
import {
  BatchArrivalNoticePanel,
  useBatchArrivalNotices,
} from "@/components/cold-storage/BatchArrivalNoticePanel";
import {
  StockMonitorSummaryGrid,
  StockStatusBreakdownSection,
  stockQtyGreenClass,
} from "@/components/cold-storage/StockMonitorSummaryCards";
import {
  formatStockKg,
  matchesBatchOrReceiptSearch,
  matchesDateRange,
  resolveKandangUtilizationPct,
  sortByLastActivityDesc,
  toStockNumber,
} from "@/lib/stock-list-utils";

const LOADING_BAY_NOTICE_KEY = "loading-bay-arrival-notices-seen";
const STATUS_FILTER_OPTIONS: StockCategoryStatus[] = ["FRESH", "WARNING", "EXPIRED", "QUARANTINE"];

function shortColdStorageLabel(full: string | null | undefined): string {
  if (!full) return "—";
  const sep = " — ";
  const i = full.indexOf(sep);
  if (i === -1) return full.trim();
  const right = full.slice(i + sep.length).trim();
  return right || full.trim();
}

function formatDateDdMmYyyy(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const s = isoDate.trim().slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return isoDate;
}

function fmtQty(v: number | string | null | undefined): string {
  if (v == null) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);
}

export default function LoadingBayPage() {
  return (
    <ColdStoragePageGuard>
      <AppShell>
        <LoadingBayContent />
      </AppShell>
    </ColdStoragePageGuard>
  );
}

function LoadingBayContent() {
  const [allRows, setAllRows] = useState<LoadingBayBatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<StockCategoryStatus | "">("");
  const [filterSpeciesId, setFilterSpeciesId] = useState<number | "">("");
  const [filterLokasi, setFilterLokasi] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLoadingBayBatches();
      setAllRows(sortByLastActivityDesc(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat loading bay");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const speciesOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const row of allRows) {
      if (row.fishSpeciesId != null && row.fishSpeciesName) {
        map.set(row.fishSpeciesId, row.fishSpeciesName);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "id"));
  }, [allRows]);

  const lokasiOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of allRows) {
      if (row.lokasiPenerimaan?.trim()) set.add(row.lokasiPenerimaan.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b, "id"));
  }, [allRows]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (filterStatus && row.kategoriStatus !== filterStatus) return false;
      if (filterSpeciesId && row.fishSpeciesId !== filterSpeciesId) return false;
      if (filterLokasi && row.lokasiPenerimaan !== filterLokasi) return false;
      if (!matchesDateRange(row.tanggalMasuk, filterDateFrom, filterDateTo)) return false;
      if (!matchesBatchOrReceiptSearch(row.batchNumber, row.inboundReceiptCode, filterSearch)) return false;
      return true;
    });
  }, [allRows, filterStatus, filterSpeciesId, filterLokasi, filterDateFrom, filterDateTo, filterSearch]);

  const summary = useMemo(() => {
    const totals = { FRESH: 0, WARNING: 0, EXPIRED: 0, QUARANTINE: 0 };
    let totalStockKg = 0;
    let utilizationSum = 0;
    let utilizationCount = 0;
    filteredRows.forEach((r) => {
      const status = r.kategoriStatus ?? "FRESH";
      if (status in totals) totals[status as keyof typeof totals] += 1;
      const stockKg = toStockNumber(r.currentQuantity);
      totalStockKg += stockKg;
      const util = resolveKandangUtilizationPct(stockKg);
      if (util != null) {
        utilizationSum += util;
        utilizationCount += 1;
      }
    });
    return {
      ...totals,
      totalStockKg,
      activeBatchCount: filteredRows.length,
      averageUtilizationPct: utilizationCount ? utilizationSum / utilizationCount : 0,
    };
  }, [filteredRows]);

  const arrivalNotices = useMemo(
    () =>
      allRows.map((r) => ({
        batchId: r.batchId,
        batchNumber: r.batchNumber,
        subtitle: r.fishSpeciesName ?? null,
        tanggalMasuk: r.tanggalMasuk ?? null,
      })),
    [allRows],
  );

  const {
    notices: newArrivalNotices,
    panelHidden: arrivalPanelHidden,
    setPanelHidden: setArrivalPanelHidden,
    dismissNotice: dismissArrivalNotice,
  } = useBatchArrivalNotices(arrivalNotices, LOADING_BAY_NOTICE_KEY);

  const pagination = useClientTablePagination(filteredRows, {
    resetDeps: [filterStatus, filterSpeciesId, filterLokasi, filterDateFrom, filterDateTo, filterSearch],
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Loading Bay</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
            Lokasi penyimpanan sementara untuk batch (kandang macan) yang telah diterima
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <ListFilterSection
        description="Filter batch di loading bay (real-time)."
        onReset={() => {
          setFilterStatus("");
          setFilterSpeciesId("");
          setFilterLokasi("");
          setFilterDateFrom("");
          setFilterDateTo("");
          setFilterSearch("");
        }}
        columnsClass="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        <ListFilterField label="Status">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus((e.target.value as StockCategoryStatus) || "")}
            className={listFilterInputClass}
          >
            <option value="">Semua Status</option>
            {STATUS_FILTER_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </ListFilterField>
        <ListFilterField label="Tanggal Masuk (Dari)">
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className={`${listFilterInputClass} dark:[color-scheme:dark]`}
          />
        </ListFilterField>
        <ListFilterField label="Tanggal Masuk (Sampai)">
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className={`${listFilterInputClass} dark:[color-scheme:dark]`}
          />
        </ListFilterField>
        <ListFilterField label="Species">
          <select
            value={filterSpeciesId}
            onChange={(e) => setFilterSpeciesId(e.target.value ? Number(e.target.value) : "")}
            className={listFilterInputClass}
          >
            <option value="">Semua Species</option>
            {speciesOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </ListFilterField>
        <ListFilterField label="Lokasi Penerimaan">
          <select value={filterLokasi} onChange={(e) => setFilterLokasi(e.target.value)} className={listFilterInputClass}>
            <option value="">Semua Lokasi</option>
            {lokasiOptions.map((loc) => (
              <option key={loc} value={loc}>
                {shortColdStorageLabel(loc)}
              </option>
            ))}
          </select>
        </ListFilterField>
        <ListFilterField label="Batch / Kode Penerimaan">
          <input
            type="search"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Cari batch atau kode penerimaan"
            maxLength={64}
            className={listFilterInputClass}
          />
        </ListFilterField>
      </ListFilterSection>

      <StockMonitorSummaryGrid
        activeBatchCount={summary.activeBatchCount}
        totalStockKg={summary.totalStockKg}
        freshCount={summary.FRESH}
        warningCount={summary.WARNING}
        expiredCount={summary.EXPIRED}
        averageUtilizationPct={summary.averageUtilizationPct}
        utilizationBadgeLabel="Isi Kandang Avg"
      />

      <StockStatusBreakdownSection
        rows={filteredRows}
        getStatus={(row) => row.kategoriStatus ?? "FRESH"}
        getStockKg={(row) => toStockNumber(row.currentQuantity)}
        onStatusClick={(status) => setFilterStatus(status)}
      />

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <BatchArrivalNoticePanel
          title="Notifikasi Batch Baru — Loading Bay"
          notices={newArrivalNotices}
          panelHidden={arrivalPanelHidden}
          onHidePanel={() => setArrivalPanelHidden(true)}
          onDismissNotice={dismissArrivalNotice}
        />

        <div className="p-4">
          <TableListPaginationToolbar
            totalCount={pagination.totalCount}
            itemLabel="batch"
            pageSize={pagination.pageSize}
            onPageSizeChange={pagination.setPageSize}
          />
          <RejectBatchLegend className="mb-3" />

          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-3 py-2">Batch</th>
                  <th className="px-3 py-2">Kode Penerimaan</th>
                  <th className="px-3 py-2">Lokasi Penerimaan</th>
                  <th className="px-3 py-2">Species</th>
                  <th className="px-3 py-2 text-right">Stok (kg)</th>
                  <th className="px-3 py-2">Tanggal Masuk</th>
                  <th className="px-3 py-2">Umur Simpan</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-center">QR Code</th>
                  <th className="px-3 py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-gray-500 dark:text-gray-400">
                      Memuat…
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-gray-500 dark:text-gray-400">
                      Tidak ada batch di loading bay. Batch baru muncul setelah penerimaan inbound di-approve dan belum
                      diberi lokasi rack.
                    </td>
                  </tr>
                ) : (
                  pagination.visibleItems.map((r) => {
                    const rejectRow = isInboundRejectBatchRow(r);
                    return (
                      <tr
                        key={r.batchId}
                        className={`border-b border-gray-100 dark:border-gray-800 ${rejectRow ? rejectBatchRowClass : ""}`}
                      >
                        <td className="px-3 py-2 font-mono font-medium text-gray-900 dark:text-gray-100">
                          {r.batchNumber}
                        </td>
                        <td className={`px-3 py-2 font-mono text-xs ${textBodySm}`}>{r.inboundReceiptCode ?? "—"}</td>
                        <td
                          className={`px-3 py-2 max-w-[200px] truncate ${textBodySm}`}
                          title={r.lokasiPenerimaan ?? undefined}
                        >
                          {shortColdStorageLabel(r.lokasiPenerimaan)}
                        </td>
                        <td className={`px-3 py-2 ${textBodySm}`}>{r.fishSpeciesName ?? "—"}</td>
                        <td className={`px-3 py-2 text-right ${stockQtyGreenClass}`}>{fmtQty(r.currentQuantity)}</td>
                        <td className={`px-3 py-2 whitespace-nowrap ${textBodySm}`}>
                          {formatDateDdMmYyyy(r.tanggalMasuk)}
                        </td>
                        <td className={`px-3 py-2 ${textBodySm}`}>
                          {r.umurSimpanDays != null ? (
                            <>
                              {r.umurSimpanDays} hari
                              {(r.umurSimpanBulan ?? 0) > 0 && (
                                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                  ({r.umurSimpanBulan} bln)
                                </span>
                              )}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stockCategoryStatusBadgeClass(r.kategoriStatus ?? "FRESH")}`}
                          >
                            {r.kategoriStatus ?? "FRESH"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-center">
                            <BatchQrCode batchNumber={r.batchNumber} size={56} />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <Link href={batchDetailHref(r.batchNumber)} className={actionBtn("neutral", "xs")}>
                              View Detail
                            </Link>
                            <Link
                              href={`/cold-storage/assign-location?batchId=${r.batchId}`}
                              className={actionBtn("primary", "xs")}
                            >
                              Tetapkan Lokasi
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
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
          />
        </div>
      </section>
    </div>
  );
}
