"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { ModalOverlay, Field } from "@/components/inbound-fish/ModalPrimitives";
import { useAuth } from "@/context/AuthContext";
import {
  type InboundReceiptRow,
  type PalletizationBatch,
  type PoReceiveComparison,
  type PurchaseOrderRow,
  approveInbound,
  comparePoInboundKg,
  getInboundReceipt,
  getPurchaseOrder,
  getReceiptBatches,
  poReceiveComparisonBadgeClass,
  poReceiveComparisonLabel,
  poReceiveComparisonMessage,
  rejectInbound,
} from "@/lib/inbound-api";
import { actionBtn } from "@/lib/ui-action";
import { canApproveInboundReceipt, INBOUND_RECEIPT_READ_ROLES } from "@/lib/rbac";
import { QRCodeSVG } from "qrcode.react";
import { printBatchQrCodes } from "@/lib/print-batch-qr";

function fmtKg(v: number | string | null | undefined): string {
  const n = typeof v === "string" ? Number(v) : v;
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(n);
}

function toNumKg(v: number | string | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function fmtGradeLabel(code: string | null | undefined): string {
  if (!code) return "—";
  return code;
}

function isInboundRejectBatch(b: PalletizationBatch): boolean {
  return b.inboundRejectBatch === true;
}

function formatDateDdMmYyyy(isoDate: string): string {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

function normalizePoLineSize(size: string | null | undefined): string {
  return (size ?? "").trim().toLowerCase() || "-";
}

function poLineKey(speciesId: number | null | undefined, size: string | null | undefined): string {
  return `${speciesId ?? ""}|${normalizePoLineSize(size)}`;
}

function receivedKgForPoDetail(
  detail: { speciesId: number | null; speciesName: string | null; itemSize: string | null },
  batches: PalletizationBatch[],
  lines: InboundReceiptRow["lines"],
): number {
  const speciesName = (detail.speciesName ?? "").trim().toLowerCase();
  if (batches.length > 0) {
    return batches
      .filter((b) => !isInboundRejectBatch(b) && (b.speciesName ?? "").trim().toLowerCase() === speciesName)
      .reduce((sum, b) => sum + toNumKg(b.netWeightKg), 0);
  }
  const line = lines.find(
    (l) => l.speciesId === detail.speciesId && normalizePoLineSize(l.size) === normalizePoLineSize(detail.itemSize),
  );
  if (!line) return 0;
  return toNumKg(line.acceptedWeightKg) || toNumKg(line.qcTotalBeratKg);
}

type PoExtraSpeciesRow = {
  speciesId: number;
  speciesName: string;
  size: string;
  receivedKg: number;
};

function extraSpeciesBeyondPo(
  poDetails: PurchaseOrderRow["details"],
  batches: PalletizationBatch[],
  lines: InboundReceiptRow["lines"],
): PoExtraSpeciesRow[] {
  const poKeys = new Set(poDetails.map((d) => poLineKey(d.speciesId, d.itemSize)));
  const extras: PoExtraSpeciesRow[] = [];
  const seenLineKeys = new Set<string>();

  for (const line of lines) {
    const key = poLineKey(line.speciesId, line.size);
    if (poKeys.has(key) || seenLineKeys.has(key)) continue;
    seenLineKeys.add(key);
    const speciesName = line.speciesName;
    const receivedKg =
      batches.length > 0
        ? batches
            .filter((b) => !isInboundRejectBatch(b) && (b.speciesName ?? "").trim() === speciesName.trim())
            .reduce((sum, b) => sum + toNumKg(b.netWeightKg), 0)
        : toNumKg(line.acceptedWeightKg) || toNumKg(line.qcTotalBeratKg);
    extras.push({
      speciesId: line.speciesId,
      speciesName,
      size: line.size,
      receivedKg,
    });
  }
  return extras;
}

export default function InboundSummaryPage() {
  return (
    <ProtectedRoute allowedRoles={INBOUND_RECEIPT_READ_ROLES}>
      <AppShell>
        <InboundSummaryContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function InboundSummaryContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const receiptId = params.id;
  const [receipt, setReceipt] = useState<InboundReceiptRow | null>(null);
  const [batches, setBatches] = useState<PalletizationBatch[]>([]);
  const [po, setPo] = useState<PurchaseOrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getInboundReceipt(receiptId);
      const [b, poData] = await Promise.all([
        getReceiptBatches(receiptId),
        r.poId != null ? getPurchaseOrder(r.poId).catch(() => null) : Promise.resolve(null),
      ]);
      setReceipt(r);
      setBatches(b);
      setPo(poData);
    } catch {
      setMsg({ type: "error", text: "Gagal memuat data." });
    } finally {
      setLoading(false);
    }
  }, [receiptId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleApprove() {
    setProcessing(true);
    setMsg(null);
    try {
      await approveInbound(receiptId);
      setShowApproveConfirm(false);
      setMsg({ type: "success", text: "Penerimaan berhasil di-approve." });
      await load();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setMsg({ type: "error", text: axiosErr.response?.data?.message || "Gagal approve." });
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setProcessing(true);
    setMsg(null);
    try {
      await rejectInbound(receiptId, rejectReason.trim());
      setShowRejectModal(false);
      setRejectReason("");
      setMsg({ type: "success", text: "Penerimaan berhasil di-reject." });
      await load();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setMsg({ type: "error", text: axiosErr.response?.data?.message || "Gagal reject." });
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <p className="p-8 text-center text-gray-500">Memuat…</p>;
  if (!receipt) return <p className="p-8 text-center text-gray-500">Data tidak ditemukan.</p>;

  const totalGrossKg = receipt.lines.reduce((sum, l) => sum + (Number(l.qcTotalBeratKg) || 0), 0);
  const lineRejectedKg = receipt.lines.reduce((sum, l) => sum + (Number(l.rejectedWeight) || 0), 0);
  const lineAcceptedKg = receipt.lines.reduce((sum, l) => sum + (Number(l.acceptedWeightKg) || 0), 0);

  const totalBatchNetKg = batches.reduce((s, b) => s + toNumKg(b.netWeightKg), 0);
  const totalRejectedBatchKg = batches.filter(isInboundRejectBatch).reduce((s, b) => s + toNumKg(b.netWeightKg), 0);
  const totalNormalBatchKg = batches.filter((b) => !isInboundRejectBatch(b)).reduce((s, b) => s + toNumKg(b.netWeightKg), 0);

  const summaryRejectedKg = batches.length > 0 ? totalRejectedBatchKg : lineRejectedKg;
  const summaryNormalKg = batches.length > 0 ? totalNormalBatchKg : lineAcceptedKg;

  const poOrderedTotalKg =
    po?.details?.reduce((s, d) => s + (d.orderedWeightKg != null ? Number(d.orderedWeightKg) : 0), 0) ?? 0;
  const poReceiveStatus: PoReceiveComparison | null =
    batches.length > 0 && poOrderedTotalKg > 0 ? comparePoInboundKg(poOrderedTotalKg, totalBatchNetKg) : null;

  const extraPoSpecies =
    po != null ? extraSpeciesBeyondPo(po.details ?? [], batches, receipt.lines) : [];
  const hasExtraPoSpecies = extraPoSpecies.length > 0;

  const isPending = receipt.status === "PENDING";
  const canAct =
    isPending &&
    canApproveInboundReceipt(user?.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inbound Summary</h1>
        <button
          type="button"
          onClick={() => router.push("/inbound-ikan")}
          className={`mt-3 ${actionBtn("neutral", "sm")}`}
        >
          Kembali
        </button>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-gray-500 dark:text-gray-400">Kode Penerimaan</dt>
            <dd className="font-mono font-semibold text-gray-900 dark:text-gray-100">{receipt.batchCode}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-gray-500 dark:text-gray-400">Kode PO</dt>
            <dd className="font-mono text-gray-900 dark:text-gray-100">{receipt.poCode ?? "—"}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-gray-500 dark:text-gray-400">Supplier</dt>
            <dd className="text-gray-900 dark:text-gray-100">{receipt.supplierName}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-gray-500 dark:text-gray-400">Lokasi Penerimaan</dt>
            <dd className="text-gray-900 dark:text-gray-100">{receipt.coldStorageLabel || "—"}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-gray-500 dark:text-gray-400">Tanggal Penerimaan</dt>
            <dd className="text-gray-900 dark:text-gray-100">{formatDateDdMmYyyy(receipt.tanggalPenerimaan)}</dd>
          </div>
        </dl>
      </div>

      {msg && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            msg.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center dark:border-gray-700 dark:bg-dark-card">
          <p className="text-xs text-gray-500">Total Berat QC</p>
          <p className="mt-1 text-2xl font-bold">{fmtKg(totalGrossKg)} kg</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center dark:border-red-800 dark:bg-red-950/30">
          <p className="text-xs text-red-600 dark:text-red-300">Total Rejected Batch (kg)</p>
          <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-200">{fmtKg(summaryRejectedKg)} kg</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center dark:border-green-800 dark:bg-green-950/30">
          <p className="text-xs text-green-600 dark:text-green-300">Total Normal Batch (kg)</p>
          <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-200">{fmtKg(summaryNormalKg)} kg</p>
        </div>
      </div>

      {po && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-700 dark:bg-dark-card">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="flex flex-wrap items-start justify-between gap-2 w-full">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Kesesuaian dengan Purchase Order</h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Membandingkan total berat yang dipesan pada PO <span className="font-mono">{po.poCode}</span> dengan total net
                  batch hasil paletisasi penerimaan ini.
                </p>
              </div>
              {poReceiveStatus && (
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold shrink-0 ${poReceiveComparisonBadgeClass(poReceiveStatus)}`}
                >
                  {poReceiveComparisonLabel(poReceiveStatus)}
                </span>
              )}
            </div>
          </div>
          <div className="p-4 space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/30">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total dipesan (PO)</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{fmtKg(poOrderedTotalKg)} kg</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/30">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total net batch (inbound)</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{batches.length ? fmtKg(totalBatchNetKg) : "—"} kg</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/30">
                <p className="text-xs text-gray-500 dark:text-gray-400">Selisih (inbound − PO)</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {batches.length && poOrderedTotalKg > 0 ? fmtKg(totalBatchNetKg - poOrderedTotalKg) : "—"} kg
                </p>
              </div>
            </div>
            {!batches.length && (
              <p className="text-xs text-amber-700 dark:text-amber-300">Belum ada batch — bandingkan ulang setelah paletisasi.</p>
            )}
            {batches.length > 0 && poOrderedTotalKg > 0 && poReceiveStatus && (
              <p
                className={`text-xs font-medium ${
                  poReceiveStatus === "OK"
                    ? "text-green-700 dark:text-green-300"
                    : poReceiveStatus === "OVER_RECEIVE"
                      ? "text-red-700 dark:text-red-300"
                      : "text-amber-800 dark:text-amber-200"
                }`}
              >
                {poReceiveComparisonMessage(poReceiveStatus)}
              </p>
            )}
            {hasExtraPoSpecies && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                <p className="font-semibold">Penambahan jenis di luar PO awal</p>
                <p className="mt-1 text-amber-800 dark:text-amber-200">
                  Terdapat jenis ikan yang ditambahkan saat penerimaan dan tidak tercantum pada PO{" "}
                  <span className="font-mono font-semibold">{po.poCode}</span>:{" "}
                  {extraPoSpecies
                    .map((row) => `${row.speciesName}${row.size ? ` (${row.size})` : ""} — ${fmtKg(row.receivedKg)} kg`)
                    .join("; ")}
                  .
                </p>
              </div>
            )}
            <div className="overflow-x-auto border border-gray-100 rounded-lg dark:border-gray-700">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-600 dark:bg-white/5 dark:text-gray-400">
                    <th className="px-3 py-2 font-medium">Baris PO</th>
                    <th className="px-3 py-2 font-medium">Jenis</th>
                    <th className="px-3 py-2 font-medium">Size</th>
                    <th className="px-3 py-2 font-medium text-right">Pesan (kg)</th>
                    <th className="px-3 py-2 font-medium text-right">Diterima (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {po.details?.map((d, i) => {
                    const receivedKg = receivedKgForPoDetail(d, batches, receipt.lines);
                    return (
                      <tr key={d.poDetailId ?? i} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-2 font-mono text-[11px]">#{i + 1}</td>
                        <td className="px-3 py-2">{d.speciesName ?? "—"}</td>
                        <td className="px-3 py-2">{d.itemSize ?? "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtKg(d.orderedWeightKg)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-900 dark:text-gray-100">
                          {batches.length || receivedKg > 0 ? fmtKg(receivedKg) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {extraPoSpecies.map((row) => (
                    <tr
                      key={`extra-${row.speciesId}-${row.size}`}
                      className="border-t border-amber-100 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
                    >
                      <td className="px-3 py-2 font-mono text-[11px] text-amber-800 dark:text-amber-200">+</td>
                      <td className="px-3 py-2 font-medium text-amber-900 dark:text-amber-100">
                        {row.speciesName}
                        <span className="ml-1.5 inline-flex rounded-full bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
                          Tambahan
                        </span>
                      </td>
                      <td className="px-3 py-2 text-amber-900 dark:text-amber-100">{row.size || "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-amber-800 dark:text-amber-200">—</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-amber-900 dark:text-amber-100">
                        {fmtKg(row.receivedKg)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {!receipt.poId && (
        <p className="text-xs text-gray-500 dark:text-gray-400 rounded-md border border-dashed border-gray-200 px-3 py-2 dark:border-gray-600">
          Penerimaan ini tidak terikat Purchase Order — pembanding PO tidak ditampilkan.
        </p>
      )}

      {batches.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Batch ({batches.length})</h2>
          <button
            type="button"
            onClick={() => printBatchQrCodes(batches.map((b) => ({ batchNumber: b.batchNumber })))}
            className={actionBtn("primary", "sm")}
          >
            Cetak QR Code
          </button>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map((b) => {
              const rejectBatch = isInboundRejectBatch(b);
              return (
              <div
                key={b.batchId}
                className={
                  rejectBatch
                    ? "rounded-xl border-2 border-red-500 bg-red-50/80 p-4 shadow-sm dark:border-red-500 dark:bg-red-950/40 space-y-3"
                    : "rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card space-y-3"
                }
              >
                {rejectBatch && (
                  <p className="rounded-md bg-red-600 px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-white">
                    Batch reject (mutu)
                  </p>
                )}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Batch Number</p>
                  <p
                    className={
                      rejectBatch
                        ? "text-sm font-bold font-mono text-red-800 dark:text-red-200"
                        : "text-sm font-bold font-mono text-gray-900 dark:text-gray-100"
                    }
                  >
                    {b.batchNumber}
                  </p>
                </div>
                <div className="flex justify-center">
                  <QRCodeSVG value={b.batchNumber} size={120} />
                </div>
                <div className="rounded-md bg-gray-50 px-2 py-2 dark:bg-gray-900/40 space-y-1 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500 dark:text-gray-400">SKU</span>
                    <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{b.fishSkuCode ?? "—"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Grade</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{fmtGradeLabel(b.qualityGrade)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Jenis Ikan</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{b.speciesName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Net (kg)</p>
                    <p
                      className={
                        rejectBatch
                          ? "font-semibold text-red-800 dark:text-red-200"
                          : "font-semibold text-gray-900 dark:text-gray-100"
                      }
                    >
                      {fmtKg(b.netWeightKg)} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Gross pallet</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{fmtKg(b.grossWeightKg)} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Tare pallet</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{fmtKg(b.tareWeightKg)} kg</p>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
          {canAct && (
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button type="button" onClick={() => setShowRejectModal(true)} disabled={processing} className={actionBtn("danger")}>
                Reject
              </button>
              <button type="button" onClick={() => setShowApproveConfirm(true)} disabled={processing} className={actionBtn("success")}>
                Approve
              </button>
            </div>
          )}
        </section>
      )}

      {showApproveConfirm && (
        <ModalOverlay onClose={() => setShowApproveConfirm(false)} hideCloseButton panelClassName="max-w-md rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Konfirmasi Approval</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Yakin ingin menyetujui penerimaan <span className="font-mono font-semibold">{receipt.batchCode}</span>? Batch akan menjadi tersedia (AVAILABLE).
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowApproveConfirm(false)} className={actionBtn("neutral")}>
                Tidak
              </button>
              <button type="button" onClick={() => void handleApprove()} disabled={processing} className={actionBtn("success")}>
                {processing ? "Memproses…" : "Yakin"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {showRejectModal && (
        <ModalOverlay onClose={() => setShowRejectModal(false)} hideCloseButton panelClassName="max-w-xl rounded-2xl border border-red-100 dark:border-red-900/50">
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Reject Penerimaan</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Kode <span className="font-mono font-semibold">{receipt.batchCode}</span> akan ditolak dan batch diblokir.
              </p>
            </div>
            <Field label="Alasan Reject" required>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                maxLength={255}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-card dark:text-gray-100"
                placeholder="contoh: dokumen tidak valid / hasil tidak sesuai"
                required
              />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowRejectModal(false)} className={actionBtn("neutral")}>
                Tidak
              </button>
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={!rejectReason.trim() || processing}
                className={actionBtn("danger")}
              >
                {processing ? "Menyimpan…" : "Reject"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
