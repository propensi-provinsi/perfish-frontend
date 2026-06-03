import type { ColdStorageApprovalOperationType } from "@/types/coldstorage";

export type ApprovalInboxPageConfig = {
  operationTypes: ColdStorageApprovalOperationType[];
  storageKey: string;
};

/** Menu key sidebar ↔ tipe operasi pending approval. */
export const PENDING_APPROVAL_MENU_KEY: Record<
  ColdStorageApprovalOperationType,
  string | null
> = {
  MOVE_BATCH: "cs-move",
  DISPOSAL: "cs-disposal",
  STOCK_OPNAME_POST: "cs-opname",
  BATCH_MERGE: "cs-merge",
};

export const COLD_STORAGE_APPROVAL_MENU_KEYS = Object.values(PENDING_APPROVAL_MENU_KEY).filter(
  (k): k is string => k != null,
);

export function countPendingApprovalsByMenuKey(
  rows: { operationType: ColdStorageApprovalOperationType }[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = PENDING_APPROVAL_MENU_KEY[row.operationType];
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function totalColdStoragePendingCount(counts: Record<string, number>): number {
  return COLD_STORAGE_APPROVAL_MENU_KEYS.reduce((sum, key) => sum + (counts[key] ?? 0), 0);
}

import type { MenuItem } from "@/lib/menu";

export function pendingCountForMenuSubtree(item: MenuItem, counts: Record<string, number>): number {
  const direct = counts[item.key] ?? 0;
  const nested = (item.children ?? []).reduce(
    (sum, child) => sum + pendingCountForMenuSubtree(child, counts),
    0,
  );
  return direct + nested;
}

export function approvalInboxConfigForPath(pathname: string): ApprovalInboxPageConfig | null {
  if (pathname.startsWith("/cold-storage/move-batch")) {
    return { operationTypes: ["MOVE_BATCH"], storageKey: "cs-approval-inbox-hidden-move" };
  }
  if (pathname.startsWith("/cold-storage/disposal")) {
    return { operationTypes: ["DISPOSAL"], storageKey: "cs-approval-inbox-hidden-disposal" };
  }
  if (pathname.startsWith("/cold-storage/stock-opname")) {
    return { operationTypes: ["STOCK_OPNAME_POST"], storageKey: "cs-approval-inbox-hidden-opname" };
  }
  if (pathname.startsWith("/cold-storage/batch-merge")) {
    return { operationTypes: ["BATCH_MERGE"], storageKey: "cs-approval-inbox-hidden-merge" };
  }
  return null;
}
