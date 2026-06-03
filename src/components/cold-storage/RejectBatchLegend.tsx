/** Legenda warna baris batch reject (mutu) di tabel cold storage / loading bay. */
export default function RejectBatchLegend({
  className = "",
  label = "Batch Reject Mutu",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400 ${className}`}
      role="note"
    >
      <span className="font-medium text-gray-700 dark:text-gray-300">Legenda:</span>
      <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 dark:border-red-800 dark:bg-red-950/40">
        <span className="h-3 w-3 rounded-sm border-l-4 border-l-red-500 bg-red-100 dark:bg-red-900/50" aria-hidden />
        {label}
      </span>
    </div>
  );
}
