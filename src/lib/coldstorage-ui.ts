/** Shared UI classes for Cold Storage module (light + dark). */

export const alertErrorClass =
  "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300";

export const alertSuccessClass =
  "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300";

export const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-dark-section dark:text-gray-100";

export const labelClass = "mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300";

export const textMuted = "text-sm text-gray-500 dark:text-gray-400";
export const textMutedXs = "text-xs text-gray-500 dark:text-gray-400";
export const textBody = "text-sm text-gray-600 dark:text-gray-200";
export const textBodySm = "text-gray-700 dark:text-gray-200";
export const textHeading = "text-gray-900 dark:text-gray-100";
export const textHeadingLg = "text-lg font-semibold text-gray-900 dark:text-gray-100";
export const tableTdClass = "text-gray-800 dark:text-gray-100";
export const tableTdMutedClass = "text-gray-600 dark:text-gray-200";
export const tableHeadClass =
  "border-b text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-300";

/** Tombol aksi sekunder biru muda (mis. View BAP). */
export const btnLightCyanClass =
  "inline-flex items-center rounded-lg bg-cyan/15 px-3 py-1.5 text-xs font-semibold text-cyan hover:bg-cyan/25 dark:bg-cyan/20 dark:text-cyan-300 dark:hover:bg-cyan/30";

export function requiredMark() {
  return " *";
}

export function formatDateDdMmYyyy(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const s = isoDate.trim().slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return isoDate;
}

export function periodYyyymmFromDateInput(isoDate: string): number {
  const s = isoDate.trim().slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return 0;
  return Number(`${m[1]}${m[2]}${m[3]}`);
}

/** Urutan periode opname: terbaru (YYYYMMDD) di atas. */
export function compareStockOpnamePeriodDesc(a: number, b: number): number {
  return b - a;
}

export function isStockOpnameDateAfterToday(isoDate: string): boolean {
  const s = isoDate.trim().slice(0, 10);
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return s > `${y}-${m}-${d}`;
}

export function formatPeriodDisplay(period: number): string {
  const s = String(period);
  if (s.length === 8) {
    return `${s.slice(6, 8)}/${s.slice(4, 6)}/${s.slice(0, 4)}`;
  }
  if (s.length === 6) {
    return `${s.slice(4, 6)}/${s.slice(0, 4)}`;
  }
  return s;
}
