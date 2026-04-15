"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { ModalOverlay, Field } from "@/components/inbound-fish/ModalPrimitives";
import apiClient from "@/lib/api";
import type { ApiResponse, FishSpeciesResponse, FishFormResponse } from "@/types";
import {
  type WeighingLogRow,
  type WeighingSummaryRow,
  type InboundReceiptRow,
  type PurchaseOrderRow,
  getInboundReceipt,
  getWeighingLogs,
  getWeighingSummary,
  submitWeighingLog,
  finishWeighing,
  getAllPurchaseOrders,
  addLineToReceipt,
} from "@/lib/inbound-api";

export default function InboundTallyPage() {
  return (
    <ProtectedRoute allowedRoles={["SBB_STAFF", "WAREHOUSE_STAFF", "SUPERADMIN", "KEPALA_CABANG"]}>
      <AppShell>
        <InboundTallyContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function fmtKg(v: number | string | null | undefined): string {
  const n = typeof v === "string" ? Number(v) : v;
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(n);
}

type OfflineLog = {
  key: string;
  receiptId: string;
  lineId: string;
  grossWeight: number;
  tareWeight: number;
  savedAt: string;
};

const OFFLINE_KEY = "inbound_offline_weighing";

function getOfflineLogs(): OfflineLog[] {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveOfflineLog(log: OfflineLog) {
  const all = getOfflineLogs();
  all.push(log);
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(all));
}

function removeOfflineLog(key: string) {
  const all = getOfflineLogs().filter((l) => l.key !== key);
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(all));
}

function InboundTallyContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const receiptId = params.id;

  const [receipt, setReceipt] = useState<InboundReceiptRow | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [grossWeight, setGrossWeight] = useState("");
  const [tareWeight, setTareWeight] = useState("");
  const [logs, setLogs] = useState<WeighingLogRow[]>([]);
  const [summary, setSummary] = useState<WeighingSummaryRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  const [poData, setPoData] = useState<PurchaseOrderRow | null>(null);

  const [showAddSpecies, setShowAddSpecies] = useState(false);
  const [speciesList, setSpeciesList] = useState<FishSpeciesResponse[]>([]);
  const [formList, setFormList] = useState<FishFormResponse[]>([]);
  const [newSpeciesId, setNewSpeciesId] = useState("");
  const [newFormId, setNewFormId] = useState("");
  const [newSize, setNewSize] = useState("");
  const [addingLine, setAddingLine] = useState(false);

  const [offlinePending, setOfflinePending] = useState<OfflineLog[]>([]);
  const [syncing, setSyncing] = useState(false);

  const loadReceipt = useCallback(async () => {
    try {
      const data = await getInboundReceipt(receiptId);
      setReceipt(data);
      if (data.lines.length > 0 && !selectedLineId) {
        setSelectedLineId(data.lines[0].id);
      }
    } catch { /* interceptor */ }
  }, [receiptId, selectedLineId]);

  const loadLogs = useCallback(async () => {
    try {
      const data = selectedLineId
        ? await getWeighingLogs(receiptId, selectedLineId)
        : await getWeighingLogs(receiptId);
      setLogs(data);
    } catch { /* interceptor */ }
  }, [receiptId, selectedLineId]);

  const loadSummary = useCallback(async () => {
    try {
      const data = await getWeighingSummary(receiptId);
      setSummary(data);
    } catch { /* interceptor */ }
  }, [receiptId]);

  const loadPO = useCallback(async () => {
    if (!receipt?.poId) return;
    try {
      const all = await getAllPurchaseOrders();
      const found = all.find((p) => p.poId === receipt.poId);
      if (found) setPoData(found);
    } catch { /* ignore */ }
  }, [receipt?.poId]);

  useEffect(() => { void loadReceipt(); }, [loadReceipt]);
  useEffect(() => { void loadLogs(); }, [loadLogs]);
  useEffect(() => { void loadSummary(); }, [loadSummary]);
  useEffect(() => { void loadPO(); }, [loadPO]);
  useEffect(() => {
    setOfflinePending(getOfflineLogs().filter((l) => l.receiptId === receiptId));
  }, [receiptId]);

  const poDetailMap = useMemo(() => {
    if (!poData) return new Map<number, number>();
    const m = new Map<number, number>();
    for (const d of poData.details) {
      if (d.speciesId != null && d.orderedWeightKg != null) {
        m.set(d.speciesId, (m.get(d.speciesId) ?? 0) + d.orderedWeightKg);
      }
    }
    return m;
  }, [poData]);

  const canWeigh = receipt?.status === "DRAFT" || receipt?.status === "WEIGHING";
  const canFinish = receipt?.status === "WEIGHING" && summary.some((s) => s.basketCount > 0);

  const nextBasketNo = useMemo(() => {
    const maxNo = logs.reduce((m, l) => Math.max(m, l.basketNo), 0);
    return maxNo + 1;
  }, [logs]);

  const selectedLine = useMemo(() => receipt?.lines.find((l) => l.id === selectedLineId) ?? null, [receipt, selectedLineId]);

  async function syncOfflineLogs() {
    const pending = getOfflineLogs().filter((l) => l.receiptId === receiptId);
    if (pending.length === 0) return;
    setSyncing(true);
    let synced = 0;
    for (const log of pending) {
      try {
        await submitWeighingLog(receiptId, {
          lineId: log.lineId,
          grossWeight: log.grossWeight,
          tareWeight: log.tareWeight,
        });
        removeOfflineLog(log.key);
        synced++;
      } catch {
        break;
      }
    }
    setSyncing(false);
    setOfflinePending(getOfflineLogs().filter((l) => l.receiptId === receiptId));
    if (synced > 0) {
      setMsg({ type: "success", text: `${synced} data offline berhasil disinkronkan.` });
      await Promise.all([loadLogs(), loadSummary(), loadReceipt()]);
    }
  }

  useEffect(() => {
    void syncOfflineLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmitLog(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLineId) return;
    setSaving(true);
    setMsg(null);
    try {
      await submitWeighingLog(receiptId, {
        lineId: selectedLineId,
        grossWeight: Number(grossWeight),
        tareWeight: Number(tareWeight),
      });
      setGrossWeight("");
      setTareWeight("");
      setMsg({ type: "success", text: `Basket #${nextBasketNo} tersimpan.` });
      await Promise.all([loadLogs(), loadSummary(), loadReceipt()]);
    } catch (err) {
      if (!navigator.onLine || (err instanceof Error && err.message.includes("Network"))) {
        const offlineEntry: OfflineLog = {
          key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          receiptId,
          lineId: selectedLineId,
          grossWeight: Number(grossWeight),
          tareWeight: Number(tareWeight),
          savedAt: new Date().toISOString(),
        };
        saveOfflineLog(offlineEntry);
        setOfflinePending((prev) => [...prev, offlineEntry]);
        setGrossWeight("");
        setTareWeight("");
        setMsg({ type: "warning", text: `Basket disimpan offline. Akan disinkronkan saat koneksi pulih.` });
      } else {
        setMsg({ type: "error", text: "Gagal menyimpan timbangan." });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleFinishWeighing() {
    setFinishing(true);
    setMsg(null);
    try {
      await finishWeighing(receiptId);
      setMsg({ type: "success", text: "Tally weighing selesai! Status: QC_CHECK." });
      await loadReceipt();
      setTimeout(() => router.push("/inbound-ikan"), 1500);
    } catch {
      setMsg({ type: "error", text: "Gagal menyelesaikan weighing." });
    } finally {
      setFinishing(false);
    }
  }

  async function openAddSpeciesModal() {
    setShowAddSpecies(true);
    if (speciesList.length === 0) {
      try {
        const { data: sp } = await apiClient.get<ApiResponse<FishSpeciesResponse[]>>("/master-data/fish-species");
        setSpeciesList(sp.data ?? []);
      } catch { /* ignore */ }
    }
    if (formList.length === 0) {
      try {
        const { data: fm } = await apiClient.get<ApiResponse<FishFormResponse[]>>("/master-data/fish-forms");
        setFormList(fm.data ?? []);
      } catch { /* ignore */ }
    }
  }

  async function handleAddSpecies(e: React.FormEvent) {
    e.preventDefault();
    if (!newSpeciesId || !newSize) return;
    setAddingLine(true);
    try {
      await addLineToReceipt(receiptId, {
        jenisIkan: Number(newSpeciesId),
        size: newSize.trim(),
        bentuk: newFormId ? formList.find((f) => f.formId === Number(newFormId))?.formName ?? "-" : "-",
        formId: newFormId ? Number(newFormId) : null,
      });
      setShowAddSpecies(false);
      setNewSpeciesId("");
      setNewFormId("");
      setNewSize("");
      setMsg({ type: "success", text: "Spesies baru ditambahkan." });
      await loadReceipt();
    } catch {
      setMsg({ type: "error", text: "Gagal menambahkan spesies." });
    } finally {
      setAddingLine(false);
    }
  }

  const computedNet = Number(grossWeight) - Number(tareWeight);
  const netDisplay = grossWeight && tareWeight && computedNet > 0 ? fmtKg(computedNet) : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tally Weighing Entry</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {receipt ? `${receipt.batchCode} — ${receipt.supplierName} (${receipt.status})` : "Memuat…"}
        </p>
        {receipt?.poCode && <p className="text-xs text-gray-400 dark:text-gray-500">PO: {receipt.poCode}</p>}
      </div>

      {msg && (
        <div className={`rounded-md border px-3 py-2 text-sm ${
          msg.type === "success" ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300"
          : msg.type === "warning" ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
        }`}>
          {msg.text}
        </div>
      )}

      {offlinePending.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300 flex items-center justify-between">
          <span>{offlinePending.length} data timbangan tersimpan offline.</span>
          <button type="button" disabled={syncing} onClick={() => void syncOfflineLogs()} className="rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
            {syncing ? "Sinkronisasi…" : "Sinkronkan Sekarang"}
          </button>
        </div>
      )}

      {canWeigh && (
        <form onSubmit={handleSubmitLog} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 flex gap-2 items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Jenis Ikan</label>
                <select
                  value={selectedLineId}
                  onChange={(e) => setSelectedLineId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm font-semibold dark:border-gray-600 dark:bg-dark-card dark:text-gray-100"
                >
                  <option value="" disabled>Pilih jenis ikan</option>
                  {receipt?.lines.map((ln) => (
                    <option key={ln.id} value={ln.id}>
                      {ln.speciesCode} — {ln.speciesName} ({ln.size}, {ln.bentuk})
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={() => void openAddSpeciesModal()} className="rounded-md border border-dashed border-cyan px-3 py-2.5 text-sm font-semibold text-cyan hover:bg-cyan/5 whitespace-nowrap">
                + Spesies Baru
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">No. Basket (auto)</label>
              <input
                type="number"
                value={nextBasketNo}
                readOnly
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-lg font-bold tabular-nums text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Net Weight (auto)</label>
              <div className="flex h-[52px] items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-lg font-bold tabular-nums text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {netDisplay} kg
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Gross Weight (kg)</label>
              <input type="number" step="0.001" min={0.001} value={grossWeight} onChange={(e) => setGrossWeight(e.target.value)} placeholder="0,000" className="w-full rounded-md border border-gray-300 px-3 py-3 text-lg font-bold tabular-nums dark:border-gray-600 dark:bg-dark-card dark:text-gray-100" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Tare Weight / Keranjang (kg)</label>
              <input type="number" step="0.001" min={0} value={tareWeight} onChange={(e) => setTareWeight(e.target.value)} placeholder="0,000" className="w-full rounded-md border border-gray-300 px-3 py-3 text-lg font-bold tabular-nums dark:border-gray-600 dark:bg-dark-card dark:text-gray-100" required />
            </div>
          </div>
          <button type="submit" disabled={saving || !selectedLineId} className="w-full rounded-md bg-cyan px-4 py-3 text-base font-semibold text-white hover:bg-cyan/80 disabled:opacity-50">
            {saving ? "Menyimpan..." : "Submit Timbangan"}
          </button>
        </form>
      )}

      {canFinish && (
        <button type="button" onClick={() => void handleFinishWeighing()} disabled={finishing} className="w-full rounded-xl bg-amber-500 px-4 py-3 text-base font-bold text-white hover:bg-amber-600 disabled:opacity-50">
          {finishing ? "Memproses…" : "Selesai Timbang → Lanjut QC"}
        </button>
      )}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ringkasan per Jenis Ikan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 dark:bg-white/5 dark:text-gray-400">
                <th className="px-4 py-2 font-medium">Jenis Ikan</th>
                <th className="px-4 py-2 font-medium">Size</th>
                <th className="px-4 py-2 font-medium">Bentuk</th>
                <th className="px-4 py-2 font-medium text-right">Jumlah Basket</th>
                <th className="px-4 py-2 font-medium text-right">Total Net (kg)</th>
                {poData && <th className="px-4 py-2 font-medium text-right">PO Weight (kg)</th>}
                {poData && <th className="px-4 py-2 font-medium text-center">Status</th>}
              </tr>
            </thead>
            <tbody>
              {summary.length === 0 ? (
                <tr><td colSpan={poData ? 7 : 5} className="px-4 py-6 text-center text-gray-500">Belum ada data timbang.</td></tr>
              ) : (
                summary.map((s) => {
                  const poWeight = poDetailMap.get(s.speciesId);
                  const totalNet = Number(s.totalNetWeightKg) || 0;
                  const isOver = poWeight != null && totalNet > poWeight;
                  return (
                    <tr key={s.lineId} className={`border-t border-gray-100 dark:border-gray-800 ${s.lineId === selectedLineId ? "bg-cyan/5 dark:bg-cyan/10" : ""} ${isOver ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}>
                      <td className="px-4 py-2 font-medium">{s.speciesCode} — {s.speciesName}</td>
                      <td className="px-4 py-2">{s.size}</td>
                      <td className="px-4 py-2">{s.bentuk}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{s.basketCount}</td>
                      <td className={`px-4 py-2 text-right tabular-nums font-semibold ${isOver ? "text-amber-700 dark:text-amber-300" : ""}`}>{fmtKg(s.totalNetWeightKg)}</td>
                      {poData && <td className="px-4 py-2 text-right tabular-nums text-gray-500">{poWeight != null ? fmtKg(poWeight) : "—"}</td>}
                      {poData && (
                        <td className="px-4 py-2 text-center">
                          {poWeight == null ? (
                            <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">UNPLANNED</span>
                          ) : isOver ? (
                            <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">OVER-RECEIVE</span>
                          ) : (
                            <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-300">OK</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Log Timbangan {selectedLine ? `— ${selectedLine.speciesName}` : "(semua)"}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 dark:bg-white/5 dark:text-gray-400">
                <th className="px-4 py-2 font-medium">Basket</th>
                <th className="px-4 py-2 font-medium">Jenis Ikan</th>
                <th className="px-4 py-2 font-medium text-right">Gross (kg)</th>
                <th className="px-4 py-2 font-medium text-right">Tare (kg)</th>
                <th className="px-4 py-2 font-medium text-right">Net (kg)</th>
                <th className="px-4 py-2 font-medium">Petugas</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Belum ada data timbang.</td></tr>
              ) : (
                logs.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-2 font-bold text-lg">{row.basketNo}</td>
                    <td className="px-4 py-2 text-xs">{row.speciesName ?? "—"}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtKg(row.grossWeight)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtKg(row.tareWeight)}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold">{fmtKg(row.netWeight)}</td>
                    <td className="px-4 py-2">{row.weighedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showAddSpecies && (
        <ModalOverlay onClose={() => setShowAddSpecies(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-dark-card space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Tambah Spesies Baru (Unplanned)</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Spesies ini tidak ada di PO. Akan ditambahkan ke daftar rincian ikan receipt ini.</p>
            <form onSubmit={handleAddSpecies} className="space-y-3">
              <Field label="Jenis Ikan">
                <select value={newSpeciesId} onChange={(e) => setNewSpeciesId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-card dark:text-gray-100" required>
                  <option value="">Pilih jenis ikan</option>
                  {speciesList.filter((s) => s.isActive).map((s) => (
                    <option key={s.speciesId} value={s.speciesId}>{s.speciesCode} — {s.speciesName}</option>
                  ))}
                </select>
              </Field>
              <Field label="Bentuk (Form)">
                <select value={newFormId} onChange={(e) => setNewFormId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-card dark:text-gray-100">
                  <option value="">— Pilih bentuk —</option>
                  {formList.filter((f) => f.isActive).map((f) => (
                    <option key={f.formId} value={f.formId}>{f.formCode} — {f.formName}</option>
                  ))}
                </select>
              </Field>
              <Field label="Ukuran / Size">
                <input type="text" value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="contoh: 1-2 kg" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-card dark:text-gray-100" required />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddSpecies(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200">Batal</button>
                <button type="submit" disabled={addingLine} className="rounded-md bg-cyan px-4 py-2 text-sm font-semibold text-white hover:bg-cyan/80 disabled:opacity-50">
                  {addingLine ? "Menambahkan…" : "Tambah Spesies"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
