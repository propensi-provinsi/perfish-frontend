"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TableListPaginationFooter,
  TableListPaginationToolbar,
  useClientTablePagination,
} from "@/components/ui/TableListPagination";
import Link from "next/link";
import Button from "@/components/ui/Button";
import BatchQrCode from "@/components/cold-storage/BatchQrCode";
import RejectBatchLegend from "@/components/cold-storage/RejectBatchLegend";
import { batchDetailHref } from "@/lib/batch-detail-url";
import { isInboundRejectBatchRow, rejectBatchRowClass } from "@/lib/batch-quality";
import { actionBtn } from "@/lib/ui-action";
import { getColdStorages } from "@/lib/expiry";
import { listColdStorageStocks } from "@/lib/coldstorage-api";
import { dashboardApi } from "@/lib/dashboard-api";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import { stockCategoryStatusBadgeClass } from "@/lib/coldstorage-status";
import { alertErrorClass, formatDateDdMmYyyy } from "@/lib/coldstorage-ui";
import type { ColdStorageData, ColdStorageStockRow, StockCategoryStatus } from "@/types";
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
  matchesBatchOrReceiptSearch,
  matchesDateRange,
  sortByLastActivityDesc,
  toStockNumber,
} from "@/lib/stock-list-utils";

import {
  extractUtilizationItems,
  utilizationForWarehouse,
} from "@/lib/utilization-display";

const MONITOR_STOK_NOTICE_KEY = "monitor-stok-arrival-notices-seen";
const STATUS_FILTER_OPTIONS: StockCategoryStatus[] = ["FRESH", "WARNING", "EXPIRED", "QUARANTINE"];

