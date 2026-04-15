"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import {
  type InboundReceiptRow,
  type WeighingSummaryRow,
  type PalletizationBatch,
  getInboundReceipt,
  getWeighingSummary,
  palletize,
} from "@/lib/inbound-api";
import { QRCodeSVG } from "qrcode.react";

export default function PalletizePage() {
  return (
    <ProtectedRoute allowedRoles={["SBB_STAFF", "WAREHOUSE_ADMIN", "SUPERADMIN", "KEPALA_CABANG"]}>
      <AppShell>
        <PalletizeContent />
      </AppShell>
    </ProtectedRoute>
  );
}

type PalletInput = { grossWeightKg: string; tareWeightKg: string };
type LineState = { lineId: string; speciesLabel: string; acceptedWeight: number; palletCount: number; pallets: PalletInput[] };

function fmtKg(v: number | string | null | undefined): string {
  const n = typeof v === "string" ? Number(v) : v;
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(n);
}

function PalletizeContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const receiptId = params.id;

  const [receipt, setReceipt] = useState<InboundReceiptRow | null>(null);
  const [summary, setSummary] = useState<WeighingSummaryRow[]>([]);
  const [lineStates, setLineStates] = useState<LineState[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [createdBatches, setCreatedBatches] = useState<PalletizationBatch[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([getInboundReceipt(receiptId), getWeighingSummary(receiptId)]);
      setReceipt(r);
      setSummary(s);

      const states: LineState[] = r.lines.map((line) => {
        const summaryLine = s.find((sl) => sl.lineId === line.id);
        const accepted = Number(line.acceptedWeightKg) || 0;
        return {
          lineId: line.id,
          speciesLabel: `${line.speciesCode} — ${line.speciesName} (${line.size}, ${line.bentuk})`,
          acceptedWeight: accepted,
          palletCount: 1,
          pallets: [{ grossWeightKg: "", tareWeightKg: "" }],
        };
      });
      setLineStates(states);
    } catch {
      setMsg({ type: "error", text: "Gagal memuat data." });
    }
  }, [receiptId]);

  useEffect(() => { void loadData(); }, [loadData]);

  function updateLineState(lineId: string, patch: Partial<LineState>) {
    setLineStates((prev) => prev.map((ls) => ls.lineId === lineId ? { ...ls, ...patch } : ls));
  }

  function setPalletCount(lineId: string, count: number) {
    setLineStates((prev) => prev.map((ls) => {
      if (ls.lineId !== lineId) return ls;
      const c = Math.max(1, count);
      const pallets = Array.from({ length: c }, (_, i) => ls.pallets[i] ?? { grossWeightKg: "", tareWeightKg: "" });
      return { ...ls, palletCount: c, pallets };
    }));
  }

  function updatePallet(lineId: string, idx: number, field: keyof PalletInput, value: string) {
    setLineStates((prev) => prev.map((ls) => {
      if (ls.lineId !== lineId) return ls;
      const pallets = ls.pallets.map((p, i) => i === idx ? { ...p, [field]: value } : p);
      return { ...ls, pallets };
    }));
  }

  function palletNet(p: PalletInput): number {
    const g = Number(p.grossWeightKg) || 0;
    const t = Number(p.tareWeightKg) || 0;
    return g - t;
  }

  function linePalletTotal(ls: LineState): number {
    return ls.pallets.reduce((sum, p) => sum + Math.max(0, palletNet(p)), 0);
  }

  const canSubmit = lineStates.length > 0 && lineStates.every((ls) =>
    ls.pallets.length > 0 && ls.pallets.every((p) => Number(p.grossWeightKg) > 0 && Number(p.tareWeightKg) >= 0 && palletNet(p) > 0)
  );

  async function handleSubmit() {
    setSaving(true);
    setMsg(null);
    try {
      const result = await palletize(receiptId, lineStates.map((ls) => ({
        lineId: ls.lineId,
        pallets: ls.pallets.map((p) => ({
          grossWeightKg: Number(p.grossWeightKg),
          tareWeightKg: Number(p.tareWeightKg),
        })),
      })));
      setCreatedBatches(result.batches);
      setMsg({ type: "success", text: `Palletisasi selesai! ${result.batches.length} batch dibuat.` });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setMsg({ type: "error", text: axiosErr.response?.data?.message || "Gagal menyimpan palletisasi." });
    } finally {
      setSaving(false);
    }
  }

  if (!receipt) return <p className="p-8 text-center text-gray-500">Memuat…</p>;
  if (receipt.status === "COMPLETED" && createdBatches.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Palletisasi Selesai</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{receipt.batchCode} — {receipt.supplierName}</p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Penerimaan ini sudah selesai dan batch sudah dibuat.</p>
        <button type="button" onClick={() => router.push("/inbound-ikan")} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200">
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Kalkulasi & Palletisasi</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {receipt.batchCode} — {receipt.supplierName}
        </p>
      </div>

      {msg && (
        <div className={`rounded-md border px-3 py-2 text-sm ${msg.type === "success" ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300" : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"}`}>
          {msg.text}
        </div>
      )}

      {createdBatches.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Batch yang Terbentuk</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {createdBatches.map((b) => (
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
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.push("/inbound-ikan")} className="rounded-md bg-cyan px-4 py-2 text-sm font-medium text-white hover:bg-cyan/80">
              Kembali ke Dashboard
            </button>
            <button type="button" onClick={() => window.print()} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200">
              Cetak QR Code
            </button>
          </div>
        </section>
      ) : (
        <div className="space-y-6">
          {lineStates.map((ls) => {
            const totalPalletNet = linePalletTotal(ls);
            const diff = ls.acceptedWeight - totalPalletNet;
            return (
              <section key={ls.lineId} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card space-y-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ls.speciesLabel}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Accepted Weight: <span className="font-bold text-gray-900 dark:text-gray-100">{fmtKg(ls.acceptedWeight)} kg</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Jumlah Pallet / Kandang Macan:</label>
                  <input
                    type="number"
                    min={1}
                    value={ls.palletCount}
                    onChange={(e) => setPalletCount(ls.lineId, Number(e.target.value))}
                    className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm font-bold tabular-nums dark:border-gray-600 dark:bg-dark-card dark:text-gray-100"
                  />
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-600 dark:bg-white/5 dark:text-gray-400">
                        <th className="px-3 py-2 font-medium w-12">#</th>
                        <th className="px-3 py-2 font-medium">Gross Weight (kg)</th>
                        <th className="px-3 py-2 font-medium">Tare Weight / KM (kg)</th>
                        <th className="px-3 py-2 font-medium text-right">Net Weight (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ls.pallets.map((p, idx) => {
                        const net = palletNet(p);
                        return (
                          <tr key={idx} className="border-t border-gray-100 dark:border-gray-800">
                            <td className="px-3 py-2 font-bold">{idx + 1}</td>
                            <td className="px-3 py-2">
                              <input type="number" step="0.001" min={0.001} value={p.grossWeightKg} onChange={(e) => updatePallet(ls.lineId, idx, "grossWeightKg", e.target.value)} placeholder="0.000" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm tabular-nums dark:border-gray-600 dark:bg-dark-card dark:text-gray-100" />
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" step="0.001" min={0} value={p.tareWeightKg} onChange={(e) => updatePallet(ls.lineId, idx, "tareWeightKg", e.target.value)} placeholder="0.000" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm tabular-nums dark:border-gray-600 dark:bg-dark-card dark:text-gray-100" />
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-semibold">{net > 0 ? fmtKg(net) : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5">
                        <td colSpan={3} className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 text-right">Total Pallet Net:</td>
                        <td className="px-3 py-2 text-right tabular-nums font-bold">{fmtKg(totalPalletNet)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {Math.abs(diff) > 0.01 && totalPalletNet > 0 && (
                  <div className={`rounded-md border px-3 py-2 text-xs ${diff > 0 ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200" : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"}`}>
                    {diff > 0
                      ? `Selisih: ${fmtKg(diff)} kg belum dialokasikan ke pallet.`
                      : `Peringatan: Total pallet melebihi accepted weight sebesar ${fmtKg(Math.abs(diff))} kg.`}
                  </div>
                )}
              </section>
            );
          })}

          <div className="flex gap-3">
            <button type="button" onClick={() => router.push("/inbound-ikan")} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200">
              Kembali
            </button>
            <button type="button" onClick={() => void handleSubmit()} disabled={!canSubmit || saving} className="flex-1 rounded-xl bg-green-600 px-6 py-3 text-base font-bold text-white hover:bg-green-700 disabled:opacity-50">
              {saving ? "Memproses…" : "Simpan & Buat Batch"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
