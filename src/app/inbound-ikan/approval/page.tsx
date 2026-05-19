"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { type InboundReceiptRow, getInboundReceipts } from "@/lib/inbound-api";
import { actionBtn } from "@/lib/ui-action";
const APPROVAL_ROLES = ["WAREHOUSE_ADMIN", "SUPERADMIN"] as const;

export default function InboundApprovalPage() {
  return (
    <ProtectedRoute allowedRoles={[...APPROVAL_ROLES]}>
      <AppShell>
        <InboundApprovalContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function InboundApprovalContent() {
  const [rows, setRows] = useState<InboundReceiptRow[]>([]);
  const [loading, setLoading] = useState(false);
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
                    <Link href={`/inbound-ikan/summary/${r.id}`} className={actionBtn("primary", "xs")}>
                      Approval
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

