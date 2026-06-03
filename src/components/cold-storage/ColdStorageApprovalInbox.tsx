"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ConfirmActionModal from "@/components/cold-storage/ConfirmActionModal";
import { canReviewColdStorageApproval, canViewColdStorageApprovals } from "@/lib/rbac";
import {
  approveColdStorageRequest,
  downloadPendingApprovalBeritaAcara,
  listPendingColdStorageApprovals,
  rejectColdStorageRequest,
} from "@/lib/coldstorage-api";
import { notifyPendingApprovalsChanged } from "@/hooks/usePendingApprovalSidebarCounts";
import { formatIdDateTime, resolveActorDisplay } from "@/lib/coldstorage-format";
import { alertErrorClass, alertSuccessClass } from "@/lib/coldstorage-ui";
import { actionBtn } from "@/lib/ui-action";
import type { ColdStorageApprovalOperationType, ColdStorageApprovalRequest } from "@/types/coldstorage";

const OP_LABEL: Record<ColdStorageApprovalOperationType, string> = {
  MOVE_BATCH: "Pemindahan Batch",
  DISPOSAL: "Disposal",
  BATCH_MERGE: "Gabung Batch",
  STOCK_OPNAME_POST: "Posting Stock Opname",
};

const LINE_CLASS =
  "rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-cyan-950 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-100";

type ConfirmState =
  | { kind: "approve"; request: ColdStorageApprovalRequest }
  | { kind: "reject"; request: ColdStorageApprovalRequest };

function loadHidden(storageKey: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(storageKey) === "1";
}

function persistHidden(storageKey: string, hidden: boolean) {
  if (hidden) {
    localStorage.setItem(storageKey, "1");
  } else {
    localStorage.removeItem(storageKey);
  }
}

