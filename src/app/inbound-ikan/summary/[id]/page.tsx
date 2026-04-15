"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import {
  type InboundReceiptRow,
  type PalletizationBatch,
  getInboundReceipt,
  getReceiptBatches,
} from "@/lib/inbound-api";
import { QRCodeSVG } from "qrcode.react";

function fmtKg(v: number | string | null | undefined): string {
  const n = typeof v === "string" ? Number(v) : v;
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(n);
}

export default function InboundSummaryPage() {
  return (
    <ProtectedRoute allowedRoles={["SBB_STAFF", "WAREHOUSE_ADMIN", "SUPERADMIN", "KEPALA_CABANG"]}>
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
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, b] = await Promise.all([
        getInboundReceipt(receiptId),
        getReceiptBatches(receiptId),
      ]);
      setReceipt(r);
      setBatches(b);
    } catch {
      setMsg({ type: "error", text: "Gagal memuat data." });
    } finally {
      setLoading(false);
    }
  }, [receiptId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <p className="p-8 text-center text-gray-500">Memuat…</p>;
  if (!receipt) return <p className="p-8 text-center text-gray-500">Data tidak ditemukan.</p>;

  const totalGrossKg = receipt.lines.reduce((sum, l) => sum + (Number(l.qcTotalBeratKg) || 0), 0);
  const totalRejectedKg = receipt.lines.reduce((sum, l) => sum + (Number(l.rejectedWeight) || 0), 0);
  const totalAcceptedKg = receipt.lines.reduce((sum, l) => sum + (Number(l.acceptedWeightKg) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <button type="button" onClick={() => router.push("/inbound-ikan")} className="mb-3 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200">
          Kembali
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inbound Summary</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {receipt.batchCode} — {receipt.supplierName}
        </p>
        {receipt.poCode && <p className="text-xs text-gray-400 dark:text-gray-500">PO: {receipt.poCode}</p>}
      </div>

      {msg && (
        <div className={`rounded-md border px-3 py-2 text-sm ${msg.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center dark:border-gray-700 dark:bg-dark-card">
          <p className="text-xs text-gray-500">Total Berat QC</p>
          <p className="mt-1 text-2xl font-bold">{fmtKg(totalGrossKg)} kg</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center dark:border-red-800 dark:bg-red-950/30">
          <p className="text-xs text-red-600 dark:text-red-300">Ditolak QC</p>
          <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-200">{fmtKg(totalRejectedKg)} kg</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center dark:border-green-800 dark:bg-green-950/30">
          <p className="text-xs text-green-600 dark:text-green-300">Diterima (Net Accepted)</p>
          <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-200">{fmtKg(totalAcceptedKg)} kg</p>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-700 dark:bg-dark-card">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Agregasi per SKU / Line</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 dark:bg-white/5 dark:text-gray-400">
                <th className="px-4 py-2 font-medium">Jenis Ikan</th>
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium">Grade</th>
                <th className="px-4 py-2 font-medium text-right">Berat QC (kg)</th>
                <th className="px-4 py-2 font-medium text-right">Ditolak (kg)</th>
                <th className="px-4 py-2 font-medium text-right">Diterima (kg)</th>
              </tr>
            </thead>
            <tbody>
              {receipt.lines.map((l) => (
                <tr key={l.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2">{l.speciesName}</td>
                  <td className="px-4 py-2 font-mono text-xs">{l.resolvedSkuCode ?? "—"}</td>
                  <td className="px-4 py-2">{l.qcGrade ?? "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmtKg(l.qcTotalBeratKg)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-red-600">{fmtKg(l.rejectedWeight)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-green-700 font-semibold">{fmtKg(l.acceptedWeightKg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {batches.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Batch / Pallet yang Terbentuk ({batches.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map((b) => (
              <div key={b.batchId} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Batch Number</p>
                  <p className="text-sm font-bold font-mono text-gray-900 dark:text-gray-100">{b.batchNumber}</p>
                </div>
                <div className="flex justify-center">
                  <QRCodeSVG value={b.batchNumber} size={120} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Jenis Ikan</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{b.speciesName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Net Weight</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{fmtKg(b.netWeightKg)} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Gross Weight</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{fmtKg(b.grossWeightKg)} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Tare Weight (KM)</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{fmtKg(b.tareWeightKg)} kg</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => window.print()} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200">
            Cetak QR Code
          </button>
        </section>
      )}

    </div>
  );
}
