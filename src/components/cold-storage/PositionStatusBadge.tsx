"use client";

/**
 * Badge status posisi cold storage (konsisten di halaman struktur & ringkasan).
 */
export default function PositionStatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status ?? "").trim().toUpperCase();
  const label = s || "—";
  const cls =
    s === "AVAILABLE"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/45 dark:text-emerald-100"
      : s === "OCCUPIED"
        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/45 dark:text-orange-100"
        : s === "RESERVED"
          ? "bg-cyan/15 text-cyan dark:bg-cyan/25 dark:text-cyan"
          : s === "MAINTENANCE"
            ? "bg-red/15 text-red dark:bg-red/25 dark:text-red-light"
            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>
  );
}
