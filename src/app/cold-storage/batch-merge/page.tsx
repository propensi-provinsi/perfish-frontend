"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import Button from "@/components/ui/Button";
import { getColdStorages } from "@/lib/expiry";
import { listColdStorageStocks, mergeColdStorageBatches } from "@/lib/coldstorage-api";
import { alertErrorClass, inputClass, labelClass } from "@/lib/coldstorage-ui";
import type { ColdStorageData } from "@/types";
import type { BatchMergeResponseData, ColdStorageStockRow } from "@/types/coldstorage";

function eligibleForMerge(row: ColdStorageStockRow) {
  const qty = Number(row.jumlahStok ?? 0);
  return row.batchStatus === "AVAILABLE" && row.kategoriStatus !== "DISPOSED" && qty > 0;
}

function isRejectBatch(row: ColdStorageStockRow) {
  return row.qualityGrade === "REJECT";
}

function BatchMergePageInner() {
  const searchParams = useSearchParams();
  const presetCs = searchParams.get("coldStorageId");
  const presetSurvivor = searchParams.get("survivorBatchId");
  const lockedWarehouse = presetCs != null && presetCs !== "";

  const [coldStorages, setColdStorages] = useState<ColdStorageData[]>([]);
  const [warehouseId, setWarehouseId] = useState<number | "">("");
  const [rows, setRows] = useState<ColdStorageStockRow[]>([]);
  const [survivorId, setSurvivorId] = useState<number | "">("");
  const [donorIds, setDonorIds] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<BatchMergeResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lockedWarehouse && Number.isFinite(Number(presetCs))) {
      setWarehouseId(Number(presetCs));
    }
  }, [lockedWarehouse, presetCs]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const list = await getColdStorages();
        setColdStorages(list.filter((c) => c.isActive));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (warehouseId === "") {
      setRows([]);
      return;
    }
    void (async () => {
      setError(null);
      const data = await listColdStorageStocks({ warehouseId: Number(warehouseId) });
      setRows(data);
      setDonorIds(new Set());
      setResult(null);
      if (
        presetSurvivor != null &&
        presetCs != null &&
        String(warehouseId) === presetCs &&
        Number.isFinite(Number(presetSurvivor))
      ) {
        setSurvivorId(Number(presetSurvivor));
      } else {
        setSurvivorId("");
      }
    })();
  }, [warehouseId, presetCs, presetSurvivor]);

  const presetLabel = useMemo(() => {
    if (!lockedWarehouse || warehouseId === "") return null;
    const c = coldStorages.find((x) => x.coldStorageId === warehouseId);
    return c ? `${c.csCode} — ${c.csName}` : `Cold storage #${warehouseId}`;
  }, [coldStorages, lockedWarehouse, warehouseId]);

  const mergeableRows = useMemo(() => rows.filter(eligibleForMerge), [rows]);

  function toggleDonor(id: number) {
    if (id === survivorId) return;
    setDonorIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleMerge() {
    if (survivorId === "" || donorIds.size === 0) {
      setError("Pilih batch penerima dan minimal satu batch donor.");
      return;
    }
    const survivor = mergeableRows.find((r) => r.batchId === survivorId);
    const donors = mergeableRows.filter((r) => donorIds.has(r.batchId));
    if (survivor && donors.some((d) => isRejectBatch(d) !== isRejectBatch(survivor))) {
      setError("Tidak dapat menggabung batch reject dengan batch non-reject.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const data = await mergeColdStorageBatches({
        survivorBatchId: Number(survivorId),
        donorBatchIds: Array.from(donorIds),
      });
      setResult(data);
      if (warehouseId !== "") {
        const refreshed = await listColdStorageStocks({ warehouseId: Number(warehouseId) });
        setRows(refreshed);
        setDonorIds(new Set());
      }
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e instanceof Error ? e.message : "Gagal menggabung batch");
      setError(String(msg));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Gabung Batch (Kandang Macan)</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Menggabungkan beberapa batch yang memiliki species dan gudang yang sama, dengan jejak lineage donor tetap tersimpan.
        </p>
      </header>
      <ColdStorageModuleNav />

      {error && (
        <div className={alertErrorClass}>{error}</div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <label className={labelClass}>Cold storage</label>
        {lockedWarehouse && presetLabel ? (
          <div className="max-w-md rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-gray-900 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-gray-100">
            {presetLabel}
            <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">
              <Link href="/cold-storage/batch-merge" className="text-cyan hover:underline">
                Pilih gudang lain
              </Link>
            </p>
          </div>
        ) : (
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : "")}
            className={`max-w-md ${inputClass}`}
            disabled={loading}
          >
            <option value="">Pilih gudang...</option>
            {coldStorages.map((c) => (
              <option key={c.coldStorageId} value={c.coldStorageId}>
                {c.csCode} — {c.csName}
              </option>
            ))}
          </select>
        )}
      </section>

      {warehouseId !== "" && (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Batch AVAILABLE</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-2 py-2">Batch Penerima</th>
                  <th className="px-2 py-2">Batch Donor</th>
                  <th className="px-2 py-2">Batch</th>
                  <th className="px-2 py-2">Species</th>
                  <th className="px-2 py-2">Grade</th>
                  <th className="px-2 py-2">SKU</th>
                  <th className="px-2 py-2 text-right">Stok</th>
                </tr>
              </thead>
              <tbody>
                {mergeableRows.map((r) => (
                  <tr
                    key={r.batchId}
                    className={`border-b border-gray-100 dark:border-gray-800 ${isRejectBatch(r) ? "bg-red-50/50 dark:bg-red-950/20" : ""}`}
                  >
                    <td className="px-2 py-2">
                      <input
                        type="radio"
                        name="survivor"
                        checked={survivorId === r.batchId}
                        onChange={() => {
                          setSurvivorId(r.batchId);
                          setDonorIds((prev) => {
                            const next = new Set(prev);
                            next.delete(r.batchId);
                            return next;
                          });
                        }}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        disabled={survivorId === r.batchId}
                        checked={donorIds.has(r.batchId)}
                        onChange={() => toggleDonor(r.batchId)}
                      />
                    </td>
                    <td className="px-2 py-2 font-medium text-gray-900 dark:text-gray-100">
                      {r.batchNumber}
                      {isRejectBatch(r) ? (
                        <span className="ml-1.5 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300">
                          Reject
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2 text-gray-700 dark:text-gray-200">{r.speciesName ?? "—"}</td>
                    <td className="px-2 py-2 text-gray-700 dark:text-gray-200">
                      {r.gradeLabel ?? r.qualityGrade ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-gray-700 dark:text-gray-200">{r.fishSkuCode ?? "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-gray-700 dark:text-gray-200">
                      {r.jumlahStok ?? 0} {r.unit ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mergeableRows.length === 0 && (
              <p className="py-4 text-sm text-gray-500 dark:text-gray-400">Tidak ada batch AVAILABLE di gudang ini.</p>
            )}
          </div>
          <Button
            type="button"
            onClick={() => void handleMerge()}
            disabled={busy || survivorId === "" || donorIds.size === 0}
          >
            {busy ? "Menggabung..." : "Gabungkan"}
          </Button>
          {survivorId !== "" && donorIds.size > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              Preview: batch penerima akan menyerap {donorIds.size} batch donor. Jika total melebihi kapasitas nominal
              kandang macan 650 kg, sistem tetap menyimpan merge dengan warning.
            </div>
          )}
        </section>
      )}

      {result && (
        <section className="rounded-xl border border-green-200 bg-green-50/80 p-5 text-sm dark:border-green-900 dark:bg-green-950/30">
          <h3 className="font-semibold text-green-900 dark:text-green-100">Hasil penggabungan</h3>
          <p className="mt-1 text-green-800 dark:text-green-200">
            Survivor <strong>{result.survivorBatchNumber}</strong> — total{" "}
            <span className="tabular-nums">{String(result.survivorTotalQtyKg)}</span> kg
            {result.survivorFishSkuCode ? (
              <>
                {" "}
                · SKU survivor: <strong>{result.survivorFishSkuCode}</strong>
              </>
            ) : null}
          </p>
          {result.warnings?.length ? (
            <ul className="mt-2 list-disc pl-5 text-amber-900 dark:text-amber-200">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
          {result.lineage?.length ? (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Lineage donor</p>
              <ul className="mt-1 space-y-1 text-xs">
                {result.lineage.map((l) => (
                  <li key={l.donorBatchId}>
                    {l.donorBatchNumber} — inbound {l.donorInboundReceiptId ?? "—"} —{" "}
                    <span className="tabular-nums">{String(l.transferredQtyKg)}</span> kg
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <Link
            href={`/batch-activity/traceability`}
            className="mt-4 inline-flex rounded-lg border border-green-300 bg-white px-3 py-2 text-xs font-semibold text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:text-green-100"
          >
            Lihat traceability batch survivor
          </Link>
        </section>
      )}
    </div>
  );
}

export default function BatchMergePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={<div className="p-6 text-sm text-gray-500 dark:text-gray-400">Memuat…</div>}>
          <BatchMergePageInner />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
