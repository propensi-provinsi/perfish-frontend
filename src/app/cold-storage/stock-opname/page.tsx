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
import {
  alertErrorClass,
  alertSuccessClass,
  compareStockOpnamePeriodDesc,
  formatPeriodDisplay,
  inputClass,
  isStockOpnameDateAfterToday,
  labelClass,
  periodYyyymmFromDateInput,
} from "@/lib/coldstorage-ui";
import type { ColdStorageData } from "@/types";
import type { StockOpnameLineResponse, StockOpnameSessionResponse } from "@/types/coldstorage";

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  const [periodDate, setPeriodDate] = useState(todayIsoDate());
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
    const sorted = [...list].sort((a, b) => compareStockOpnamePeriodDesc(a.periodYyyymm, b.periodYyyymm));
    setSessions(sorted);
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

  const [sessionEditMode, setSessionEditMode] = useState(false);

  const isDraft = activeSession?.status === "DRAFT";
  const isPosted = activeSession?.status === "POSTED";
  const canEditInputs = isDraft || (isPosted && sessionEditMode);

  const warehouseTitle = useMemo(() => {
    if (coldStorageId === "") return "Gudang";
    const c = coldStorages.find((x) => x.coldStorageId === coldStorageId);
    return c ? c.csName : `Gudang #${coldStorageId}`;
  }, [coldStorageId, coldStorages]);

  const openSession = async (sessionId: number, editMode = false) => {
    setError(null);
    setInfo(null);
    const s = await getStockOpnameSession(sessionId);
    setActiveSession(s);
    setSessionEditMode(s.status === "DRAFT" || editMode);
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
      if (isStockOpnameDateAfterToday(periodDate)) {
        setError("Tanggal stock opname tidak boleh melebihi hari ini.");
        return;
      }
      const periodYyyymm = periodYyyymmFromDateInput(periodDate);
      if (!periodYyyymm) {
        setError("Periode tidak valid.");
        return;
      }
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
    if (!activeSession || !canEditInputs) return;
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Stock Opname Cold Storage</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Melakukan pengecekan rutin stock untuk transparansi stok
        </p>
      </header>
      <ColdStorageModuleNav />

      {error && <div className={alertErrorClass}>{error}</div>}
      {info && <div className={alertSuccessClass}>{info}</div>}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Buat Draft Bulanan</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className={labelClass}>Cold storage</label>
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
                className={inputClass}
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
            <label className={labelClass}>Periode (DD/MM/YYYY)</label>
            <input
              type="date"
              value={periodDate}
              max={todayIsoDate()}
              onChange={(e) => setPeriodDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Catatan (opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
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
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Stock Opname ({warehouseTitle})
        </h2>
        {coldStorageId === "" ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Pilih cold storage untuk melihat daftar sesi.</p>
        ) : sessionRows.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada sesi stock opname.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Periode</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Posting</th>
                  <th className="py-2 pr-3">Catatan</th>
                  <th className="py-2 pr-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sessionRows.map((s) => (
                  <tr key={s.sessionId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-3 font-mono text-xs text-gray-800 dark:text-gray-100">{s.sessionId}</td>
                    <td className="py-2 pr-3 tabular-nums text-gray-800 dark:text-gray-100">{formatPeriodDisplay(s.periodYyyymm)}</td>
                    <td className="py-2 pr-3 text-gray-800 dark:text-gray-100">{s.status}</td>
                    <td className="py-2 pr-3 text-xs text-gray-600 dark:text-gray-200">
                      {s.postedAt ? new Date(s.postedAt).toLocaleString() : "—"}
                      {s.postedBy ? ` · ${s.postedBy}` : ""}
                    </td>
                    <td className="py-2 pr-3 text-xs text-gray-600 dark:text-gray-200">{s.notes ?? "—"}</td>
                    <td className="py-2 pr-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="!bg-cyan !text-white hover:!bg-cyan-hover focus:ring-cyan/40"
                          onClick={() => void openSession(s.sessionId, false)}
                        >
                          Buka
                        </Button>
                        {s.status === "POSTED" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-cyan text-cyan hover:bg-cyan/10 dark:border-cyan-400 dark:text-cyan-300"
                            onClick={() => void openSession(s.sessionId, true)}
                          >
                            Edit
                          </Button>
                        ) : null}
                      </div>
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
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({activeSession.status})</span>
              </h2>
              {activeSession.notes ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">{activeSession.notes}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {isPosted && !sessionEditMode ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-cyan text-cyan hover:bg-cyan/10 dark:border-cyan-400 dark:text-cyan-300"
                  onClick={() => setSessionEditMode(true)}
                >
                  Edit
                </Button>
              ) : null}
              {canEditInputs ? (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={() => void handleSaveLines()} disabled={busy}>
                    {isPosted ? "Simpan perubahan" : "Simpan berat & suhu"}
                  </Button>
                  {isDraft ? (
                    <Button
                      type="button"
                      size="sm"
                      className="!bg-cyan !text-white hover:!bg-cyan-hover"
                      onClick={() => void handleFinalize()}
                      disabled={busy}
                    >
                      Posting
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-[13px]">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-2 py-2">Batch</th>
                  <th className="px-2 py-2">SKU</th>
                  <th className="px-2 py-2">Grade</th>
                  <th className="px-2 py-2 text-right">Sistem (kg)</th>
                  <th className="px-2 py-2 text-right">Fisik (kg)</th>
                  <th className="px-2 py-2 text-right">Suhu (°C)</th>
                  <th className="px-2 py-2 text-right">Target SKU (°C)</th>
                  <th className="px-2 py-2">Suhu</th>
                  <th className="px-2 py-2 text-right">Shrinkage</th>
                </tr>
              </thead>
              <tbody>
                {(activeSession.lines ?? []).map((line: StockOpnameLineResponse) => {
                  const target = line.targetStorageTempC;
                  const ts = canEditInputs
                    ? tempStatusPreview(target, temps[line.lineId] ?? "")
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
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Tanpa target</span>
                    ) : (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Belum ukur</span>
                    );
                  const shrink =
                    line.shrinkagePct != null && line.shrinkagePct !== ""
                      ? `${Number(String(line.shrinkagePct).replace(",", ".")).toFixed(2)}%`
                      : shrinkPreviewPct(line.systemQtyKg, counts[line.lineId] ?? String(line.systemQtyKg));
                  return (
                    <tr key={line.lineId} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-2 py-2 font-medium text-gray-900 dark:text-gray-100">
                        {line.batchNumber ?? "—"}
                      </td>
                      <td className="px-2 py-2 text-gray-700 dark:text-gray-200">{line.fishSkuCode ?? "—"}</td>
                      <td className="px-2 py-2 text-gray-700 dark:text-gray-200">
                        {line.gradeLabel ?? line.qualityGrade ?? "—"}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums text-gray-700 dark:text-gray-200">
                        {fmtQty(line.systemQtyKg)}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        {canEditInputs ? (
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
                            className="w-24 rounded border border-gray-300 px-2 py-1 text-right tabular-nums text-gray-900 dark:border-gray-600 dark:bg-dark-section dark:text-gray-100"
                          />
                        ) : (
                          <span className="tabular-nums text-gray-800 dark:text-gray-100">{fmtQty(line.countedQtyKg)}</span>
                        )}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        {canEditInputs ? (
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
                            className="w-20 rounded border border-gray-300 px-2 py-1 text-right tabular-nums text-gray-900 dark:border-gray-600 dark:bg-dark-section dark:text-gray-100"
                            placeholder="°C"
                          />
                        ) : (
                          <span className="tabular-nums text-gray-800 dark:text-gray-100">{fmtQty(line.countedTempC)}</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums text-gray-600 dark:text-gray-200">
                        {fmtQty(target)}
                      </td>
                      <td className="px-2 py-2">{tempBadge}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-gray-700 dark:text-gray-200">{shrink}</td>
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
        <Suspense fallback={<div className="p-6 text-sm text-gray-500 dark:text-gray-400">Memuat…</div>}>
          <StockOpnamePageInner />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
