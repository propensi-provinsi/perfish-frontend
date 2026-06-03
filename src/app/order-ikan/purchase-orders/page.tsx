"use client";

import { useState, useEffect, useCallback, useMemo, type FormEvent } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { ModalOverlay, Field } from "@/components/inbound-fish/ModalPrimitives";
import apiClient from "@/lib/api";
import type { ApiResponse, SupplierData, FishSpeciesResponse, FishFormResponse } from "@/types";
import {
  type PurchaseOrderRow,
  getAllPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  lockPurchaseOrder,
} from "@/lib/inbound-api";
import { useAuth } from "@/context/AuthContext";
import { actionBtn } from "@/lib/ui-action";
import { canManagePurchaseOrder, PURCHASE_ORDER_ROLES } from "@/lib/rbac";
import {
  TableListPaginationFooter,
  TableListPaginationToolbar,
  useClientTablePagination,
} from "@/components/ui/TableListPagination";
import {
  ListFilterField,
  ListFilterSection,
  listFilterInputClass,
} from "@/components/inbound-fish/ListFilterSection";
import { matchesContainsSearch, sanitizeSearchQuery } from "@/lib/safe-search";

function fmtKg(v: number | string | null | undefined): string {
  const n = typeof v === "string" ? Number(v) : v;
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(n);
}

export default function PurchaseOrdersPage() {
  return (
    <ProtectedRoute allowedRoles={PURCHASE_ORDER_ROLES}>
      <AppShell>
        <PurchaseOrdersContent />
      </AppShell>
    </ProtectedRoute>
  );
}

