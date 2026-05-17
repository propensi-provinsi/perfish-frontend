import type { StockCategoryStatus } from "@/types/coldstorage";

export function stockCategoryStatusBadgeClass(status: StockCategoryStatus | null | undefined): string {
  switch (status) {
    case "EXPIRED":
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    case "WARNING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200";
    case "FRESH":
      return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
    case "QUARANTINE":
      return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    case "DISPOSED":
      return "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}