export default function ColdStorageDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coldStorages, setColdStorages] = useState<ColdStorageData[]>([]);
  const [allRows, setAllRows] = useState<ColdStorageStockRow[]>([]);
  const [utilizationItems, setUtilizationItems] = useState<Record<string, unknown>[]>([]);
  const [filterStatus, setFilterStatus] = useState<StockCategoryStatus | "">("");
  const [filterWarehouseId, setFilterWarehouseId] = useState<number | "">("");
  const [filterSpeciesId, setFilterSpeciesId] = useState<number | "">("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [coldStorageData, stocksData, utilizationData] = await Promise.all([
        getColdStorages(),
        listColdStorageStocks(),
        dashboardApi.coldStorageUtilization(),
      ]);
      setColdStorages(coldStorageData.filter((cs) => cs.isActive));
      setAllRows(sortByLastActivityDesc(stocksData));
      setUtilizationItems(extractUtilizationItems(utilizationData));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dashboard Cold Storage");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const speciesOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const row of allRows) {
      if (row.speciesId != null && row.speciesName) {
        map.set(row.speciesId, row.speciesName);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "id"));
  }, [allRows]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (filterStatus && row.kategoriStatus !== filterStatus) return false;
      if (filterWarehouseId && row.warehouseId !== filterWarehouseId) return false;
      if (filterSpeciesId && row.speciesId !== filterSpeciesId) return false;
      if (!matchesDateRange(row.tanggalMasuk, filterDateFrom, filterDateTo)) return false;
      if (!matchesBatchOrReceiptSearch(row.batchNumber, row.inboundReceiptCode, filterSearch)) return false;
      return true;
    });
  }, [allRows, filterStatus, filterWarehouseId, filterSpeciesId, filterDateFrom, filterDateTo, filterSearch]);

  const summary = useMemo(() => {
    const totals: Record<StockCategoryStatus, number> = {
      FRESH: 0,
      WARNING: 0,
      EXPIRED: 0,
      QUARANTINE: 0,
      DISPOSED: 0,
    };
    let totalStockKg = 0;
    filteredRows.forEach((r) => {
      totals[r.kategoriStatus] = (totals[r.kategoriStatus] ?? 0) + 1;
      totalStockKg += toStockNumber(r.jumlahStok);
    });
    return {
      ...totals,
      totalStockKg,
      activeBatchCount: filteredRows.length,
      averageUtilizationPct: utilizationForWarehouse(utilizationItems, filterWarehouseId),
    };
  }, [filteredRows, utilizationItems, filterWarehouseId]);

  const arrivalNotices = useMemo(
    () =>
      allRows.map((r) => ({
        batchId: r.batchId,
        batchNumber: r.batchNumber,
        subtitle: `${r.warehouseCode} — ${r.storageArea}`,
        tanggalMasuk: r.tanggalMasuk ?? null,
      })),
    [allRows],
  );

  const {
    notices: newArrivalNotices,
    panelHidden: arrivalPanelHidden,
    setPanelHidden: setArrivalPanelHidden,
    dismissNotice: dismissArrivalNotice,
  } = useBatchArrivalNotices(arrivalNotices, MONITOR_STOK_NOTICE_KEY);

  const pagination = useClientTablePagination(filteredRows, {
    resetDeps: [
      filterStatus,
      filterWarehouseId,
      filterSpeciesId,
      filterDateFrom,
      filterDateTo,
      filterSearch,
    ],
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Cold Storage Monitor</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lokasi penyimpanan untuk batch (kandang macan) yang telah diterima
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdated ? lastUpdated.toLocaleString("id-ID") : "—"}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
          Refresh
        </Button>
      </header>
      <ColdStorageModuleNav />

      {error && <div className={alertErrorClass}>{error}</div>}

      <ListFilterSection
        description="Filter stok cold storage (real-time)."
        onReset={() => {
          setFilterStatus("");
          setFilterWarehouseId("");
          setFilterSpeciesId("");
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
        <ListFilterField label="Gudang / Area">
          <select
            value={filterWarehouseId}
            onChange={(e) => setFilterWarehouseId(e.target.value ? Number(e.target.value) : "")}
            className={listFilterInputClass}
          >
            <option value="">Semua Gudang</option>
            {coldStorages.map((cs) => (
              <option key={cs.coldStorageId} value={cs.coldStorageId}>
                {cs.csCode} — {cs.csName}
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
        utilizationBadgeLabel={filterWarehouseId ? "Utilisasi Gudang" : "Utilisasi Avg"}
      />

      <StockStatusBreakdownSection
        rows={filteredRows}
        getStatus={(row) => row.kategoriStatus}
        getStockKg={(row) => toStockNumber(row.jumlahStok)}
        onStatusClick={(status) => setFilterStatus(status)}
      />

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <BatchArrivalNoticePanel
          title="Notifikasi Batch Baru — Cold Storage"
          notices={newArrivalNotices}
          panelHidden={arrivalPanelHidden}
          onHidePanel={() => setArrivalPanelHidden(true)}
          onDismissNotice={dismissArrivalNotice}
        />

        <div className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Daftar Stok</h2>
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
                  <th className="px-3 py-2">Species</th>
                  <th className="px-3 py-2">Gudang / Area</th>
                  <th className="px-3 py-2 text-right">Stok</th>
                  <th className="px-3 py-2">Tgl Penerimaan</th>
                  <th className="px-3 py-2">Tgl Masuk</th>
                  <th className="px-3 py-2">Umur Simpan</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-center">QR</th>
                  <th className="px-3 py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-5 text-gray-500 dark:text-gray-400">
                      Memuat data...
                    </td>
                  </tr>
                ) : pagination.visibleItems.length ? (
                  pagination.visibleItems.map((row) => {
                    const rejectRow = isInboundRejectBatchRow(row);
                    return (
                      <tr
                        key={`${row.batchId}-${row.warehouseId}`}
                        className={`border-b border-gray-100 dark:border-gray-800 ${rejectRow ? rejectBatchRowClass : ""}`}
                      >
                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{row.batchNumber}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{row.inboundReceiptCode ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{row.speciesName ?? "—"}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className="text-gray-900 dark:text-gray-100">
                              {row.warehouseCode} — {row.warehouseName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Area: {row.storageArea}</span>
                          </div>
                        </td>
                        <td className={`px-3 py-2 text-right ${stockQtyGreenClass}`}>
                          {row.jumlahStok ?? 0} {row.unit ?? ""}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {formatDateDdMmYyyy(row.tanggalPenerimaan ?? null)}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {formatDateDdMmYyyy(row.tanggalMasuk)}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {row.umurSimpanDays} hari
                          {row.umurSimpanBulan > 0 && (
                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                              ({row.umurSimpanBulan} bln)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stockCategoryStatusBadgeClass(row.kategoriStatus)}`}
                          >
                            {row.kategoriStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <BatchQrCode batchNumber={row.batchNumber} size={48} />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Link href={batchDetailHref(row.batchNumber)} className={actionBtn("primary", "xs")}>
                            View Detail
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="px-3 py-5 text-gray-500 dark:text-gray-400">
                      Belum ada stok batch aktif di Cold Storage.
                    </td>
                  </tr>
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