type Toast = { type: "success" | "error"; message: string } | null;

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Open", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" },
  USED: { label: "Used", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" },
  LOCKED: { label: "Locked", cls: "bg-slate-200 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>;
}

function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

function PurchaseOrdersContent() {
  const { user } = useAuth();
  const canManagePo = canManagePurchaseOrder(user?.role);
  const [pos, setPos] = useState<PurchaseOrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrderRow | null>(null);
  const [deletingPoId, setDeletingPoId] = useState<number | null>(null);
  const [lockingPoId, setLockingPoId] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const [filterSupplierId, setFilterSupplierId] = useState("");
  const [filterArrivalDate, setFilterArrivalDate] = useState("");
  const [filterPoCode, setFilterPoCode] = useState("");

  const supplierFilterOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const po of pos) {
      if (po.supplierId) map.set(po.supplierId, po.supplierName);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [pos]);

  const filteredPos = useMemo(() => {
    const poCodeQuery = sanitizeSearchQuery(filterPoCode);
    return pos.filter((po) => {
      if (filterSupplierId && po.supplierId !== filterSupplierId) return false;
      if (filterArrivalDate && !po.expectedArrivalDate.startsWith(filterArrivalDate)) return false;
      if (poCodeQuery && !matchesContainsSearch(po.poCode, poCodeQuery)) return false;
      return true;
    });
  }, [pos, filterSupplierId, filterArrivalDate, filterPoCode]);

  const pagination = useClientTablePagination(filteredPos, {
    resetDeps: [filterSupplierId, filterArrivalDate, filterPoCode, pos.length],
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchPOs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPurchaseOrders();
      setPos(data);
    } catch { /* interceptor */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchPOs(); }, [fetchPOs]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg max-w-md ${toast.type === "success" ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300" : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300"}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 shrink-0 text-lg leading-none opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Purchase Orders</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-xl">
            Kelola pesanan pembelian ikan dari supplier. PO <strong>Open</strong> / <strong>Used</strong> bisa dipakai untuk penerimaan berulang; kunci PO (<strong>Locked</strong>) setelah semua penerimaan selesai.
          </p>
        </div>
        {canManagePo && (
          <button onClick={() => setShowAdd(true)} className={actionBtn("primary")}>
            + Tambah PO
          </button>
        )}
      </section>

      {!canManagePo && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
          Mode lihat saja: role kamu hanya bisa melihat daftar PO tanpa tambah/edit/hapus.
        </div>
      )}

      <ListFilterSection
        description="Filter daftar Purchase Order (real-time)."
        columnsClass="sm:grid-cols-2 lg:grid-cols-3"
        onReset={() => {
          setFilterSupplierId("");
          setFilterArrivalDate("");
          setFilterPoCode("");
        }}
      >
        <ListFilterField label="Supplier">
          <select
            value={filterSupplierId}
            onChange={(e) => setFilterSupplierId(e.target.value)}
            className={listFilterInputClass}
          >
            <option value="">Semua Supplier</option>
            {supplierFilterOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </ListFilterField>
        <ListFilterField label="Tanggal Kedatangan">
          <input
            type="date"
            value={filterArrivalDate}
            onChange={(e) => setFilterArrivalDate(e.target.value)}
            className={`${listFilterInputClass} dark:[color-scheme:dark]`}
          />
        </ListFilterField>
        <ListFilterField label="Kode PO">
          <input
            type="search"
            value={filterPoCode}
            onChange={(e) => setFilterPoCode(e.target.value)}
            placeholder="Cari kode PO"
            maxLength={64}
            className={listFilterInputClass}
          />
        </ListFilterField>
      </ListFilterSection>

      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Daftar PO</h2>
          {loading && <span className="text-xs text-gray-500 dark:text-gray-400">Memuat…</span>}
        </div>
        <TableListPaginationToolbar
          totalCount={pagination.totalCount}
          itemLabel="PO"
          pageSize={pagination.pageSize}
          onPageSizeChange={pagination.setPageSize}
          className="px-4 mb-3 flex flex-wrap items-center justify-between gap-2 text-sm"
        />
        <div className="overflow-x-auto px-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-left text-gray-600 dark:text-gray-400">
                <th className="px-2 py-3 w-10 font-medium" aria-label="Expand" />
                <th className="px-4 py-3 font-medium">Kode PO</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Tgl Kedatangan</th>
                <th className="px-4 py-3 font-medium text-right tabular-nums whitespace-nowrap w-28">Jumlah Item</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPos.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {pos.length === 0 ? "Belum ada Purchase Order." : "Tidak ada PO yang cocok dengan filter."}
                  </td>
                </tr>
              )}
              {pagination.visibleItems.map((po) => {
                const open = expandedIds.has(po.poId);
                return (
                  <PoTableRow
                    key={po.poId}
                    po={po}
                    open={open}
                    onToggle={() => toggleExpand(po.poId)}
                    onEdit={() => setEditingPo(po)}
                    onDelete={async () => {
                      try {
                        await deletePurchaseOrder(po.poId);
                        setToast({ type: "success", message: "Purchase Order berhasil dihapus." });
                        await fetchPOs();
                      } catch (err: unknown) {
                        const axiosErr = err as { response?: { data?: { message?: string } } };
                        setToast({ type: "error", message: axiosErr.response?.data?.message || "Gagal menghapus Purchase Order" });
                      } finally {
                        setDeletingPoId(null);
                      }
                    }}
                    onLock={async () => {
                      try {
                        await lockPurchaseOrder(po.poId);
                        setToast({ type: "success", message: `PO ${po.poCode} dikunci — tidak bisa penerimaan baru.` });
                        await fetchPOs();
                      } catch (err: unknown) {
                        const axiosErr = err as { response?: { data?: { message?: string } } };
                        setToast({ type: "error", message: axiosErr.response?.data?.message || "Gagal mengunci Purchase Order" });
                      } finally {
                        setLockingPoId(null);
                      }
                    }}
                    deletingPoId={deletingPoId}
                    setDeletingPoId={setDeletingPoId}
                    lockingPoId={lockingPoId}
                    setLockingPoId={setLockingPoId}
                    canManagePo={canManagePo}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        <TableListPaginationFooter
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          onPageChange={pagination.setPage}
          disabled={loading}
          show={!loading && pagination.totalCount > 0}
          className="px-4 pb-4 mt-4 flex flex-wrap items-center justify-between gap-2 text-sm"
        />
      </section>

      {showAdd && (
        <AddPOModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            setToast({ type: "success", message: "Purchase Order berhasil dibuat." });
            void fetchPOs();
          }}
          onError={(msg) => setToast({ type: "error", message: msg })}
        />
      )}

      {editingPo && (
        <AddPOModal
          title="Edit Purchase Order"
          submitLabel="Simpan Perubahan"
          initialData={editingPo}
          onClose={() => setEditingPo(null)}
          onSuccess={() => {
            setEditingPo(null);
            setToast({ type: "success", message: "Purchase Order berhasil diperbarui." });
            void fetchPOs();
          }}
          onError={(msg) => setToast({ type: "error", message: msg })}
          submitFn={async (payload) => updatePurchaseOrder(editingPo.poId, payload)}
        />
      )}
    </div>
  );
}