export default function ColdStorageApprovalInbox({
  operationTypes,
  storageKey = "cs-approval-inbox-hidden",
}: {
  operationTypes: ColdStorageApprovalOperationType[];
  storageKey?: string;
}) {
  const { user } = useAuth();
  const canView = canViewColdStorageApprovals(user?.role);
  const canReview = canReviewColdStorageApproval(user?.role);

  const [rows, setRows] = useState<ColdStorageApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [hidden, setHidden] = useState(false);
  const [mergeTraceability, setMergeTraceability] = useState<{
    batchId: number;
    batchNumber: string;
  } | null>(null);

  useEffect(() => {
    setHidden(loadHidden(storageKey));
  }, [storageKey]);

  const filteredRows = useMemo(
    () => rows.filter((r) => operationTypes.includes(r.operationType)),
    [rows, operationTypes],
  );

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listPendingColdStorageApprovals();
      setRows(data);
      notifyPendingApprovalsChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat permintaan pending");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canView) return null;

  function hidePanel() {
    setHidden(true);
    persistHidden(storageKey, true);
  }

  function showPanel() {
    setHidden(false);
    persistHidden(storageKey, false);
  }

  async function handleViewBap(requestId: string) {
    setBusyId(requestId);
    setError(null);
    try {
      const { blob } = await downloadPendingApprovalBeritaAcara(requestId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuka Berita Acara Pemusnahan");
    } finally {
      setBusyId(null);
    }
  }

  async function executeConfirm() {
    if (!confirm) return;
    const { request } = confirm;
    setBusyId(request.requestId);
    setError(null);
    setSuccess(null);
    try {
      if (confirm.kind === "approve") {
        const result = await approveColdStorageRequest(request.requestId);
        if (request.operationType === "BATCH_MERGE" && result.traceabilityBatchId) {
          setMergeTraceability({
            batchId: result.traceabilityBatchId,
            batchNumber: result.traceabilityBatchNumber ?? `#${result.traceabilityBatchId}`,
          });
          setSuccess("Permintaan gabung batch disetujui.");
        } else {
          setSuccess("Permintaan disetujui.");
        }
      } else {
        await rejectColdStorageRequest(request.requestId);
        setSuccess("Permintaan ditolak.");
      }
      setConfirm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memproses permintaan");
    } finally {
      setBusyId(null);
    }
  }

  if (hidden) {
    if (loading && filteredRows.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <span className="text-gray-700 dark:text-gray-200">
          Persetujuan Pending
          {filteredRows.length > 0 && (
            <span className="ml-2 inline-flex rounded-full bg-cyan/15 px-2 py-0.5 text-xs font-bold text-cyan dark:bg-cyan/25 dark:text-cyan-200">
              {filteredRows.length}
            </span>
          )}
        </span>
        <button type="button" onClick={showPanel} className={actionBtn("neutral", "xs")}>
          Tampilkan
        </button>
      </div>
    );
  }

  if (!loading && filteredRows.length === 0 && !error && !success && !mergeTraceability) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Persetujuan Pending
          {filteredRows.length > 0 && (
            <span className="ml-2 inline-flex rounded-full bg-cyan/15 px-2 py-0.5 text-xs font-bold text-cyan dark:bg-cyan/25 dark:text-cyan-200">
              {filteredRows.length}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className={actionBtn("neutral", "xs")}
          >
            {loading ? "Memuat…" : "Refresh"}
          </button>
          <button type="button" onClick={hidePanel} className={actionBtn("neutral", "xs")}>
            Hide
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        {error && <div className={`mb-3 ${alertErrorClass}`}>{error}</div>}
        {success && <div className={`mb-3 ${alertSuccessClass}`}>{success}</div>}

        {mergeTraceability && (
          <div className={`mb-3 ${alertSuccessClass} flex flex-wrap items-center justify-between gap-2`}>
            <span>
              Batch survivor <strong>{mergeTraceability.batchNumber}</strong> siap dilacak.
            </span>
            <Link
              href={`/batch-activity/traceability?batchId=${mergeTraceability.batchId}`}
              className={actionBtn("primary", "sm")}
            >
              Traceability &amp; Flow
            </Link>
          </div>
        )}

        {loading && filteredRows.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Memuat permintaan…</p>
        ) : filteredRows.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Tidak ada permintaan menunggu persetujuan.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {filteredRows.map((r) => (
              <li key={r.requestId} className={`${LINE_CLASS} flex flex-wrap items-center justify-between gap-3`}>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{OP_LABEL[r.operationType] ?? r.operationType}</p>
                  {r.summaryText && (
                    <p className="mt-0.5 whitespace-pre-line text-xs opacity-90">{r.summaryText}</p>
                  )}
                  <p className="mt-1 text-[11px] opacity-75">
                    <strong>{formatIdDateTime(r.requestedAt)}</strong>
                    {" · oleh "}
                    {resolveActorDisplay(r.requestedBy, r.requestedByName)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {r.operationType === "DISPOSAL" && r.beritaAcaraStoredName && (
                    <button
                      type="button"
                      disabled={busyId === r.requestId}
                      onClick={() => void handleViewBap(r.requestId)}
                      className={actionBtn("neutral", "sm")}
                    >
                      View BAP
                    </button>
                  )}
                  {r.operationType === "STOCK_OPNAME_POST" && r.relatedSessionId != null && (
                    <Link
                      href={`/cold-storage/stock-opname?sessionId=${r.relatedSessionId}`}
                      className={actionBtn("neutral", "sm")}
                    >
                      View Draft
                    </Link>
                  )}
                  {canReview && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === r.requestId}
                        onClick={() => setConfirm({ kind: "approve", request: r })}
                        className={actionBtn("primary", "sm")}
                      >
                        Setujui
                      </button>
                      <button
                        type="button"
                        disabled={busyId === r.requestId}
                        onClick={() => setConfirm({ kind: "reject", request: r })}
                        className={actionBtn("neutral", "sm")}
                      >
                        Tolak
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirm && (
        <ConfirmActionModal
          title={confirm.kind === "approve" ? "Setujui permintaan?" : "Tolak permintaan?"}
          message={
            confirm.kind === "approve"
              ? "Yakin ingin menyetujui permintaan ini? Operasi akan dieksekusi setelah disetujui."
              : "Yakin ingin menolak permintaan ini?"
          }
          confirmLabel={confirm.kind === "approve" ? "Ya, setujui" : "Ya, tolak"}
          busy={busyId === confirm.request.requestId}
          onConfirm={() => void executeConfirm()}
          onCancel={() => setConfirm(null)}
        />
      )}
    </section>
  );
}
