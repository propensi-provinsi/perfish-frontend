"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { ColdStoragePageGuard } from "@/components/cold-storage/ColdStorageModuleShell";
import Button from "@/components/ui/Button";
import PositionStatusBadge from "@/components/cold-storage/PositionStatusBadge";
import { formatTonLabel } from "@/lib/coldstorage-format";
import { getColdStorageStructureDetail } from "@/lib/coldstorage-api";
import { alertErrorClass } from "@/lib/coldstorage-ui";
import {
  formatUtilizationPct,
  utilizationBadgeClass,
} from "@/lib/utilization-display";
import type { ColdStorageStructureDetail } from "@/types/coldstorage";

function fmtKg(v: number | string | null | undefined) {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : v;
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg`;
}

function fmtPct(v: number | null | undefined) {
  if (v == null) return "—";
  return `${Number(v).toFixed(1)}%`;
}

function ColdStorageStructureDetailInner() {
  const params = useParams();
  const id = Number(params.id);
  const [data, setData] = useState<ColdStorageStructureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const d = await getColdStorageStructureDetail(id);
        setData(d);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat detail");
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/cold-storage/structure" className="text-sm text-cyan hover:underline">
            ← Kembali ke daftar
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-navy dark:text-white">
            {data ? `${data.csCode} — ${data.csName}` : "Detail Cold Storage"}
          </h1>
        </div>
        {Number.isFinite(id) && (
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
                    const d = await getColdStorageStructureDetail(id);
                    setData(d);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Gagal memuat detail");
                    setData(null);
                  } finally {
                    setLoading(false);
                  }
                })();
              }}
            >
              Refresh
            </Button>
            <Link
              href={`/cold-storage/stock-opname?coldStorageId=${id}`}
              className="inline-flex items-center rounded-lg bg-cyan px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-hover"
            >
              Stock opname
            </Link>
          </div>
        )}
      </div>
      {error && (
        <div className={alertErrorClass}>{error}</div>
      )}

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>}

      {!loading && data && (
        <>
          <section className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-700 dark:bg-dark-card md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Block Aktif</p>
              <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">{data.blockCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rack Aktif</p>
              <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">{data.rackCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Posisi Aktif</p>
              <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">{data.positionCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Stok</p>
              <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">{formatTonLabel(data.totalStockTon ?? null)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{fmtKg(data.totalStockKg)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Kapasitas</p>
              <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">{formatTonLabel(data.capacityTon ?? null)}</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${utilizationBadgeClass(data.stockUtilizationPct ?? null)}`}
              >
                {formatUtilizationPct(data.stockUtilizationPct ?? null)} terpakai
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Okupansi posisi</p>
              <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">{fmtPct(data.positionOccupancyRatePct ?? null)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {data.occupiedPositionCount != null && data.availablePositionCount != null
                  ? `${data.occupiedPositionCount} terisi · ${data.availablePositionCount} kosong`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Per status posisi</p>
              <p className="flex flex-wrap gap-1.5 text-xs">
                {Object.entries(data.positionCountByStatus ?? {}).length === 0 ? (
                  <span className="text-gray-500 dark:text-gray-400">—</span>
                ) : (
                  Object.entries(data.positionCountByStatus ?? {}).map(([k, v]) => (
                    <span key={k} className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 dark:bg-gray-800">
                      <PositionStatusBadge status={k} />
                      <span className="tabular-nums text-gray-600 dark:text-gray-200">{v}</span>
                    </span>
                  ))
                )}
              </p>
            </div>
          </section>

          <div className="space-y-6">
            {data.blocks?.map((block) => (
              <section
                key={block.blockId}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {block.blockCode} ({block.blockName})
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {block.blockCapacity != null && block.blockCapacity > 0
                    ? `Kapasitas block (maks. rack): ${block.blockCapacity}`
                    : `Rack terpasang: ${block.racks?.length ?? 0}`}
                </p>
                <div className="mt-4 space-y-4">
                  {(block.racks ?? []).map((rack) => (
                    <div key={rack.rackId} className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                      <h3 className="font-medium text-gray-800 dark:text-gray-200">{rack.rackCode}</h3>
                      <div className="mt-2 overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead>
                            <tr className="text-left text-gray-500 dark:text-gray-400">
                              <th className="py-1 pr-3">Kode Posisi</th>
                              <th className="py-1 pr-3">Status</th>
                              <th className="py-1 pr-3">Batch</th>
                              <th className="py-1 pr-3 text-right">Stok (kg)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(rack.positions ?? []).map((p) => (
                              <tr key={p.positionId} className="border-t border-gray-50 dark:border-gray-800">
                                <td className="py-1 pr-3 font-mono text-gray-900 dark:text-gray-100">{p.positionCode}</td>
                                <td className="py-1 pr-3">
                                  <PositionStatusBadge status={p.status} />
                                </td>
                                <td className="py-1 pr-3 text-gray-700 dark:text-gray-200">
                                  {p.occupantBatchNumber ? (
                                    <span title={`Batch #${p.occupantBatchId ?? ""}`}>{p.occupantBatchNumber}</span>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="py-1 pr-3 text-right tabular-nums text-gray-700 dark:text-gray-200">
                                  {p.occupantStockKg != null && p.occupantStockKg !== ""
                                    ? fmtKg(p.occupantStockKg)
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {(rack.positions ?? []).length === 0 && (
                          <p className="text-xs text-gray-400">Tidak ada posisi aktif.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ColdStorageStructureDetailPage() {
  return (
    <ColdStoragePageGuard>
      <AppShell>
        <ColdStorageStructureDetailInner />
      </AppShell>
    </ColdStoragePageGuard>
  );
}
