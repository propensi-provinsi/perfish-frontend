"use client";

import { useCallback, useEffect, useState } from "react";
import { listPendingColdStorageApprovals } from "@/lib/coldstorage-api";
import { countPendingApprovalsByMenuKey, totalColdStoragePendingCount } from "@/lib/coldstorage-approval-inbox";

const REFRESH_EVENT = "coldstorage-pending-approvals-changed";

export function notifyPendingApprovalsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REFRESH_EVENT));
  }
}

export function usePendingApprovalSidebarCounts(enabled: boolean, pathname?: string) {
  const [countsByMenuKey, setCountsByMenuKey] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) {
      setCountsByMenuKey({});
      return;
    }
    setLoading(true);
    try {
      const rows = await listPendingColdStorageApprovals();
      setCountsByMenuKey(countPendingApprovalsByMenuKey(rows));
    } catch {
      setCountsByMenuKey({});
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load, pathname]);

  useEffect(() => {
    if (!enabled) return;
    const onRefresh = () => void load();
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(REFRESH_EVENT, onRefresh);
  }, [enabled, load]);

  return {
    countsByMenuKey,
    totalColdStoragePending: totalColdStoragePendingCount(countsByMenuKey),
    loading,
    refresh: load,
  };
}
