"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import {
  type InboundReceiptRow,
  type PalletizationBatch,
  type PurchaseOrderRow,
  getInboundReceipt,
  getPurchaseOrder,
  getReceiptBatches,
} from "@/lib/inbound-api";
import { QRCodeSVG } from "qrcode.react";

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
  if (code === "REJECT") return "Reject";
  return code;
}

function isInboundRejectBatch(b: PalletizationBatch): boolean {
  if (b.inboundRejectBatch === true) return true;
  return b.qualityGrade === "REJECT";
}

export default function InboundSummaryPage() {
  return (
    <ProtectedRoute allowedRoles={["SBB_STAFF", "WAREHOUSE_ADMIN", "WAREHOUSE_STAFF", "QC_SPECIALIST", "SUPERADMIN", "KEPALA_CABANG"]}>
      <AppShell>
        <InboundSummaryContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function InboundSummaryContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const receiptId = params.id;
  const [receipt, setReceipt] = useState<InboundReceiptRow | null>(null);
  const [batches, setBatches] = useState<PalletizationBatch[]>([]);
  const [po, setPo] = useState<PurchaseOrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
  const poVsInboundOk =
    !po || poOrderedTotalKg <= 0 ? null : Math.abs(poOrderedTotalKg - totalBatchNetKg) <= Math.max(0.02 * poOrderedTotalKg, 2);

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => router.push("/inbound-ikan")}
          className="mb-3 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200"
        >
          Kembali
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inbound Summary</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {receipt.batchCode} — {receipt.supplierName}
        </p>
        {receipt.poCode && <p className="text-xs text-gray-400 dark:text-gray-500">PO: {receipt.poCode}</p>}
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
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Kesesuaian dengan Purchase Order</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Membandingkan total berat yang dipesan pada PO <span className="font-mono">{po.poCode}</span> dengan total net
              batch hasil paletisasi penerimaan ini.
            </p>
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
            {batches.length > 0 && poOrderedTotalKg > 0 && (
              <p
                className={`text-xs font-medium ${poVsInboundOk ? "text-green-700 dark:text-green-300" : "text-amber-800 dark:text-amber-200"}`}
              >
                {poVsInboundOk
                  ? "Total net batch selaras dengan total berat PO (dalam toleransi)."
                  : "Total net batch berbeda dari total berat PO — tinjau kelebihan/kekurangan pengiriman atau beda konversi timbang."}
              </p>
            )}
            <div className="overflow-x-auto border border-gray-100 rounded-lg dark:border-gray-700">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-600 dark:bg-white/5 dark:text-gray-400">
                    <th className="px-3 py-2 font-medium">Baris PO</th>
                    <th className="px-3 py-2 font-medium">Jenis</th>
                    <th className="px-3 py-2 font-medium">Size</th>
                    <th className="px-3 py-2 font-medium text-right">Pesan (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {po.details?.map((d, i) => (
                    <tr key={d.poDetailId ?? i} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2 font-mono text-[11px]">#{i + 1}</td>
                      <td className="px-3 py-2">{d.speciesName ?? "—"}</td>
                      <td className="px-3 py-2">{d.itemSize ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtKg(d.orderedWeightKg)}</td>
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
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Batch ({batches.length})</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-2xl">
              Satu kartu = satu <code className="text-[11px]">master_batch</code> dengan nomor unik. Berat net = alokasi ikan; gross/tare = timbang pallet/kandang saat paletisasi.
            </p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Total net semua batch: <strong className="tabular-nums">{fmtKg(totalBatchNetKg)} kg</strong>
            </p>
          </div>
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
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200"
          >
            Cetak QR Code
          </button>
        </section>
      )}
    </div>
  );
}
