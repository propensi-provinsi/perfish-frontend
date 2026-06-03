"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  TableListPaginationFooter,
  useClientTablePagination,
} from "@/components/ui/TableListPagination";
import { actionBtn } from "@/lib/ui-action";
import { formatDateDdMmYyyy } from "@/lib/coldstorage-ui";

export type BatchArrivalNotice = {
  batchId: number;
  batchNumber: string;
  subtitle?: string | null;
  tanggalMasuk?: string | null;
};

function loadSeenIds(storageKey: string): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is number => typeof v === "number"));
  } catch {
    return new Set();
  }
}

function persistSeenIds(storageKey: string, ids: Set<number>) {
  localStorage.setItem(storageKey, JSON.stringify([...ids]));
}

export function useBatchArrivalNotices(
  rows: BatchArrivalNotice[],
  storageKey: string,
): {
  notices: BatchArrivalNotice[];
  panelHidden: boolean;
  setPanelHidden: (hidden: boolean) => void;
  dismissNotice: (notice: BatchArrivalNotice) => void;
  dismissAllNotices: () => void;
} {
  const [seenIds, setSeenIds] = useState<Set<number>>(() => loadSeenIds(storageKey));
  const [initialized, setInitialized] = useState(false);
  const [panelHidden, setPanelHidden] = useState(false);

  useEffect(() => {
    if (initialized || rows.length === 0) return;
    const seen = loadSeenIds(storageKey);
    if (seen.size === 0) {
      const seed = new Set(rows.map((r) => r.batchId));
      persistSeenIds(storageKey, seed);
      setSeenIds(seed);
    } else {
      setSeenIds(seen);
    }
    setInitialized(true);
  }, [rows, storageKey, initialized]);

  const notices = useMemo(() => {
    if (!initialized) return [];
    return rows.filter((r) => !seenIds.has(r.batchId));
  }, [rows, seenIds, initialized]);

  function dismissNotice(notice: BatchArrivalNotice) {
    setSeenIds((prev) => {
      if (prev.has(notice.batchId)) return prev;
      const next = new Set(prev);
      next.add(notice.batchId);
      persistSeenIds(storageKey, next);
      return next;
    });
  }

  function dismissAllNotices() {
    setSeenIds((prev) => {
      const next = new Set(prev);
      for (const row of rows) next.add(row.batchId);
      persistSeenIds(storageKey, next);
      return next;
    });
  }

  return { notices, panelHidden, setPanelHidden, dismissNotice, dismissAllNotices };
}

export function BatchArrivalNoticePanel({
  title,
  notices,
  panelHidden,
  onHidePanel,
  onDismissNotice,
  renderNoticeAction,
}: {
  title: string;
  notices: BatchArrivalNotice[];
  panelHidden: boolean;
  onHidePanel: () => void;
  onDismissNotice: (notice: BatchArrivalNotice) => void;
  renderNoticeAction?: (notice: BatchArrivalNotice) => ReactNode;
}) {
  const pagination = useClientTablePagination(notices, {
    initialPageSize: 5,
    resetDeps: [notices.length],
  });

  if (panelHidden || notices.length === 0) return null;

  return (
    <div className="border-b border-gray-200 bg-amber-50/60 px-4 py-3 dark:border-gray-700 dark:bg-amber-950/20">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Baru</span>
          <button type="button" onClick={onHidePanel} className={actionBtn("neutral", "xs")}>
            Hide
          </button>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm">
        {pagination.visibleItems.map((notice) => (
          <li key={notice.batchId}>
            <button
              type="button"
              onClick={() => onDismissNotice(notice)}
              className="w-full rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-left text-cyan-950 transition hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-100 dark:hover:bg-cyan-950/50"
            >
              <span className="font-bold font-mono">{notice.batchNumber}</span>
              {notice.subtitle ? <span> — {notice.subtitle}</span> : null}
              {notice.tanggalMasuk ? (
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {" "}
                  (masuk {formatDateDdMmYyyy(notice.tanggalMasuk)})
                </span>
              ) : null}
              {renderNoticeAction?.(notice)}
            </button>
          </li>
        ))}
      </ul>
      {pagination.totalPages > 1 && (
        <div className="mt-2">
          <TableListPaginationFooter
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            onPageChange={pagination.setPage}
            show
          />
        </div>
      )}
    </div>
  );
}
