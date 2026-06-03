"use client";

import { useMemo } from "react";
import { stockCategoryStatusBadgeClass } from "@/lib/coldstorage-status";
import {
  formatStockKg,
  STOCK_BREAKDOWN_STATUSES,
  type StockBreakdownStatus,
} from "@/lib/stock-list-utils";
import type { StockCategoryStatus } from "@/types/coldstorage";

export function StockMonitorSummaryCard({
  badgeLabel,
  badgeClass,
  value,
}: {
  badgeLabel: string;
  badgeClass: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-card">
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
        {badgeLabel}
      </span>
      <p className="text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

const SUMMARY_BADGE_TONE: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export function StockMonitorSummaryGrid({
  activeBatchCount,
  totalStockKg,
  freshCount,
  warningCount,
  expiredCount,
  averageUtilizationPct,
  utilizationBadgeLabel = "Utilisasi Avg",
}: {
  activeBatchCount: number;
  totalStockKg: number;
  freshCount: number;
  warningCount: number;
  expiredCount: number;
  averageUtilizationPct: number;
  utilizationBadgeLabel?: string;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <StockMonitorSummaryCard
        badgeLabel="Batch Aktif"
        badgeClass={SUMMARY_BADGE_TONE.slate}
        value={String(activeBatchCount)}
      />
      <StockMonitorSummaryCard
        badgeLabel="Total Stok"
        badgeClass={SUMMARY_BADGE_TONE.slate}
        value={formatStockKg(totalStockKg)}
      />
      <StockMonitorSummaryCard
        badgeLabel="Fresh"
        badgeClass={SUMMARY_BADGE_TONE.green}
        value={String(freshCount)}
      />
      <StockMonitorSummaryCard
        badgeLabel="Warning"
        badgeClass={SUMMARY_BADGE_TONE.yellow}
        value={String(warningCount)}
      />
      <StockMonitorSummaryCard
        badgeLabel="Expired"
        badgeClass={SUMMARY_BADGE_TONE.red}
        value={String(expiredCount)}
      />
      <StockMonitorSummaryCard
        badgeLabel={utilizationBadgeLabel}
        badgeClass={SUMMARY_BADGE_TONE.slate}
        value={`${averageUtilizationPct.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`}
      />
    </section>
  );
}

export function StockStatusBreakdownSection<T>({
  rows,
  getStatus,
  getStockKg,
  onStatusClick,
}: {
  rows: T[];
  getStatus: (row: T) => StockCategoryStatus;
  getStockKg: (row: T) => number;
  onStatusClick?: (status: StockBreakdownStatus) => void;
}) {
  const statusBreakdown = useMemo(() => {
    return STOCK_BREAKDOWN_STATUSES.map((status) => {
      const matching = rows.filter((row) => getStatus(row) === status);
      const stockKg = matching.reduce((sum, row) => sum + getStockKg(row), 0);
      return { status, batchCount: matching.length, stockKg };
    });
  }, [rows, getStatus, getStockKg]);

  const maxBreakdownStock = Math.max(...statusBreakdown.map((item) => item.stockKg), 1);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Breakdown Status Stok</h2>
      <div className="space-y-3">
        {statusBreakdown.map((item) => {
          const inner = (
            <>
              <span
                className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${stockCategoryStatusBadgeClass(item.status)}`}
              >
                {item.status}
              </span>
              <span className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <span
                  className="block h-full rounded-full bg-cyan"
                  style={{ width: `${Math.max(4, (item.stockKg / maxBreakdownStock) * 100)}%` }}
                />
              </span>
              <span className="text-right text-xs text-gray-600 dark:text-gray-300">
                {item.batchCount} batch · {formatStockKg(item.stockKg)}
              </span>
            </>
          );

          if (onStatusClick) {
            return (
              <button
                key={item.status}
                type="button"
                onClick={() => onStatusClick(item.status)}
                className="grid w-full grid-cols-[96px_1fr_120px] items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-cyan/5"
              >
                {inner}
              </button>
            );
          }

          return (
            <div
              key={item.status}
              className="grid grid-cols-[96px_1fr_120px] items-center gap-3 rounded-lg px-2 py-2"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export const stockQtyGreenClass = "font-semibold tabular-nums text-green-600 dark:text-green-400";
