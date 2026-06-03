"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PALLETIZATION_ROLES } from "@/lib/rbac";
import AppShell from "@/components/layout/AppShell";
import {
  type InboundReceiptRow,
  type WeighingLogRow,
  type PalletizationBatch,
  type KandangMacanPalletizePayload,
  getInboundReceipt,
  getWeighingLogs,
  getReceiptBatches,
  palletize,
} from "@/lib/inbound-api";
import { QRCodeSVG } from "qrcode.react";
import { printBatchQrCodes } from "@/lib/print-batch-qr";
const rejectBasketRowBgClass = "bg-red-50/80 dark:bg-red-950/30";
const rejectBasketNumCellClass = "border-l-4 border-l-red-500 pl-4";
import RejectBatchLegend from "@/components/cold-storage/RejectBatchLegend";
import { HiOutlineTrash } from "react-icons/hi2";
import { actionBtn } from "@/lib/ui-action";
import { useClientTablePagination } from "@/components/ui/TableListPagination";

export default function PalletizePage() {
  return (
    <ProtectedRoute allowedRoles={PALLETIZATION_ROLES}>
      <AppShell>
        <PalletizeContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function fmtKg(v: number | string | null | undefined): string {
  const n = typeof v === "string" ? Number(v) : v;
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(n);
}

const KG_TOL = 0.005;

/** Input di kartu Batch #n — border sedikit lebih tebal agar mudah terlihat. */
const kandangFieldInputClass =
  "w-full rounded-md border-2 border-amber-300/85 bg-white px-2.5 py-2 text-sm text-right tabular-nums shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40 dark:border-amber-600/70 dark:bg-dark-card dark:text-gray-100 dark:focus:border-amber-500";

function toNetKg(v: number | string | null | undefined): number {
  if (v == null) return NaN;
  if (typeof v === "number") return v;
  const s = String(v).replace(/\s/g, "").replace(",", ".").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function parseAllocKg(raw: string | undefined): number {
  if (!raw || !raw.trim()) return 0;
  const n = Number(String(raw).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n;
}

function almostEqualKg(a: number, b: number): boolean {
  return Math.abs(a - b) <= KG_TOL;
}

type BasketAllocStatus = "pas" | "parsial" | "belum" | "melebihi";

function basketAllocStatus(alloc: number, cap: number): BasketAllocStatus {
  const ok = Number.isFinite(cap) && almostEqualKg(alloc, cap);
  const over = Number.isFinite(cap) && alloc > cap + KG_TOL;
  const partial = !ok && !over && alloc > KG_TOL;
  if (ok) return "pas";
  if (over) return "melebihi";
  if (partial) return "parsial";
  return "belum";
}

const ALLOC_STATUS_BADGE: Record<BasketAllocStatus, { label: string; cls: string }> = {
  pas: {
    label: "Pas",
    cls: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  },
  parsial: {
    label: "Parsial",
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  },
  belum: {
    label: "Belum",
    cls: "bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200",
  },
  melebihi: {
    label: "Melebihi",
    cls: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  },
};

function AllocStatusBadge({ status }: { status: BasketAllocStatus }) {
  const cfg = ALLOC_STATUS_BADGE[status];
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

const BASKET_INPUT_STATUS_CLASS: Record<BasketAllocStatus, string> = {
  belum:
    "border-slate-300 bg-slate-50 text-gray-900 focus:border-slate-400 focus:ring-slate-300/40 dark:border-slate-600 dark:bg-slate-800/60 dark:text-gray-100 dark:focus:border-slate-500",
  parsial:
    "border-amber-400 bg-amber-50 text-amber-950 focus:border-amber-500 focus:ring-amber-400/40 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-100 dark:focus:border-amber-500",
  pas:
    "border-green-500 bg-green-50 text-green-950 focus:border-green-600 focus:ring-green-500/40 dark:border-green-600 dark:bg-green-950/30 dark:text-green-100 dark:focus:border-green-500",
  melebihi:
    "border-red-500 bg-red-50 text-red-950 focus:border-red-600 focus:ring-red-500/40 dark:border-red-600 dark:bg-red-950/30 dark:text-red-100 dark:focus:border-red-500",
};

const BASKET_CARD_STATUS_CLASS: Record<BasketAllocStatus, string> = {
  belum: "border-slate-300 bg-slate-50/95 dark:border-slate-600 dark:bg-slate-800/55",
  parsial: "border-amber-400 bg-amber-50/95 dark:border-amber-600 dark:bg-amber-950/45",
  pas: "border-green-500 bg-green-50/95 dark:border-green-600 dark:bg-green-950/45",
  melebihi: "border-red-500 bg-red-50/95 dark:border-red-600 dark:bg-red-950/45",
};

const BATCH_NET_BADGE_CLASS =
  "inline-flex shrink-0 rounded-full border border-amber-400/90 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-amber-900 dark:border-amber-600 dark:bg-amber-900/50 dark:text-amber-100";

type RejectSegment = "reject" | "normal";

type KandangDraft = {
  targetSpeciesId: number | null;
  rejectSegment: RejectSegment | null;
  grossKg: string;
  tareKg: string;
  kgByLogId: Record<string, string>;
};

function isRejectLog(l: WeighingLogRow): boolean {
  return Boolean(l.isRejectBasket);
}

function uniqueSpeciesIds(skuLogs: WeighingLogRow[], lineSpecies: Map<string, number>): number[] {
  const s = new Set<number>();
  for (const l of skuLogs) {
    const id = lineSpecies.get(l.lineId);
    if (id != null) s.add(id);
  }
  return Array.from(s);
}

/** Apakah untuk spesies ini ada basket reject saja, normal saja, atau keduanya (perlu pilihan). */
function rejectMixForSpecies(
  speciesId: number,
  skuLogs: WeighingLogRow[],
  lineSpecies: Map<string, number>
): "reject_only" | "normal_only" | "both" {
  let hasR = false;
  let hasN = false;
  for (const l of skuLogs) {
    if (lineSpecies.get(l.lineId) !== speciesId) continue;
    if (isRejectLog(l)) hasR = true;
    else hasN = true;
  }
  if (hasR && hasN) return "both";
  if (hasR) return "reject_only";
  return "normal_only";
}

function effectiveRejectSegment(
  k: KandangDraft,
  skuLogs: WeighingLogRow[],
  lineSpecies: Map<string, number>
): RejectSegment | null {
  if (k.targetSpeciesId == null) return null;
  const mix = rejectMixForSpecies(k.targetSpeciesId, skuLogs, lineSpecies);
  if (mix === "reject_only") return "reject";
  if (mix === "normal_only") return "normal";
  return k.rejectSegment;
}

/** Basket yang boleh diisi pada batch ini (setelah pilih spesies + segmen reject bila perlu). */
function logsInBatchScope(k: KandangDraft, skuLogs: WeighingLogRow[], lineSpecies: Map<string, number>): WeighingLogRow[] {
  if (k.targetSpeciesId == null) return [];
  const seg = effectiveRejectSegment(k, skuLogs, lineSpecies);
  if (seg == null) return [];
  return skuLogs.filter((l) => {
    if (lineSpecies.get(l.lineId) !== k.targetSpeciesId) return false;
    return seg === "reject" ? isRejectLog(l) : !isRejectLog(l);
  });
}

function speciesLabel(speciesId: number, skuLogs: WeighingLogRow[], lineSpecies: Map<string, number>): string {
  const hit = skuLogs.find((l) => lineSpecies.get(l.lineId) === speciesId);
  return hit?.speciesName ?? `Spesies #${speciesId}`;
}

function netAllocatedInKandang(k: KandangDraft, skuLogs: WeighingLogRow[], lineSpecies: Map<string, number>): number {
  const scope = new Set(logsInBatchScope(k, skuLogs, lineSpecies).map((l) => l.id));
  return skuLogs.reduce((s, l) => (scope.has(l.id) ? s + parseAllocKg(k.kgByLogId[l.id]) : s), 0);
}

function formatKgInput(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  const rounded = Math.round(n * 1000) / 1000;
  return String(rounded);
}

/** Gross = net alokasi + tare (tare 0 jika kosong). Hanya diisi otomatis bila ada alokasi basket. */
function applyAutoGross(
  k: KandangDraft,
  skuLogs: WeighingLogRow[],
  lineSpecies: Map<string, number>
): KandangDraft {
  const net = netAllocatedInKandang(k, skuLogs, lineSpecies);
  if (net <= KG_TOL) return k;
  const tare = parseTarePalletKg(k.tareKg);
  const tareVal = Number.isFinite(tare) ? tare : 0;
  return { ...k, grossKg: formatKgInput(net + tareVal) };
}

function basketAllocStatusForLog(
  logId: string,
  kandangs: KandangDraft[],
  cap: number,
  overRemaining: boolean,
  noRemaining: boolean
): BasketAllocStatus | null {
  if (noRemaining) return null;
  if (overRemaining) return "melebihi";
  return basketAllocStatus(totalAllocatedAcrossKandangs(logId, kandangs), cap);
}

function parseGrossPalletKg(raw: string | undefined): number {
  if (!raw || !raw.trim()) return NaN;
  const n = Number(String(raw).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0.01) return NaN;
  return n;
}

function parseTarePalletKg(raw: string | undefined): number {
  if (raw === undefined || String(raw).trim() === "") return NaN;
  const n = Number(String(raw).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return NaN;
  return n;
}

function allocatableNetKg(log: WeighingLogRow): number {
  const net = toNetKg(log.netWeight);
  if (!Number.isFinite(net)) return NaN;
  const rej = toNetKg(log.rejectedWeightKg);
  const rejected = Number.isFinite(rej) ? rej : 0;
  return Math.max(0, net - rejected);
}

function allocatedExceptKandang(logId: string, kandangs: KandangDraft[], excludeIdx: number): number {
  return kandangs.reduce((sum, k, i) => {
    if (i === excludeIdx) return sum;
    return sum + parseAllocKg(k.kgByLogId[logId]);
  }, 0);
}

function remainingKgForKandang(
  logId: string,
  kandangs: KandangDraft[],
  kandangIdx: number,
  cap: number
): number {
  if (!Number.isFinite(cap)) return NaN;
  const usedElsewhere = allocatedExceptKandang(logId, kandangs, kandangIdx);
  return Math.max(0, cap - usedElsewhere);
}

function totalAllocatedAcrossKandangs(logId: string, kandangs: KandangDraft[]): number {
  return kandangs.reduce((sum, k) => sum + parseAllocKg(k.kgByLogId[logId]), 0);
}

function basketAllocInputClass(
  logId: string,
  kandangs: KandangDraft[],
  cap: number,
  overRemaining: boolean,
  noRemaining: boolean
): string {
  const base =
    "w-full rounded-md border-2 px-2 py-1.5 text-right text-sm tabular-nums shadow-sm focus:outline-none focus:ring-1 disabled:cursor-not-allowed";
  if (noRemaining) {
    return `${base} border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500`;
  }
  const status = basketAllocStatusForLog(logId, kandangs, cap, overRemaining, noRemaining) ?? "belum";
  return `${base} ${BASKET_INPUT_STATUS_CLASS[status]}`;
}

function basketAllocCardClass(
  logId: string,
  kandangs: KandangDraft[],
  cap: number,
  overRemaining: boolean,
  noRemaining: boolean
): string {
  const base = "rounded-md border-2 px-2.5 py-2 text-xs";
  if (noRemaining) {
    return `${base} border-gray-200 bg-gray-50/90 opacity-80 dark:border-gray-700 dark:bg-gray-800/50`;
  }
  const status = basketAllocStatusForLog(logId, kandangs, cap, overRemaining, noRemaining) ?? "belum";
  return `${base} ${BASKET_CARD_STATUS_CLASS[status]}`;
}

function clampAllocToRemaining(raw: string, maxKg: number): string {
  if (!raw.trim()) return raw;
  const n = parseAllocKg(raw);
  if (n <= 0) return raw;
  if (!Number.isFinite(maxKg) || maxKg <= 0) return "";
  if (n > maxKg + KG_TOL) return String(maxKg);
  return raw;
}

function sanitizeKandangAllocations(kandangs: KandangDraft[], logs: WeighingLogRow[]): KandangDraft[] {
  return kandangs.map((k, idx) => {
    const nextKg: Record<string, string> = { ...k.kgByLogId };
    for (const log of logs) {
      const cap = allocatableNetKg(log);
      const rem = remainingKgForKandang(log.id, kandangs, idx, cap);
      nextKg[log.id] = clampAllocToRemaining(nextKg[log.id] ?? "", rem);
    }
    return { ...k, kgByLogId: nextKg };
  });
}

function buildLineSpeciesMap(receipt: InboundReceiptRow): Map<string, number> {
  const m = new Map<string, number>();
  for (const ln of receipt.lines) {
    m.set(ln.id, ln.speciesId);
  }
  return m;
}

function batchesToKandangDrafts(
  batches: PalletizationBatch[],
  skuLogs: WeighingLogRow[],
  lineSpecies: Map<string, number>
): KandangDraft[] {
  return batches.map((b) => {
    const refLog = b.weighingLogId
      ? skuLogs.find((l) => l.id === b.weighingLogId)
      : skuLogs.find(
          (l) =>
            l.speciesName === b.speciesName &&
            (Boolean(b.inboundRejectBatch) ? isRejectLog(l) : !isRejectLog(l))
        );
    const speciesId = refLog ? (lineSpecies.get(refLog.lineId) ?? null) : null;
    const mix = speciesId != null ? rejectMixForSpecies(speciesId, skuLogs, lineSpecies) : "normal_only";
    const rejectSegment: RejectSegment | null =
      mix === "both"
        ? Boolean(b.inboundRejectBatch)
          ? "reject"
          : "normal"
        : mix === "reject_only"
          ? "reject"
          : "normal";

    const kgByLogId: Record<string, string> = {};
    if (b.basketAllocations && b.basketAllocations.length > 0) {
      for (const row of b.basketAllocations) {
        if (row.netKg > 0) {
          kgByLogId[row.weighingLogId] = String(row.netKg);
        }
      }
    } else if (refLog && b.netWeightKg > 0) {
      // Data lama: hanya total net pada basket referensi
      kgByLogId[refLog.id] = String(b.netWeightKg);
    }

    return {
      targetSpeciesId: speciesId,
      rejectSegment,
      grossKg: b.grossWeightKg != null ? String(b.grossWeightKg) : "",
      tareKg: b.tareWeightKg != null ? String(b.tareWeightKg) : "",
      kgByLogId,
    };
  });
}

function kandangHasAllocation(k: KandangDraft, skuLogs: WeighingLogRow[]): boolean {
  return skuLogs.some((l) => parseAllocKg(k.kgByLogId[l.id]) > 0);
}

function GrossTareMismatchMessage({
  grossMinusTareKg,
  netBatchKg,
}: {
  grossMinusTareKg: number;
  netBatchKg: number;
}) {
  return (
    <>
      <strong>Gross − Tare ({fmtKg(grossMinusTareKg)} kg)</strong> harus sama dengan{" "}
      <strong>Net Batch ({fmtKg(netBatchKg)} kg)</strong>. Perbaiki input.
    </>
  );
}

function joinBatchErrorParts(parts: ReactNode[]): ReactNode {
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  return (
    <span className="block space-y-1">
      {parts.map((part, i) => (
        <span key={i} className="block">
          {part}
        </span>
      ))}
    </span>
  );
}

function validateKandangsForSubmit(
  kandangs: KandangDraft[],
  skuLogs: WeighingLogRow[],
  lineSpecies: Map<string, number>,
  speciesIdsOnReceipt: number[]
): { batchErrors: Record<number, ReactNode>; globalMessage: string | null } {
  const errorParts: Record<number, ReactNode[]> = {};

  function pushError(ki: number, part: ReactNode) {
    if (!errorParts[ki]) errorParts[ki] = [];
    errorParts[ki].push(part);
  }

  for (const l of skuLogs) {
    const cap = allocatableNetKg(l);
    const alloc = totalAllocatedAcrossKandangs(l.id, kandangs);
    if (alloc > cap + KG_TOL) {
      for (let ki = 0; ki < kandangs.length; ki++) {
        if (parseAllocKg(kandangs[ki].kgByLogId[l.id]) <= 0) continue;
        pushError(
          ki,
          `Basket #${l.basketNo} dialokasi melebihi net (max ${fmtKg(cap)} kg).`
        );
      }
    }
  }

  for (let ki = 0; ki < kandangs.length; ki++) {
    const k = kandangs[ki];
    if (!kandangHasAllocation(k, skuLogs)) continue;

    if (speciesIdsOnReceipt.length > 1 && k.targetSpeciesId == null) {
      pushError(ki, "Pilih jenis ikan untuk batch ini.");
    }
    const mix = k.targetSpeciesId != null ? rejectMixForSpecies(k.targetSpeciesId, skuLogs, lineSpecies) : null;
    if (mix === "both" && k.rejectSegment == null) {
      pushError(ki, "Pilih reject atau non-reject untuk batch ini.");
    }

    const scopeIds = new Set(logsInBatchScope(k, skuLogs, lineSpecies).map((l) => l.id));
    for (const l of skuLogs) {
      if (scopeIds.has(l.id)) continue;
      if (parseAllocKg(k.kgByLogId[l.id]) > 0) {
        pushError(ki, "Ada alokasi di basket di luar filter spesies/reject batch ini.");
        break;
      }
    }

    for (const l of skuLogs) {
      const kg = parseAllocKg(k.kgByLogId[l.id]);
      if (kg <= 0) continue;
      if (!scopeIds.has(l.id)) continue;
      const cap = allocatableNetKg(l);
      const maxHere = remainingKgForKandang(l.id, kandangs, ki, cap);
      if (kg > maxHere + KG_TOL) {
        pushError(ki, `Alokasi basket #${l.basketNo} melebihi sisa tersedia (max ${fmtKg(maxHere)} kg).`);
      }
    }

    const netCage = netAllocatedInKandang(k, skuLogs, lineSpecies);
    if (netCage <= KG_TOL) {
      pushError(ki, "Net batch harus lebih dari 0 kg.");
    }

    const g = parseGrossPalletKg(k.grossKg);
    const t = parseTarePalletKg(k.tareKg);
    if (!Number.isFinite(g) || !Number.isFinite(t)) {
      pushError(ki, "Isi gross dan tare pallet dengan benar.");
    } else if (netCage > KG_TOL && !almostEqualKg(g - t, netCage)) {
      pushError(ki, <GrossTareMismatchMessage grossMinusTareKg={g - t} netBatchKg={netCage} />);
    }
  }

  const batchErrors: Record<number, ReactNode> = {};
  for (const [ki, parts] of Object.entries(errorParts)) {
    batchErrors[Number(ki)] = joinBatchErrorParts(parts);
  }

  const hasActive = kandangs.some((k) => kandangHasAllocation(k, skuLogs));
  const globalMessage = !hasActive ? "Belum ada alokasi basket pada batch manapun." : null;

  return { batchErrors, globalMessage };
}

function emptyKandang(skuLogs: WeighingLogRow[], lineSpecies: Map<string, number>): KandangDraft {
  const ids = uniqueSpeciesIds(skuLogs, lineSpecies);
  if (ids.length === 1) {
    const sid = ids[0];
    const mix = rejectMixForSpecies(sid, skuLogs, lineSpecies);
    return {
      targetSpeciesId: sid,
      rejectSegment: mix === "both" ? null : mix === "reject_only" ? "reject" : "normal",
      grossKg: "",
      tareKg: "",
      kgByLogId: {},
    };
  }
  return { targetSpeciesId: null, rejectSegment: null, grossKg: "", tareKg: "", kgByLogId: {} };
}

function PalletizeContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const receiptId = params.id;

  const [receipt, setReceipt] = useState<InboundReceiptRow | null>(null);
  const [logs, setLogs] = useState<WeighingLogRow[]>([]);
  const [kandangs, setKandangs] = useState<KandangDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [createdBatches, setCreatedBatches] = useState<PalletizationBatch[]>([]);
  const [repalletizing, setRepalletizing] = useState(false);

  const lineSpecies = useMemo(() => {
    const m = new Map<string, number>();
    if (!receipt) return m;
    for (const ln of receipt.lines) {
      m.set(ln.id, ln.speciesId);
    }
    return m;
  }, [receipt]);

  const skuLogs = useMemo(() => logs.filter((l) => l.fishSkuId != null), [logs]);

  const hasRejectBaskets = useMemo(() => skuLogs.some(isRejectLog), [skuLogs]);

  const speciesIdsOnReceipt = useMemo(() => uniqueSpeciesIds(skuLogs, lineSpecies), [skuLogs, lineSpecies]);

  const loadData = useCallback(async () => {
    try {
      const [r, lg, batches] = await Promise.all([
        getInboundReceipt(receiptId),
        getWeighingLogs(receiptId),
        getReceiptBatches(receiptId).catch(() => [] as PalletizationBatch[]),
      ]);
      setReceipt(r);
      setLogs(lg ?? []);
      setCreatedBatches(batches);
      const sku = (lg ?? []).filter((l) => l.fishSkuId != null);
      const speciesMap = buildLineSpeciesMap(r);
      if (batches.length > 0 && (r.status === "IN_PROGRESS" || r.status === "QC_CHECK")) {
        const drafts = batchesToKandangDrafts(batches, sku, speciesMap);
        setKandangs(drafts.length > 0 ? drafts : sku.length > 0 ? [emptyKandang(sku, speciesMap)] : []);
        setRepalletizing(true);
      } else if (batches.length > 0) {
        setRepalletizing(false);
      }
    } catch {
      setMsg({ type: "error", text: "Gagal memuat data." });
    }
  }, [receiptId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (skuLogs.length === 0) return;
    setKandangs((prev) => {
      if (prev.length > 0) return prev;
      return [emptyKandang(skuLogs, lineSpecies)];
    });
  }, [skuLogs, lineSpecies]);

  useEffect(() => {
    if (skuLogs.length === 0) return;
    if (speciesIdsOnReceipt.length !== 1) return;
    const sid = speciesIdsOnReceipt[0];
    const mix = rejectMixForSpecies(sid, skuLogs, lineSpecies);
    setKandangs((prev) =>
      prev.map((k) => ({
        ...k,
        targetSpeciesId: sid,
        rejectSegment:
          mix === "both" ? k.rejectSegment : mix === "reject_only" ? "reject" : "normal",
      }))
    );
  }, [skuLogs, lineSpecies, speciesIdsOnReceipt]);

  const perBasketFlow = skuLogs.length > 0;

  const basketPagination = useClientTablePagination(skuLogs, {
    initialPageSize: 10,
    resetDeps: [skuLogs.length],
  });

  const allocStatusCounts = useMemo(() => {
    let pas = 0;
    let parsial = 0;
    let belum = 0;
    for (const row of skuLogs) {
      const cap = allocatableNetKg(row);
      const alloc = totalAllocatedAcrossKandangs(row.id, kandangs);
      const st = basketAllocStatus(alloc, cap);
      if (st === "pas") pas += 1;
      else if (st === "parsial") parsial += 1;
      else if (st === "belum") belum += 1;
    }
    return { pas, parsial, belum };
  }, [skuLogs, kandangs]);

  const liveBatchErrors = useMemo(
    () =>
      validateKandangsForSubmit(kandangs, skuLogs, lineSpecies, speciesIdsOnReceipt).batchErrors,
    [kandangs, skuLogs, lineSpecies, speciesIdsOnReceipt]
  );

  function addKandang() {
    setKandangs((prev) => [...prev, emptyKandang(skuLogs, lineSpecies)]);
  }

  function removeKandang(idx: number) {
    setKandangs((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  function setKandangGross(idx: number, value: string) {
    setKandangs((prev) => prev.map((k, i) => (i === idx ? { ...k, grossKg: value } : k)));
  }

  function setKandangTare(idx: number, value: string) {
    setKandangs((prev) =>
      prev.map((k, i) => {
        if (i !== idx) return k;
        return applyAutoGross({ ...k, tareKg: value }, skuLogs, lineSpecies);
      })
    );
  }

  function setKandangSpecies(idx: number, speciesId: number) {
    setKandangs((prev) =>
      prev.map((k, i) => {
        if (i !== idx) return k;
        const mix = rejectMixForSpecies(speciesId, skuLogs, lineSpecies);
        const seg: RejectSegment | null = mix === "both" ? null : mix === "reject_only" ? "reject" : "normal";
        const allowed = new Set(
          logsInBatchScope({ ...k, targetSpeciesId: speciesId, rejectSegment: seg }, skuLogs, lineSpecies).map((l) => l.id)
        );
        const nextKg: Record<string, string> = {};
        for (const id of Object.keys(k.kgByLogId)) {
          if (allowed.has(id)) nextKg[id] = k.kgByLogId[id];
        }
        return { ...k, targetSpeciesId: speciesId, rejectSegment: seg, kgByLogId: nextKg };
      })
    );
  }

  function setKandangRejectSegment(idx: number, seg: RejectSegment) {
    setKandangs((prev) =>
      prev.map((k, i) => {
        if (i !== idx) return k;
        const allowed = new Set(
          logsInBatchScope({ ...k, rejectSegment: seg }, skuLogs, lineSpecies).map((l) => l.id)
        );
        const nextKg: Record<string, string> = {};
        for (const id of Object.keys(k.kgByLogId)) {
          if (allowed.has(id)) nextKg[id] = k.kgByLogId[id];
        }
        return { ...k, rejectSegment: seg, kgByLogId: nextKg };
      })
    );
  }

  function setKandangKg(idx: number, logId: string, value: string) {
    setKandangs((prev) => {
      const log = skuLogs.find((l) => l.id === logId);
      const cap = log ? allocatableNetKg(log) : NaN;
      const maxHere = remainingKgForKandang(logId, prev, idx, cap);
      const clamped = clampAllocToRemaining(value, maxHere);
      const updated = prev.map((k, i) =>
        i === idx ? { ...k, kgByLogId: { ...k.kgByLogId, [logId]: clamped } } : k
      );
      return sanitizeKandangAllocations(updated, skuLogs).map((k, i) =>
        i === idx ? applyAutoGross(k, skuLogs, lineSpecies) : k
      );
    });
  }

  const canAttemptSubmit = useMemo(() => {
    if (!perBasketFlow || skuLogs.length === 0) return false;
    return kandangs.some((k) => kandangHasAllocation(k, skuLogs));
  }, [perBasketFlow, skuLogs, kandangs]);

  async function handleSubmit() {
    setSaving(true);
    setMsg(null);

    const { batchErrors: errors, globalMessage } = validateKandangsForSubmit(
      kandangs,
      skuLogs,
      lineSpecies,
      speciesIdsOnReceipt
    );

    if (globalMessage) {
      setMsg({ type: "error", text: globalMessage });
      setSaving(false);
      return;
    }

    if (Object.keys(errors).length > 0) {
      setSaving(false);
      return;
    }

    try {
      const activeKandangs = kandangs.filter((k) => kandangHasAllocation(k, skuLogs));
      const result = await palletize(receiptId, {
        kandang_macan: activeKandangs.map((k) => {
          const basket_allocations = skuLogs
            .map((l) => {
              const net_kg = parseAllocKg(k.kgByLogId[l.id]);
              if (net_kg <= 0) return null;
              return { weighing_log_id: l.id, net_kg };
            })
            .filter((x): x is { weighing_log_id: string; net_kg: number } => x != null);
          return {
            pallet_gross_weight_kg: parseGrossPalletKg(k.grossKg),
            pallet_tare_weight_kg: parseTarePalletKg(k.tareKg),
            basket_allocations,
          } satisfies KandangMacanPalletizePayload;
        }),
      });
      setCreatedBatches(result.batches);
      setRepalletizing(true);
      if (receipt) {
        const speciesMap = buildLineSpeciesMap(receipt);
        const drafts = batchesToKandangDrafts(result.batches, skuLogs, speciesMap);
        setKandangs(drafts.length > 0 ? drafts : [emptyKandang(skuLogs, speciesMap)]);
      }
      router.push("/inbound-ikan");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setMsg({ type: "error", text: axiosErr.response?.data?.message || "Gagal menyimpan palletisasi." });
    } finally {
      setSaving(false);
    }
  }

  if (!receipt) return <p className="p-8 text-center text-gray-500">Memuat…</p>;
  if ((receipt.status === "APPROVED" || receipt.status === "REJECTED") && createdBatches.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Palletisasi Sudah Final</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {receipt.batchCode} — {receipt.supplierName}
          </p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Penerimaan ini sudah {receipt.status === "APPROVED" ? "disetujui" : "ditolak"}.
        </p>
        <button type="button" onClick={() => router.push("/inbound-ikan")} className={actionBtn("neutral")}>
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  if (receipt.status === "QC_CHECK" && !perBasketFlow) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Palletisasi (legacy)</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Penerimaan ini belum memakai Sizing &amp; Grading per basket. Gunakan alur pallet lama dari build sebelumnya atau selesaikan QC baris di sistem lama.
        </p>
        <button type="button" onClick={() => router.push("/inbound-ikan")} className={actionBtn("neutral")}>
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Paletisasi (Batch)</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {receipt.batchCode} — {receipt.supplierName}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Proses pengisian stok ikan ke dalam batch (kandang macan)
        </p>
        <div className="pt-2">
          <button type="button" onClick={() => router.push("/inbound-ikan")} className={actionBtn("neutral", "sm")}>
            Kembali
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            msg.type === "success"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {createdBatches.length > 0 && !repalletizing && receipt.status !== "QC_CHECK" && receipt.status !== "IN_PROGRESS" ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Batch yang Terbentuk</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {createdBatches.map((b) => (
              <div
                key={b.batchId}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card space-y-3"
              >
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Batch</p>
                  <p className="text-sm font-bold font-mono text-gray-900 dark:text-gray-100">{b.batchNumber}</p>
                  {b.fishSkuCode && <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">SKU: {b.fishSkuCode}</p>}
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
                    <p className="text-gray-500 dark:text-gray-400">Net (kg)</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{fmtKg(b.netWeightKg)} kg</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" onClick={() => router.push("/inbound-ikan")} className={actionBtn("primary")}>
              Kembali ke Dashboard
            </button>
            <button
              type="button"
              onClick={() =>
                printBatchQrCodes(createdBatches.map((b) => ({ batchNumber: b.batchNumber })))
              }
              className={actionBtn("neutral")}
            >
              Cetak QR Code
            </button>
          </div>
        </section>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card flex flex-col items-center gap-2">
              <AllocStatusBadge status="belum" />
              <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {allocStatusCounts.belum}
              </span>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card flex flex-col items-center gap-2">
              <AllocStatusBadge status="parsial" />
              <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {allocStatusCounts.parsial}
              </span>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card flex flex-col items-center gap-2">
              <AllocStatusBadge status="pas" />
              <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {allocStatusCounts.pas}
              </span>
            </div>
          </div>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Daftar Basket</h2>
            {hasRejectBaskets && (
              <RejectBatchLegend label="Basket Reject Mutu" className="mb-3" />
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pl-3 pr-3 w-12">#</th>
                    <th className="py-2 pr-3">Ikan</th>
                    <th className="py-2 pr-3">Size</th>
                    <th className="py-2 pr-3">Grade</th>
                    <th className="py-2 pr-3">SKU</th>
                    <th className="py-2 pr-3 text-right">Net kg</th>
                    <th className="py-2 pr-3 text-right">Dialokasi</th>
                    <th className="py-2 pr-8 text-right">Sisa</th>
                    <th className="py-2 pl-2 pr-3 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {skuLogs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-gray-500">
                        Belum ada basket dengan SKU.
                      </td>
                    </tr>
                  ) : (
                    basketPagination.visibleItems.map((row) => {
                      const cap = allocatableNetKg(row);
                      const alloc = totalAllocatedAcrossKandangs(row.id, kandangs);
                      const sisa = Number.isFinite(cap) ? cap - alloc : NaN;
                      const status = basketAllocStatus(alloc, cap);
                      const rejectRow = isRejectLog(row);
                      return (
                        <tr
                          key={row.id}
                          className={`border-t border-gray-100 dark:border-gray-800 ${rejectRow ? rejectBasketRowBgClass : ""}`}
                        >
                          <td
                            className={`py-2.5 pr-3 font-mono tabular-nums ${
                              rejectRow ? rejectBasketNumCellClass : "pl-3"
                            }`}
                          >
                            {row.basketNo}
                          </td>
                          <td className="py-2.5 pr-3">{row.speciesName}</td>
                          <td className="py-2.5 pr-3 text-xs">{row.itemSize ?? "—"}</td>
                          <td className="py-2.5 pr-3 text-xs">{row.gradeCode ?? "—"}</td>
                          <td className="py-2.5 pr-3 font-mono">{row.fishSkuCode ?? "—"}</td>
                          <td className="py-2.5 pr-3 text-right tabular-nums">{fmtKg(row.netWeight)}</td>
                          <td className="py-2.5 pr-3 text-right tabular-nums font-medium text-green-700 dark:text-green-400">
                            {fmtKg(alloc)}
                          </td>
                          <td className="py-2.5 pr-8 text-right tabular-nums font-medium text-red-600 dark:text-red-400">
                            {Number.isFinite(sisa) ? fmtKg(sisa) : "—"}
                          </td>
                          <td className="py-2.5 pl-2 pr-3 whitespace-nowrap">
                            <AllocStatusBadge status={status} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {basketPagination.totalPages > 1 && (
              <div className="flex justify-end gap-2 border-t border-gray-200 pt-3 mt-3 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => basketPagination.setPage(Math.max(basketPagination.page - 1, 1))}
                  disabled={basketPagination.page <= 1}
                  className="rounded border border-gray-300 px-2.5 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200"
                  aria-label="Halaman sebelumnya"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  onClick={() =>
                    basketPagination.setPage(
                      Math.min(basketPagination.page + 1, basketPagination.totalPages)
                    )
                  }
                  disabled={basketPagination.page >= basketPagination.totalPages}
                  className="rounded border border-gray-300 px-2.5 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200"
                  aria-label="Halaman berikutnya"
                >
                  &gt;
                </button>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {kandangs.map((k, idx) => {
            const mix = k.targetSpeciesId != null ? rejectMixForSpecies(k.targetSpeciesId, skuLogs, lineSpecies) : null;
            const segEff = effectiveRejectSegment(k, skuLogs, lineSpecies);
            const batchLogs = logsInBatchScope(k, skuLogs, lineSpecies);
            const multiSpecies = speciesIdsOnReceipt.length > 1;
            const batchNetKg = netAllocatedInKandang(k, skuLogs, lineSpecies);

            return (
              <section
                key={idx}
                className={`flex min-w-0 flex-col rounded-xl border-2 p-4 space-y-4 ${
                  liveBatchErrors[idx]
                    ? "border-red-400 bg-red-50/20 dark:border-red-700 dark:bg-red-950/25"
                    : "border-amber-300/90 bg-amber-50/25 dark:border-amber-700/70 dark:bg-amber-950/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Batch #{idx + 1}</p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={BATCH_NET_BADGE_CLASS}>Net: {fmtKg(batchNetKg)} kg</span>
                    {kandangs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeKandang(idx)}
                        className="inline-flex items-center justify-center rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                        aria-label="Hapus batch"
                        title="Hapus batch"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {liveBatchErrors[idx] && (
                  <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                    {liveBatchErrors[idx]}
                  </div>
                )}

                {multiSpecies && (
                  <fieldset className="space-y-3 border-0 p-0 m-0 mb-4">
                    <legend className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Jenis ikan untuk batch ini</legend>
                    <div className="flex flex-wrap gap-3">
                      {speciesIdsOnReceipt.map((sid) => (
                        <label key={sid} className="inline-flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name={`pallet-species-${idx}`}
                            checked={k.targetSpeciesId === sid}
                            onChange={() => setKandangSpecies(idx, sid)}
                            className="rounded-full border-gray-400"
                          />
                          <span>{speciesLabel(sid, skuLogs, lineSpecies)}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

                {!multiSpecies && k.targetSpeciesId != null && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-5">
                    Jenis ikan: <strong>{speciesLabel(k.targetSpeciesId, skuLogs, lineSpecies)}</strong>
                  </p>
                )}

                {k.targetSpeciesId != null && mix === "both" && (
                  <fieldset className="space-y-3 border-0 p-0 m-0 mb-5">
                    <legend className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Batch ini untuk basket reject atau non-reject? (tidak boleh dicampur)
                    </legend>
                    <div className="flex flex-wrap gap-3">
                      <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name={`pallet-reject-${idx}`}
                          checked={k.rejectSegment === "normal"}
                          onChange={() => setKandangRejectSegment(idx, "normal")}
                          className="rounded-full border-gray-400"
                        />
                        <span>Non-reject (standar)</span>
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name={`pallet-reject-${idx}`}
                          checked={k.rejectSegment === "reject"}
                          onChange={() => setKandangRejectSegment(idx, "reject")}
                          className="rounded-full border-gray-400"
                        />
                        <span>Reject</span>
                      </label>
                    </div>
                  </fieldset>
                )}

                {k.targetSpeciesId != null && mix != null && mix !== "both" && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-5">
                    {mix === "reject_only" ? (
                      <>
                        Spesies ini hanya punya basket <strong className="text-red-700">reject</strong> — alokasi hanya ke basket tersebut.
                      </>
                    ) : (
                      <>Spesies ini hanya basket <strong>non-reject</strong>.</>
                    )}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Gross pallet (kg)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={k.grossKg}
                      onChange={(e) => setKandangGross(idx, e.target.value)}
                      className={kandangFieldInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tare pallet (kg)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={k.tareKg}
                      onChange={(e) => setKandangTare(idx, e.target.value)}
                      className={kandangFieldInputClass}
                    />
                  </div>
                </div>

                {segEff == null && k.targetSpeciesId != null && mix === "both" && (
                  <p className="text-xs text-amber-800 dark:text-amber-200">Pilih dulu reject atau non-reject untuk menampilkan basket.</p>
                )}

                {k.targetSpeciesId == null && multiSpecies && (
                  <p className="text-xs text-amber-800 dark:text-amber-200">Pilih jenis ikan untuk menampilkan basket.</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {batchLogs.length === 0 ? (
                    <p className="text-xs text-gray-500 italic col-span-2">Belum ada basket pada filter ini.</p>
                  ) : (
                    batchLogs.map((log) => {
                      const cap = allocatableNetKg(log);
                      const remaining = remainingKgForKandang(log.id, kandangs, idx, cap);
                      const raw = k.kgByLogId[log.id] ?? "";
                      const thisKg = parseAllocKg(raw);
                      const invalidToken = raw.trim() !== "" && thisKg <= 0;
                      const noRemaining = Number.isFinite(remaining) && remaining <= KG_TOL;
                      const overRemaining = Number.isFinite(remaining) && thisKg > remaining + KG_TOL;
                      return (
                        <div
                          key={log.id}
                          className={basketAllocCardClass(log.id, kandangs, cap, overRemaining, noRemaining)}
                        >
                          <p className="font-medium text-gray-800 dark:text-gray-200 leading-snug">
                            Basket #{log.basketNo} ({log.fishSkuCode ?? "—"})
                            {log.isRejectBasket ? (
                              <span className="ml-1 font-normal text-red-600 dark:text-red-400">· reject</span>
                            ) : null}
                          </p>
                          <label className="mt-2 block">
                            <span className="text-gray-500 dark:text-gray-400">Alokasi kg</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={raw}
                              placeholder={noRemaining ? "—" : "0"}
                              disabled={noRemaining}
                              onChange={(e) => setKandangKg(idx, log.id, e.target.value)}
                              className={`mt-1 ${basketAllocInputClass(log.id, kandangs, cap, overRemaining, noRemaining)}`}
                            />
                          </label>
                          {Number.isFinite(remaining) && !noRemaining && (
                            <p className="mt-1 text-[11px] font-medium text-red-600 dark:text-red-400">
                              Max {fmtKg(remaining)} kg
                            </p>
                          )}
                          {noRemaining && (
                            <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                              Sudah teralokasi di batch lain
                            </p>
                          )}
                          {!noRemaining && overRemaining && (
                            <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">Melebihi sisa tersedia</p>
                          )}
                          {invalidToken && (
                            <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">Isi angka &gt; 0</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
          </div>

          <button type="button" onClick={addKandang} className={actionBtn("info", "sm")}>
            + Tambah batch
          </button>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!canAttemptSubmit || saving}
              className={`w-full sm:w-auto sm:min-w-[200px] ${actionBtn("success")}`}
            >
              {saving ? "Memproses…" : "Simpan Batch"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
