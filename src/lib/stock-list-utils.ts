import { sanitizeSearchQuery, matchesContainsSearch } from "@/lib/safe-search";

export const KANDANG_NOMINAL_KG = 650;

export function toStockNumber(value: number | string | null | undefined): number {
  if (value == null || value === "") return 0;
  const parsed = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatStockKg(value: number): string {
  return `${value.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg`;
}

export function sortByTanggalMasukDesc<T extends { tanggalMasuk?: string | null; batchId?: number }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const da = a.tanggalMasuk?.slice(0, 10) ?? "";
    const db = b.tanggalMasuk?.slice(0, 10) ?? "";
    if (da !== db) return db.localeCompare(da);
    return (b.batchId ?? 0) - (a.batchId ?? 0);
  });
}

/** Urutkan baris stok/loading bay: aktivitas terbaru di atas. */
export function sortByLastActivityDesc<
  T extends { lastActivityAt?: string | null; updatedAt?: string | null; batchId?: number },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const ta = a.lastActivityAt ?? a.updatedAt ?? "";
    const tb = b.lastActivityAt ?? b.updatedAt ?? "";
    if (ta !== tb) return tb.localeCompare(ta);
    return (b.batchId ?? 0) - (a.batchId ?? 0);
  });
}

export function matchesBatchOrReceiptSearch(
  batchNumber: string,
  receiptCode: string | null | undefined,
  query: string,
): boolean {
  const q = sanitizeSearchQuery(query);
  if (!q) return true;
  return matchesContainsSearch(batchNumber, q) || matchesContainsSearch(receiptCode ?? "", q);
}

export function matchesDateRange(
  isoDate: string | null | undefined,
  from: string,
  to: string,
): boolean {
  const d = isoDate?.slice(0, 10) ?? "";
  if (!d) return !from && !to;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

/** Utilisasi kandang macan per batch: stok (kg) / kapasitas nominal × 100. */
export function resolveKandangUtilizationPct(
  stockKg: number,
  nominalCapacityKg?: number | string | null,
  fromApi?: number | string | null,
): number | null {
  const apiVal = toStockNumber(fromApi);
  if (apiVal > 0) return apiVal;
  if (stockKg <= 0) return null;
  const nominal = toStockNumber(nominalCapacityKg) > 0 ? toStockNumber(nominalCapacityKg) : KANDANG_NOMINAL_KG;
  return (stockKg / nominal) * 100;
}

export const STOCK_BREAKDOWN_STATUSES = ["FRESH", "WARNING", "EXPIRED"] as const;

export type StockBreakdownStatus = (typeof STOCK_BREAKDOWN_STATUSES)[number];
