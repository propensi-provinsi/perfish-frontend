"use client";

import { useEffect, useMemo, useState } from "react";

export const TABLE_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function useClientTablePagination<T>(
  items: T[],
  options?: {
    initialPageSize?: number;
    resetDeps?: unknown[];
  }
) {
  const initialPageSize = options?.initialPageSize ?? 10;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, options?.resetDeps ?? []);

  const visibleItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return {
    page,
    setPage,
    pageSize,
    setPageSize: changePageSize,
    totalPages,
    totalCount,
    visibleItems,
    resetPage: () => setPage(1),
  };
}

type ToolbarProps = {
  totalCount: number;
  itemLabel?: string;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  className?: string;
};

/** Baris di atas tabel: total + pilih baris per halaman (sama seperti Loading Bay). */
export function TableListPaginationToolbar({
  totalCount,
  itemLabel = "baris",
  pageSize,
  onPageSizeChange,
  className = "mb-3 flex flex-wrap items-center justify-between gap-2 text-sm",
}: ToolbarProps) {
  return (
    <div className={className}>
      <span className="text-gray-500 dark:text-gray-400">
        Total: <strong className="text-gray-900 dark:text-gray-100">{totalCount}</strong> {itemLabel}
      </span>
      <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <span>Baris per halaman</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-dark-section dark:text-gray-100"
        >
          {TABLE_PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

type FooterProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  /** Tampilkan footer (default: totalCount > 0) */
  show?: boolean;
  totalCount?: number;
  className?: string;
};

/** Navigasi halaman di bawah tabel (sama seperti Loading Bay). */
export function TableListPaginationFooter({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  show,
  totalCount = 0,
  className = "mt-4 flex flex-wrap items-center justify-between gap-2 text-sm",
}: FooterProps) {
  const visible = show ?? totalCount > 0;
  if (!visible) {
    return null;
  }

  return (
    <div className={className}>
      <p className="text-gray-500 dark:text-gray-400">
        Halaman {page} dari {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={disabled || page <= 1}
          className="rounded border border-gray-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200"
        >
          Sebelumnya
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          disabled={disabled || page >= totalPages}
          className="rounded border border-gray-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}
