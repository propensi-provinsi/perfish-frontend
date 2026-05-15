"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import { listLoadingBayBatches } from "@/lib/coldstorage-api";
import type { LoadingBayBatchRow } from "@/types/coldstorage";

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLoadingBayBatches(search.trim());
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat loading bay");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-cyan">Storage</p>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Loading Bay</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
            Batch yang sudah <strong>di-approve</strong> pada Inbound Ikan berstatus <strong>AVAILABLE</strong> dan belum
            memiliki lokasi rack otomatis tercatat di sini. Untuk memasukkan batch ke cold storage, gunakan menu{" "}
            <Link href="/cold-storage/assign-location" className="font-medium text-cyan hover:underline">
              Penentuan Lokasi
            </Link>
            . Pengeluaran stok (misalnya alokasi sales order / FEFO) dapat memakai batch dari loading bay maupun yang
            sudah bertempat di cold storage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
          <Link
            href="/cold-storage/assign-location"
            className="inline-flex items-center rounded-lg bg-cyan px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Penentuan Lokasi
          </Link>
        </div>
      </header>

      <ColdStorageModuleNav />

      <section className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        <strong>Alur singkat:</strong> approve inbound → batch masuk loading bay → tentukan lokasi rack → batch
        tampil di Monitor Stok cold storage.
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
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
              className="mt-1 block w-full min-w-[200px] max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
            />
          </label>
          <Button type="button" size="sm" onClick={() => void load()} disabled={loading}>
            Cari
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700">
                <th className="px-3 py-2">Batch</th>
                <th className="px-3 py-2">Species</th>
                <th className="px-3 py-2 text-right">Stok</th>
                <th className="px-3 py-2">Satuan</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-gray-500">
                    Memuat…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-gray-500">
                    Tidak ada batch di loading bay. Batch baru muncul setelah penerimaan inbound di-approve dan belum
                    diberi lokasi rack.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.batchId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2 font-mono font-medium text-gray-900 dark:text-gray-100">{r.batchNumber}</td>
                    <td className="px-3 py-2">{r.fishSpeciesName ?? "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtQty(r.currentQuantity)}</td>
                    <td className="px-3 py-2">{r.unit ?? "—"}</td>
                    <td className="px-3 py-2">{r.status ?? "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/cold-storage/assign-location?batchId=${r.batchId}`}
                        className="font-medium text-cyan hover:underline"
                      >
                        Tetapkan lokasi
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
