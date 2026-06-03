"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { ColdStoragePageGuard } from "@/components/cold-storage/ColdStorageModuleShell";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import ConfirmActionModal from "@/components/cold-storage/ConfirmActionModal";
import RejectBatchLegend from "@/components/cold-storage/RejectBatchLegend";
import { isInboundRejectBatchRow, rejectBatchRowClass } from "@/lib/batch-quality";
import Button from "@/components/ui/Button";
import {
  TableListPaginationFooter,
  TableListPaginationToolbar,
  useClientTablePagination,
} from "@/components/ui/TableListPagination";
import { getColdStorages } from "@/lib/expiry";
import {
  COLD_STORAGE_PENDING_APPROVAL_MSG,
  listColdStorageStocks,
  mergeColdStorageBatches,
} from "@/lib/coldstorage-api";
import { alertErrorClass, alertSuccessClass, inputClass, labelClass } from "@/lib/coldstorage-ui";
import type { ColdStorageData } from "@/types";
import type { BatchMergeResponseData, ColdStorageStockRow } from "@/types/coldstorage";

function eligibleForMerge(row: ColdStorageStockRow) {
  const qty = Number(row.jumlahStok ?? 0);
  return row.batchStatus === "AVAILABLE" && row.kategoriStatus !== "DISPOSED" && qty > 0;
}

function isRejectBatch(row: ColdStorageStockRow) {
  return isInboundRejectBatchRow(row);
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
  const mergePagination = useClientTablePagination(mergeableRows, {
    resetDeps: [warehouseId],
  });

  const survivorRow = useMemo(
    () => (survivorId === "" ? undefined : mergeableRows.find((r) => r.batchId === survivorId)),
    [mergeableRows, survivorId]
  );

  function donorCompatibleWith(survivor: ColdStorageStockRow, row: ColdStorageStockRow) {
    if (isRejectBatch(row) !== isRejectBatch(survivor)) return false;
    if (
      survivor.speciesId != null &&
      row.speciesId != null &&
      row.speciesId !== survivor.speciesId
    ) {
      return false;
    }
    return true;
  }

  function donorCompatibleWithSurvivor(row: ColdStorageStockRow) {
    if (!survivorRow) return true;
    return donorCompatibleWith(survivorRow, row);
  }

  function speciesMatchesSurvivor(row: ColdStorageStockRow) {
    if (!survivorRow) return true;
    if (survivorRow.speciesId == null || row.speciesId == null) return true;
    return row.speciesId === survivorRow.speciesId;
  }

  function selectSurvivor(batchId: number) {
    const row = mergeableRows.find((r) => r.batchId === batchId);
    if (!row) return;
    setSurvivorId(batchId);
    setDonorIds((prev) => {
      const next = new Set<number>();
      for (const id of prev) {
        if (id === batchId) continue;
        const d = mergeableRows.find((r) => r.batchId === id);
        if (d && donorCompatibleWith(row, d)) next.add(id);
      }
      return next;
    });
  }

  function toggleDonor(id: number) {
    if (id === survivorId) return;
    const row = mergeableRows.find((r) => r.batchId === id);
    if (row && survivorRow && !donorCompatibleWithSurvivor(row)) return;
    setDonorIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function doMerge() {
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
    if (
      survivor &&
      donors.some(
        (d) =>
          d.speciesId != null &&
          survivor.speciesId != null &&
          d.speciesId !== survivor.speciesId
      )
    ) {
      setError("Tidak dapat menggabung batch dengan species berbeda.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    setResult(null);
    try {
      const data = await mergeColdStorageBatches({
        survivorBatchId: Number(survivorId),
        donorBatchIds: Array.from(donorIds),
      });
      if (data.status === "pending") {
        setSuccess(data.message ?? COLD_STORAGE_PENDING_APPROVAL_MSG);
        setDonorIds(new Set());
        return;
      }
      setResult(data.data);
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
      setConfirmOpen(false);
    }
  }

  function handleMerge() {
    if (survivorId === "" || donorIds.size === 0) {
      setError("Pilih batch penerima dan minimal satu batch donor.");
      return;
    }
    setConfirmOpen(true);
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

      {error && <div className={alertErrorClass}>{error}</div>}
      {success && <div className={alertSuccessClass}>{success}</div>}

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
          <TableListPaginationToolbar
            totalCount={mergePagination.totalCount}
            itemLabel="batch"
            pageSize={mergePagination.pageSize}
            onPageSizeChange={mergePagination.setPageSize}
          />
          <RejectBatchLegend className="mb-3" />
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
                {mergePagination.visibleItems.map((r) => {
                  const speciesMismatch = survivorRow != null && !speciesMatchesSurvivor(r);
                  const donorDisabled =
                    survivorId === r.batchId ||
                    speciesMismatch ||
                    (survivorRow != null && !donorCompatibleWithSurvivor(r));
                  const rowMuted = speciesMismatch && survivorId !== r.batchId;
                  return (
                  <tr
                    key={r.batchId}
                    className={`border-b border-gray-100 dark:border-gray-800 ${
                      isRejectBatch(r) ? rejectBatchRowClass : ""
                    } ${rowMuted ? "opacity-50" : ""}`}
                  >
                    <td className="px-2 py-2">
                      <input
                        type="radio"
                        name="survivor"
                        checked={survivorId === r.batchId}
                        onChange={() => selectSurvivor(r.batchId)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        disabled={donorDisabled}
                        title={
                          donorDisabled && survivorRow && survivorId !== r.batchId
                            ? isRejectBatch(r) !== isRejectBatch(survivorRow)
                              ? "Donor harus sama jenisnya dengan batch penerima (reject atau non-reject)"
                              : "Donor harus memiliki species yang sama dengan batch penerima"
                            : undefined
                        }
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
                );
                })}
              </tbody>
            </table>
          </div>
          <TableListPaginationFooter
            page={mergePagination.page}
            totalPages={mergePagination.totalPages}
            totalCount={mergePagination.totalCount}
            onPageChange={mergePagination.setPage}
            show={mergePagination.totalCount > 0}
          />
            {mergeableRows.length === 0 && (
              <p className="py-4 text-sm text-gray-500 dark:text-gray-400">Tidak ada batch AVAILABLE di gudang ini.</p>
            )}
          <Button
            type="button"
            onClick={handleMerge}
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

      {confirmOpen && survivorRow && (
        <ConfirmActionModal
          title="Gabung Batch"
          message={`Yakin menggabung ${donorIds.size} batch donor ke batch penerima ${survivorRow.batchNumber}?`}
          confirmLabel="Gabungkan"
          busy={busy}
          onConfirm={() => void doMerge()}
          onCancel={() => setConfirmOpen(false)}
        />
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
            href={`/batch-activity/traceability?batchId=${result.survivorBatchId}`}
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
    <ColdStoragePageGuard>
      <AppShell>
        <Suspense fallback={<div className="p-6 text-sm text-gray-500 dark:text-gray-400">Memuat…</div>}>
          <BatchMergePageInner />
        </Suspense>
      </AppShell>
    </ColdStoragePageGuard>
  );
}