function PoTableRow({
  po,
  open,
  onToggle,
  onEdit,
  onDelete,
  onLock,
  deletingPoId,
  setDeletingPoId,
  lockingPoId,
  setLockingPoId,
  canManagePo,
}: {
  po: PurchaseOrderRow;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onLock: () => Promise<void>;
  deletingPoId: number | null;
  setDeletingPoId: (id: number | null) => void;
  lockingPoId: number | null;
  setLockingPoId: (id: number | null) => void;
  canManagePo: boolean;
}) {
  const status = (po.status ?? "").toUpperCase();
  const canEditDelete = canManagePo && status === "OPEN";
  const canLock = canManagePo && status === "USED";
  const showActions = canEditDelete || canLock;
  return (
    <>
      <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50/80 dark:hover:bg-white/5">
        <td className="px-2 py-3 align-middle">
          <button type="button" onClick={onToggle} className="rounded p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10" aria-expanded={open}>
            <span className="inline-block w-4 text-center text-xs">{open ? "▼" : "▶"}</span>
          </button>
        </td>
        <td className="px-4 py-3 font-mono text-xs font-semibold">{po.poCode}</td>
        <td className="px-4 py-3">{po.supplierName}</td>
        <td className="px-4 py-3 whitespace-nowrap">{formatDate(po.expectedArrivalDate)}</td>
        <td className="px-4 py-3 text-right tabular-nums">{po.details.length}</td>
        <td className="px-4 py-3"><StatusBadge status={po.status} /></td>
        <td className="px-4 py-3">
          {showActions ? (
            <div className="inline-flex gap-2">
            {canEditDelete && (
            <button
              type="button"
              onClick={onEdit}
              className={actionBtn("info", "xs")}
            >
              Edit
            </button>
            )}
            {canLock && (
              lockingPoId === po.poId ? (
                <>
                  <button type="button" onClick={() => void onLock()} className={actionBtn("warning", "xs")}>Ya, Kunci</button>
                  <button type="button" onClick={() => setLockingPoId(null)} className={actionBtn("neutral", "xs")}>Batal</button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setLockingPoId(po.poId)}
                  className={actionBtn("warning", "xs")}
                >
                  Kunci PO
                </button>
              )
            )}
            {canEditDelete &&
              (deletingPoId === po.poId ? (
                <>
                  <button type="button" onClick={() => void onDelete()} className={actionBtn("danger", "xs")}>Ya, Hapus</button>
                  <button type="button" onClick={() => setDeletingPoId(null)} className={actionBtn("neutral", "xs")}>Batal</button>
                </>
              ) : (
                <button type="button" onClick={() => setDeletingPoId(po.poId)} className={actionBtn("danger", "xs")}>
                  Hapus
                </button>
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
          )}
        </td>
      </tr>
      {open && (
        <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.03]">
          <td colSpan={7} className="px-4 py-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Rincian Ikan ({po.details.length} item)</p>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-white dark:bg-dark-card text-left text-gray-600 dark:text-gray-400">
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">Jenis Ikan</th>
                    <th className="px-3 py-2 font-medium">Bentuk</th>
                    <th className="px-3 py-2 font-medium">Size</th>
                    <th className="px-3 py-2 font-medium text-right">Berat Pesanan (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {po.details.map((d, idx) => (
                    <tr key={d.poDetailId} className="border-t border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100">
                      <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2">{d.speciesName ?? "—"}</td>
                      <td className="px-3 py-2">{d.formName ?? "—"}</td>
                      <td className="px-3 py-2">{d.itemSize ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{d.orderedWeightKg != null ? fmtKg(d.orderedWeightKg) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ================================================================
   Add PO Modal
   ================================================================ */

type LineDraft = {
  key: string;
  speciesId: number | "";
  formId: number | "";
  itemSize: string;
  orderedWeightKg: string;
};

function AddPOModal({
  onClose,
  onSuccess,
  onError,
  initialData,
  title = "Tambah PO",
  submitLabel = "Simpan PO",
  submitFn,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
  initialData?: PurchaseOrderRow;
  title?: string;
  submitLabel?: string;
  submitFn?: (payload: {
    supplierId: string;
    expectedArrivalDate: string;
    lines: { speciesId: number; formId?: number | null; itemSize?: string; orderedWeightKg?: number | null }[];
  }) => Promise<unknown>;
}) {
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [speciesOptions, setSpeciesOptions] = useState<FishSpeciesResponse[]>([]);
  const [formOptions, setFormOptions] = useState<FishFormResponse[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  const [supplierId, setSupplierId] = useState(initialData?.supplierId ?? "");
  const [expectedArrival, setExpectedArrival] = useState(() => initialData?.expectedArrivalDate ?? new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<LineDraft[]>(() =>
    initialData
      ? initialData.details.map((d) => ({
          key: crypto.randomUUID(),
          speciesId: d.speciesId ?? "",
          formId: d.formId ?? "",
          itemSize: d.itemSize ?? "",
          orderedWeightKg: d.orderedWeightKg != null ? String(d.orderedWeightKg) : "",
        }))
      : [{ key: crypto.randomUUID(), speciesId: "", formId: "", itemSize: "", orderedWeightKg: "" }]
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingMasters(true);
      try {
        const [suppRes, specRes, formRes] = await Promise.all([
          apiClient.get<ApiResponse<SupplierData[]>>("/v1/suppliers/active"),
          apiClient.get<ApiResponse<FishSpeciesResponse[]>>("/v1/master/fish/species"),
          apiClient.get<ApiResponse<FishFormResponse[]>>("/v1/master/fish/forms"),
        ]);
        setSuppliers(suppRes.data.data ?? []);
        setSpeciesOptions((specRes.data.data ?? []).filter((s) => s.isActive));
        setFormOptions((formRes.data.data ?? []).filter((f) => f.isActive));
      } catch {
        setError("Gagal memuat master data");
      } finally {
        setLoadingMasters(false);
      }
    })();
  }, []);

  function addLine() {
    setLines((prev) => [...prev, { key: crypto.randomUUID(), speciesId: "", formId: "", itemSize: "", orderedWeightKg: "" }]);
  }
  function removeLine(key: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  }
  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  const inputCls = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan dark:border-gray-600 dark:bg-dark-card dark:text-gray-100 dark:placeholder:text-gray-400";

  const linesValid = lines.every((l) => l.speciesId !== "" && l.formId !== "" && l.itemSize.trim() !== "");
  const canSubmit = !loadingMasters && supplierId && expectedArrival.trim() !== "" && lines.length >= 1 && linesValid;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        supplierId,
        expectedArrivalDate: expectedArrival,
        lines: lines.map((l) => ({
          speciesId: Number(l.speciesId),
          formId: l.formId === "" ? null : Number(l.formId),
          itemSize: l.itemSize.trim(),
          orderedWeightKg: l.orderedWeightKg.trim() ? Number(l.orderedWeightKg) : null,
        })),
      };
      if (submitFn) await submitFn(payload);
      else await createPurchaseOrder(payload);
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || "Gagal menyimpan Purchase Order";
      setError(msg);
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose} panelClassName="max-w-2xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h2>
      {error && <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">{error}</div>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Supplier" required>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} disabled={loadingMasters} className={inputCls}>
            <option value="">{loadingMasters ? "Memuat…" : "Pilih Supplier"}</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.supplierName} ({s.supplierCode})</option>)}
          </select>
        </Field>

        <Field label="Tanggal Kedatangan" required>
          <input type="date" value={expectedArrival} onChange={(e) => setExpectedArrival(e.target.value)} className={`${inputCls} dark:[color-scheme:dark]`} />
        </Field>

        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Rincian Jenis Ikan <span className="text-red-500">*</span></p>
            <button type="button" onClick={addLine} className={actionBtn("info", "sm")}>+</button>
          </div>
          {lines.map((row, idx) => (
            <div key={row.key} className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-white/5 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{idx + 1}.</span>
                {lines.length > 1 && <button type="button" onClick={() => removeLine(row.key)} className="text-xs text-red-600 hover:underline dark:text-red-400">Hapus</button>}
              </div>
              <Field label="Jenis Ikan" required>
                <select value={row.speciesId === "" ? "" : row.speciesId} onChange={(e) => updateLine(row.key, { speciesId: e.target.value === "" ? "" : Number(e.target.value) })} disabled={loadingMasters} className={`${inputCls} disabled:bg-gray-100`}>
                  <option value="">{loadingMasters ? "Memuat…" : "Pilih Jenis Ikan"}</option>
                  {speciesOptions.map((s) => <option key={s.speciesId} value={s.speciesId}>{s.speciesName}</option>)}
                </select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Bentuk" required>
                  <select value={row.formId === "" ? "" : row.formId} onChange={(e) => updateLine(row.key, { formId: e.target.value === "" ? "" : Number(e.target.value) })} disabled={loadingMasters} className={`${inputCls} disabled:bg-gray-100`}>
                    <option value="">{loadingMasters ? "Memuat…" : "Pilih bentuk"}</option>
                    {formOptions.map((f) => <option key={f.formId} value={f.formId}>{f.formName}</option>)}
                  </select>
                </Field>
                <Field label="Size" required>
                  <input type="text" value={row.itemSize} onChange={(e) => updateLine(row.key, { itemSize: e.target.value })} placeholder="Small, Medium, Large" maxLength={100} className={inputCls} />
                </Field>
              </div>
              <Field label="Berat Pesanan (kg)">
                <input type="number" min={0} step="0.001" value={row.orderedWeightKg} onChange={(e) => updateLine(row.key, { orderedWeightKg: e.target.value })} placeholder="Opsional" className={inputCls} />
              </Field>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={actionBtn("neutral")}>Batal</button>
          <button type="submit" disabled={!canSubmit || submitting} className={actionBtn("primary")}>{submitting ? "Menyimpan…" : submitLabel}</button>
        </div>
      </form>
    </ModalOverlay>
  );
}
