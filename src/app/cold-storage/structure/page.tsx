"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/Button";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import PositionStatusBadge from "@/components/cold-storage/PositionStatusBadge";
import { listColdStorageStructureSummaries } from "@/lib/coldstorage-api";
import type { ColdStorageStructureSummary } from "@/types/coldstorage";

function fmtKg(v: number | string | null | undefined) {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : v;
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg`;
}

function fmtTon(v: number | string | null | undefined) {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : v;
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("id-ID", { maximumFractionDigits: 4 })} t`;
}

function fmtPct(v: number | null | undefined) {
  if (v == null) return "—";
  return `${Number(v).toFixed(1)}%`;
}

function ColdStorageStructurePageInner() {
  const [rows, setRows] = useState<ColdStorageStructureSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listColdStorageStructureSummaries();
        setRows(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat ringkasan cold storage");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy dark:text-white">Struktur Cold Storage</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ringkasan block, rack, dan posisi per cold storage. Buka detail untuk hierarki lengkap.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => {
                void (async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    const data = await listColdStorageStructureSummaries();
                    setRows(data);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Gagal memuat ringkasan cold storage");
                  } finally {
                    setLoading(false);
                  }
                })();
              }}
            >
              Segarkan
            </Button>
          </div>
        </div>
      </header>
      <ColdStorageModuleNav />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-card">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Memuat...</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700">
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Cabang</th>
                <th className="px-4 py-3 text-right">Block</th>
                <th className="px-4 py-3 text-right">Rack</th>
                <th className="px-4 py-3 text-right">Posisi</th>
                <th className="px-4 py-3 text-right">Stok (ton)</th>
                <th className="px-4 py-3 text-right">Okupansi posisi</th>
                <th className="px-4 py-3">Status posisi</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.coldStorageId} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{r.csCode}</td>
                  <td className="px-4 py-2">{r.csName}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                    {r.branchCode ?? "—"}
                    {r.branchName ? ` · ${r.branchName}` : ""}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.blockCount}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.rackCount}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.positionCount}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    {fmtTon(r.totalStockTon ?? null)}
                    <div className="text-[11px] font-normal text-gray-500">{fmtKg(r.totalStockKg)}</div>
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-gray-700 dark:text-gray-300">
                    <span className="tabular-nums">{fmtPct(r.positionOccupancyRatePct ?? null)}</span>
                    <div className="text-[11px] text-gray-500">
                      {r.occupiedPositionCount != null && r.availablePositionCount != null
                        ? `${r.occupiedPositionCount} terisi · ${r.availablePositionCount} kosong`
                        : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(r.positionCountByStatus ?? {}).length === 0 ? (
                        <span className="text-xs text-gray-500">—</span>
                      ) : (
                        Object.entries(r.positionCountByStatus ?? {}).map(([k, v]) => (
                          <span
                            key={k}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-1.5 py-0.5 dark:bg-gray-800"
                          >
                            <PositionStatusBadge status={k} />
                            <span className="text-xs tabular-nums text-gray-600 dark:text-gray-300">{v}</span>
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <Link
                        href={`/cold-storage/structure/${r.coldStorageId}`}
                        className="inline-flex rounded-lg bg-cyan px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-hover"
                      >
                        Lihat detail
                      </Link>
                      <Link
                        href={`/cold-storage/stock-opname?coldStorageId=${r.coldStorageId}`}
                        className="text-xs font-medium text-cyan hover:underline"
                      >
                        Stock opname
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && rows.length === 0 && (
          <p className="p-6 text-sm text-gray-500">Belum ada data cold storage.</p>
        )}
      </section>
    </div>
  );
}

export default function ColdStorageStructurePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ColdStorageStructurePageInner />
      </AppShell>
    </ProtectedRoute>
  );
}
