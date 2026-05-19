/**
 * Batch reject mutu inbound (checkbox Sizing & Grading), terpisah dari grade A/B/C.
 */
export function isInboundRejectBatchRow(row: { inboundRejectBatch?: boolean | null }): boolean {
  return row.inboundRejectBatch === true;
}

/** Class untuk baris tabel batch reject (mutu). */
export const rejectBatchRowClass =
  "bg-red-50/80 dark:bg-red-950/30 border-l-4 border-l-red-500";
