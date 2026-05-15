"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import Button from "@/components/ui/Button";
import { getColdStorages } from "@/lib/expiry";
import {
  createStockOpnameSession,
  finalizeStockOpnameSession,
  getStockOpnameSession,
  listStockOpnameSessions,
  updateStockOpnameLines,
} from "@/lib/coldstorage-api";
import type { ColdStorageData } from "@/types";
import type { StockOpnameLineResponse, StockOpnameSessionResponse } from "@/types/coldstorage";

function currentYyyymm() {
  const d = new Date();
  return d.getFullYear() * 100 + (d.getMonth() + 1);
}

function fmtQty(v: number | string | null | undefined) {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : v;
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("id-ID", { maximumFractionDigits: 3 });
}

function tempStatusPreview(
  target: number | string | null | undefined,
  tempStr: string
): "OK" | "WARNING" | "NO_TARGET" | "NOT_MEASURED" {
  const tRaw = tempStr.trim();
  if (tRaw === "") return "NOT_MEASURED";
  const t = Number(tRaw.replace(",", "."));
  if (!Number.isFinite(t)) return "NOT_MEASURED";
  if (target == null || target === "") return "NO_TARGET";
  const tgt = typeof target === "string" ? Number(String(target).replace(",", ".")) : target;
  if (!Number.isFinite(tgt)) return "NO_TARGET";
  if (Math.abs(t - tgt) <= 1) return "OK";
  return "WARNING";
}

function shrinkPreviewPct(system: number | string, countedStr: string) {
  const sys = typeof system === "string" ? Number(system.replace(",", ".")) : system;
  const c = Number(String(countedStr).replace(",", "."));
  if (!Number.isFinite(sys) || sys <= 0 || !Number.isFinite(c)) return "—";
  return `${(((sys - c) / sys) * 100).toFixed(2)}%`;
}

