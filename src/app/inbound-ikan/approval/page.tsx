"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { ModalOverlay, Field } from "@/components/inbound-fish/ModalPrimitives";
import { type InboundReceiptRow, approveInbound, getInboundReceipts, rejectInbound } from "@/lib/inbound-api";

export default function InboundApprovalPage() {
  return (
    <ProtectedRoute allowedRoles={["WAREHOUSE_ADMIN", "KEPALA_CABANG", "SUPERADMIN"]}>
      <AppShell>
        <InboundApprovalContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function InboundApprovalContent() {
  const [rows, setRows] = useState<InboundReceiptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState<InboundReceiptRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const pendingRows = useMemo(() => rows.filter((r) => r.status === "PENDING"), [rows]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInboundReceipts({ status: "PENDING" });
      setRows(data);
    } catch {
      setMsg({ type: "error", text: "Gagal memuat data approval." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleApprove(id: string) {
    setProcessingId(id);
    setMsg(null);
    try {
      await approveInbound(id);
      setMsg({ type: "success", text: "Penerimaan berhasil di-approve." });
      await load();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setMsg({ type: "error", text: axiosErr.response?.data?.message || "Gagal approve penerimaan." });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject() {
    if (!rejecting || !rejectReason.trim()) return;
    setProcessingId(rejecting.id);
    setMsg(null);
    try {
      await rejectInbound(rejecting.id, rejectReason.trim());
      setMsg({ type: "success", text: "Penerimaan berhasil di-reject." });
      setRejecting(null);
      setRejectReason("");
      await load();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setMsg({ type: "error", text: axiosErr.response?.data?.message || "Gagal reject penerimaan." });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Approval Penerimaan Batch</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Hanya penerimaan status Pending yang bisa di-approve atau di-reject.</p>
      </div>

      {msg && (
        <div className={`rounded-md border px-3 py-2 text-sm ${msg.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Daftar Pending Approval</h2>
          {loading && <span className="text-xs text-gray-500">Memuat…</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 dark:bg-white/5 dark:text-gray-400">
                <th className="px-4 py-2 font-medium">Kode Penerimaan</th>
                <th className="px-4 py-2 font-medium">Kode PO</th>
                <th className="px-4 py-2 font-medium">Supplier</th>
                <th className="px-4 py-2 font-medium">Tanggal</th>
                <th className="px-4 py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && pendingRows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Tidak ada data pending.</td></tr>
              )}
              {pendingRows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2 font-mono text-xs">{r.batchCode}</td>
                  <td className="px-4 py-2">{r.poCode ?? "—"}</td>
                  <td className="px-4 py-2">{r.supplierName}</td>
                  <td className="px-4 py-2">{r.tanggalPenerimaan}</td>
                  <td className="px-4 py-2">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleApprove(r.id)}
                        disabled={processingId === r.id}
                        className="rounded-md border border-green-500/60 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejecting(r)}
                        disabled={processingId === r.id}
                        className="rounded-md border border-red-500/60 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {rejecting && (
        <ModalOverlay onClose={() => setRejecting(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-dark-card space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Reject Penerimaan</h3>
            <p className="text-sm text-gray-500">Masukkan alasan reject untuk {rejecting.batchCode}.</p>
            <Field label="Alasan Reject" required>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-card dark:text-gray-100"
                placeholder="contoh: data timbang tidak valid"
                required
              />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRejecting(null)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">Batal</button>
              <button type="button" onClick={() => void handleReject()} disabled={!rejectReason.trim() || processingId === rejecting.id} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {processingId === rejecting.id ? "Menyimpan..." : "Reject"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

