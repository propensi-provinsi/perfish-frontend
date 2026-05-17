"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import { listLoadingBayBatches } from "@/lib/coldstorage-api";
import { actionBtn } from "@/lib/ui-action";
import type { LoadingBayBatchRow } from "@/types/coldstorage";
import { stockCategoryStatusBadgeClass } from "@/lib/coldstorage-status";
import { textBodySm } from "@/lib/coldstorage-ui";
import BatchQrCode from "@/components/cold-storage/BatchQrCode";
import { batchDetailHref } from "@/lib/batch-detail-url";

function shortColdStorageLabel(full: string | null | undefined): string {
  if (!full) return "—";
  const sep = " — ";
  const i = full.indexOf(sep);
  if (i === -1) return full.trim();
  const right = full.slice(i + sep.length).trim();
  return right || full.trim();
}

function formatDateDdMmYyyy(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const s = isoDate.trim().slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return isoDate;
}

function fmtQty(v: number | string | null | undefined): string {
  if (v == null) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);
}

export default function LoadingBayPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <LoadingBayContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function LoadingBayContent() {
  const [rows, setRows] = useState<LoadingBayBatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLoadingBayBatches(search.trim());
      setRows(data);
      setPage(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat loading bay");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visibleRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [page, pageSize, rows]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Loading Bay</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
            Lokasi penyimpanan sementara untuk batch (kandang macan) yang telah diterima
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Cari batch / species
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              placeholder="Nomor batch atau nama ikan…"
              className="mt-1 block w-full min-w-[200px] max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section dark:text-gray-100"
            />
          </label>
          <button type="button" onClick={() => void load()} disabled={loading} className={actionBtn("primary", "sm")}>
            Cari
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Total: <strong className="text-gray-900 dark:text-gray-100">{rows.length}</strong> batch
          </span>
          <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span>Baris per halaman</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-dark-section dark:text-gray-100"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <th className="px-3 py-2">Kode Penerimaan</th>
                <th className="px-3 py-2">Lokasi Penerimaan</th>
                <th className="px-3 py-2">Batch</th>
                <th className="px-3 py-2">Species</th>
                <th className="px-3 py-2 text-right">Stok (kg)</th>
                <th className="px-3 py-2">Tanggal Masuk</th>
                <th className="px-3 py-2">Umur Simpan</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-center">QR Code</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-gray-500 dark:text-gray-400">
                    Memuat…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-gray-500 dark:text-gray-400">
                    Tidak ada batch di loading bay. Batch baru muncul setelah penerimaan inbound di-approve dan belum
                    diberi lokasi rack.
                  </td>
                </tr>
              ) : (
                visibleRows.map((r) => (
                  <tr key={r.batchId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className={`px-3 py-2 font-mono text-xs ${textBodySm}`}>{r.inboundReceiptCode ?? "—"}</td>
                    <td className={`px-3 py-2 max-w-[200px] truncate ${textBodySm}`} title={r.lokasiPenerimaan ?? undefined}>
                      {shortColdStorageLabel(r.lokasiPenerimaan)}
                    </td>
                    <td className="px-3 py-2 font-mono font-medium text-gray-900 dark:text-gray-100">{r.batchNumber}</td>
                    <td className={`px-3 py-2 ${textBodySm}`}>{r.fishSpeciesName ?? "—"}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${textBodySm}`}>{fmtQty(r.currentQuantity)}</td>
                    <td className={`px-3 py-2 whitespace-nowrap ${textBodySm}`}>{formatDateDdMmYyyy(r.tanggalMasuk)}</td>
                    <td className={`px-3 py-2 ${textBodySm}`}>
                      {r.umurSimpanDays != null ? (
                        <>
                          {r.umurSimpanDays} hari
                          {(r.umurSimpanBulan ?? 0) > 0 && (
                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                              ({r.umurSimpanBulan} bln)
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stockCategoryStatusBadgeClass(r.kategoriStatus ?? "FRESH")}`}
                      >
                        {r.kategoriStatus ?? "FRESH"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center">
                        <BatchQrCode batchNumber={r.batchNumber} size={56} />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <Link href={batchDetailHref(r.batchNumber)} className={actionBtn("neutral", "xs")}>
                          View Detail
                        </Link>
                        <Link
                          href={`/cold-storage/assign-location?batchId=${r.batchId}`}
                          className={actionBtn("primary", "xs")}
                        >
                          Tetapkan Lokasi
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-gray-500 dark:text-gray-400">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
                className="rounded border border-gray-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages}
                className="rounded border border-gray-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