function StockOpnamePageInner() {
  const searchParams = useSearchParams();
  const presetColdStorageId = searchParams.get("coldStorageId");
  const lockedWarehouse = presetColdStorageId != null && presetColdStorageId !== "";

  const [coldStorages, setColdStorages] = useState<ColdStorageData[]>([]);
  const [coldStorageId, setColdStorageId] = useState<number | "">("");
  const [periodYyyymm, setPeriodYyyymm] = useState<number>(currentYyyymm());
  const [notes, setNotes] = useState("");
  const [sessions, setSessions] = useState<StockOpnameSessionResponse[]>([]);
  const [activeSession, setActiveSession] = useState<StockOpnameSessionResponse | null>(null);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [temps, setTemps] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (lockedWarehouse) {
      const id = Number(presetColdStorageId);
      if (Number.isFinite(id)) {
        setColdStorageId(id);
      }
    }
  }, [lockedWarehouse, presetColdStorageId]);

  const loadColdStorages = useCallback(async () => {
    const list = await getColdStorages();
    setColdStorages(list.filter((c) => c.isActive));
  }, []);

  const loadSessions = useCallback(async () => {
    if (coldStorageId === "") {
      setSessions([]);
      return;
    }
    const list = await listStockOpnameSessions(Number(coldStorageId));
    setSessions(list);
  }, [coldStorageId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadColdStorages();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat master gudang");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadColdStorages]);

  useEffect(() => {
    if (coldStorageId === "") return;
    void (async () => {
      try {
        await loadSessions();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat sesi stock opname");
      }
    })();
  }, [coldStorageId, loadSessions]);

  const presetLabel = useMemo(() => {
    if (!lockedWarehouse || coldStorageId === "") return null;
    const c = coldStorages.find((x) => x.coldStorageId === coldStorageId);
    return c ? `${c.csCode} — ${c.csName}` : `Cold storage #${coldStorageId}`;
  }, [coldStorageId, coldStorages, lockedWarehouse]);

  const isDraft = activeSession?.status === "DRAFT";

  const openSession = async (sessionId: number) => {
    setError(null);
    setInfo(null);
    const s = await getStockOpnameSession(sessionId);
    setActiveSession(s);
    const nc: Record<number, string> = {};
    const nt: Record<number, string> = {};
    for (const line of s.lines ?? []) {
      nc[line.lineId] =
        line.countedQtyKg != null && line.countedQtyKg !== ""
          ? String(line.countedQtyKg)
          : String(line.systemQtyKg);
      nt[line.lineId] =
        line.countedTempC != null && line.countedTempC !== "" ? String(line.countedTempC) : "";
    }
    setCounts(nc);
    setTemps(nt);
  };

  const handleCreateDraft = async () => {
    if (coldStorageId === "") {
      setError("Pilih cold storage terlebih dahulu.");
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const created = await createStockOpnameSession({
        coldStorageId: Number(coldStorageId),
        periodYyyymm,
        notes: notes.trim() || undefined,
      });
      setInfo("Draft stock opname dibuat — satu baris per batch (kandang macan) di gudang ini.");
      await loadSessions();
      await openSession(created.sessionId);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e instanceof Error ? e.message : "Gagal membuat draft");
      setError(String(msg));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveLines = async () => {
    if (!activeSession || !isDraft) return;
    const lines = (activeSession.lines ?? []).map((l) => {
      const raw = counts[l.lineId] ?? String(l.systemQtyKg);
      const n = Number(String(raw).replace(",", "."));
      const tRaw = (temps[l.lineId] ?? "").trim();
      const t = tRaw === "" ? null : Number(String(tRaw).replace(",", "."));
      return {
        lineId: l.lineId,
        countedQtyKg: Number.isFinite(n) ? n : 0,
        countedTempC: t != null && Number.isFinite(t) ? t : null,
      };
    });
    setBusy(true);
    setError(null);
    try {
      const updated = await updateStockOpnameLines(activeSession.sessionId, { lines });
      setActiveSession(updated);
      setInfo("Berat & suhu opname disimpan.");
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e instanceof Error ? e.message : "Gagal menyimpan baris");
      setError(String(msg));
    } finally {
      setBusy(false);
    }
  };

  const handleFinalize = async () => {
    if (!activeSession || !isDraft) return;
    setBusy(true);
    setError(null);
    try {
      const posted = await finalizeStockOpnameSession(activeSession.sessionId);
      setActiveSession(posted);
      setInfo("Stock opname diposting — berat per batch diperbarui sesuai ukuran fisik.");
      await loadSessions();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e instanceof Error ? e.message : "Gagal posting");
      setError(String(msg));
    } finally {
      setBusy(false);
    }
  };

  const sessionRows = useMemo(() => sessions, [sessions]);

  const mergeHref = (batchId: number) =>
    `/cold-storage/batch-merge?coldStorageId=${encodeURIComponent(String(coldStorageId))}&survivorBatchId=${encodeURIComponent(String(batchId))}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Stock Opname Cold Storage</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Opname per <strong>batch</strong> (isi kandang macan): catat berat fisik dan suhu ruang penyimpanan; shrinkage
          dan status suhu vs SKU ditampilkan setelah simpan. Posting memperbarui <code>current_quantity</code> per
          batch.
        </p>
      </header>
      <ColdStorageModuleNav />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {info && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{info}</div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Buat draft bulanan</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Cold storage</label>
            {lockedWarehouse && presetLabel ? (
              <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-gray-900 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-gray-100">
                {presetLabel}
                <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">
                  Gudang dipilih dari Struktur Gudang.{" "}
                  <Link href="/cold-storage/stock-opname" className="text-cyan hover:underline">
                    Ubah gudang
                  </Link>
                </p>
              </div>
            ) : (
              <select
                value={coldStorageId}
                onChange={(e) => {
                  setColdStorageId(e.target.value ? Number(e.target.value) : "");
                  setActiveSession(null);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
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
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Periode (YYYYMM)</label>
            <input
              type="number"
              min={200001}
              max={209912}
              value={periodYyyymm}
              onChange={(e) => setPeriodYyyymm(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Catatan (opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              placeholder="Contoh: Opname rutin Mei"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button type="button" onClick={() => void handleCreateDraft()} disabled={busy || coldStorageId === ""}>
            {busy ? "Memproses..." : "Buat draft"}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Sesi di gudang ini</h2>
        {coldStorageId === "" ? (
          <p className="text-sm text-gray-500">Pilih cold storage untuk melihat daftar sesi.</p>
        ) : sessionRows.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada sesi stock opname.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-gray-500">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Periode</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Posting</th>
                  <th className="py-2 pr-3" />
                </tr>
              </thead>
              <tbody>
                {sessionRows.map((s) => (
                  <tr key={s.sessionId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-3 font-mono text-xs">{s.sessionId}</td>
                    <td className="py-2 pr-3 tabular-nums">{s.periodYyyymm}</td>
                    <td className="py-2 pr-3">{s.status}</td>
                    <td className="py-2 pr-3 text-xs text-gray-600">
                      {s.postedAt ? new Date(s.postedAt).toLocaleString() : "—"}
                      {s.postedBy ? ` · ${s.postedBy}` : ""}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <button
                        type="button"
                        className="text-cyan hover:underline"
                        onClick={() => void openSession(s.sessionId)}
                      >
                        Buka
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {activeSession && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Sesi #{activeSession.sessionId}{" "}
                <span className="text-sm font-normal text-gray-500">({activeSession.status})</span>
              </h2>
              {activeSession.notes ? (
                <p className="text-xs text-gray-500">{activeSession.notes}</p>
              ) : null}
            </div>
            {isDraft ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => void handleSaveLines()} disabled={busy}>
                  Simpan berat & suhu
                </Button>
                <Button type="button" size="sm" onClick={() => void handleFinalize()} disabled={busy}>
                  Posting
                </Button>
              </div>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-gray-500">
                  <th className="py-2 pr-2">Batch</th>
                  <th className="py-2 pr-2 text-right">Sistem (kg)</th>
                  <th className="py-2 pr-2 text-right">Fisik (kg)</th>
                  <th className="py-2 pr-2 text-right">Suhu (°C)</th>
                  <th className="py-2 pr-2 text-right">Target SKU (°C)</th>
                  <th className="py-2 pr-2">Suhu</th>
                  <th className="py-2 pr-2 text-right">Shrinkage</th>
                  <th className="py-2 pr-2">Gabung</th>
                </tr>
              </thead>
              <tbody>
                {(activeSession.lines ?? []).map((line: StockOpnameLineResponse) => {
                  const ts = isDraft
                    ? tempStatusPreview(line.targetStorageTempC, temps[line.lineId] ?? "")
                    : (line.temperatureStatus as "OK" | "WARNING" | "NO_TARGET" | "NOT_MEASURED" | undefined) ??
                      "NOT_MEASURED";
                  const tempBadge =
                    ts === "WARNING" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                        Warning
                      </span>
                    ) : ts === "OK" ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                        OK
                      </span>
                    ) : ts === "NO_TARGET" ? (
                      <span className="text-[10px] text-gray-500">Tanpa target</span>
                    ) : (
                      <span className="text-[10px] text-gray-500">Belum ukur</span>
                    );
                  const shrink =
                    line.shrinkagePct != null && line.shrinkagePct !== ""
                      ? `${Number(String(line.shrinkagePct).replace(",", ".")).toFixed(2)}%`
                      : shrinkPreviewPct(line.systemQtyKg, counts[line.lineId] ?? String(line.systemQtyKg));
                  const showMerge =
                    line.underKandangNominalKg && coldStorageId !== "" && line.batchId != null;
                  return (
                    <tr key={line.lineId} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 pr-2 font-medium">{line.batchNumber ?? "—"}</td>
                      <td className="py-2 pr-2 text-xs">{line.fishSkuCode ?? "—"}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{fmtQty(line.systemQtyKg)}</td>
                      <td className="py-2 pr-2 text-right">
                        {isDraft ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={counts[line.lineId] ?? ""}
                            onChange={(e) =>
                              setCounts((prev) => ({
                                ...prev,
                                [line.lineId]: e.target.value,
                              }))
                            }
                            className="w-24 rounded border border-gray-300 px-2 py-1 text-right tabular-nums dark:border-gray-600 dark:bg-dark-section"
                          />
                        ) : (
                          <span className="tabular-nums">{fmtQty(line.countedQtyKg)}</span>
                        )}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        {isDraft ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={temps[line.lineId] ?? ""}
                            onChange={(e) =>
                              setTemps((prev) => ({
                                ...prev,
                                [line.lineId]: e.target.value,
                              }))
                            }
                            className="w-20 rounded border border-gray-300 px-2 py-1 text-right tabular-nums dark:border-gray-600 dark:bg-dark-section"
                            placeholder="°C"
                          />
                        ) : (
                          <span className="tabular-nums">{fmtQty(line.countedTempC)}</span>
                        )}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums text-gray-600">{fmtQty(line.targetStorageTempC)}</td>
                      <td className="py-2 pr-2">{tempBadge}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{shrink}</td>
                      <td className="py-2 pr-2">
                        {showMerge ? (
                          <Link
                            href={mergeHref(line.batchId!)}
                            className="text-xs font-semibold text-cyan hover:underline"
                          >
                            Gabung batch
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default function StockOpnamePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={<div className="p-6 text-sm text-gray-500">Memuat…</div>}>
          <StockOpnamePageInner />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
