/** Warna teks utilisasi stok gudang — selaras dengan chart dashboard (≥90% merah, ≥70% kuning). */
export function utilizationTextClass(pct: number | null | undefined): string {
  const n = pct ?? 0;
  if (n >= 90) return "font-semibold tabular-nums text-red-600 dark:text-red-400";
  if (n >= 70) return "font-semibold tabular-nums text-amber-600 dark:text-amber-400";
  return "font-semibold tabular-nums text-green-600 dark:text-green-400";
}

export function utilizationBadgeClass(pct: number | null | undefined): string {
  const n = pct ?? 0;
  if (n >= 90) return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  if (n >= 70) return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
}

export function formatUtilizationPct(pct: number | null | undefined): string {
  if (pct == null || Number.isNaN(pct)) return "—";
  return `${pct.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function extractUtilizationItems(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: Record<string, unknown>[] }).items;
  }
  return [];
}

export function asUtilizationNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/** Rata-rata utilisasi per gudang — sama dengan tab Utilisasi di Dashboard. */
export function computeDashboardAverageUtilizationPct(items: Record<string, unknown>[]): number {
  if (!items.length) return 0;
  const sum = items.reduce((acc, row) => acc + asUtilizationNumber(row.utilizationPercent), 0);
  return sum / items.length;
}

export function utilizationForWarehouse(
  items: Record<string, unknown>[],
  warehouseId: number | "",
): number {
  if (!warehouseId) return computeDashboardAverageUtilizationPct(items);
  const match = items.find((row) => asUtilizationNumber(row.coldStorageId) === warehouseId);
  return match ? asUtilizationNumber(match.utilizationPercent) : 0;
}
