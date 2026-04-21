"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  disposeBatch,
  listColdStorageStocks,
  listDisposalHistory,
} from "@/lib/coldstorage-api";
import type {
  ColdStorageStockRow,
  DisposalResponse,
} from "@/types/coldstorage";

/**
 * Panel untuk E05-PBI-05 (Pencatatan Disposal Stok Expired).
 *
 * - Menampilkan hanya batch berstatus EXPIRED pada dropdown (kategoriStatus = EXPIRED).
 * - Tombol "Dispose" hanya aktif ketika batch Expired dipilih.
 * - Field jumlah dan alasan wajib diisi.
 * - Menampilkan pesan sukses "Disposal berhasil dicatat".
 */
export default function DisposalPanel() {
  const router = useRouter();

  const [expiredStocks, setExpiredStocks] = useState<ColdStorageStockRow[]>([]);
  const [history, setHistory] = useState<DisposalResponse[]>([]);

  const [batchId, setBatchId] = useState<number | "">("");
  const [jumlahDibuang, setJumlahDibuang] = useState<string>("");
  const [alasan, setAlasan] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedBatch = useMemo(
    () => expiredStocks.find((s) => s.batchId === batchId) ?? null,
    [expiredStocks, batchId]
  );

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [expired, historyRows] = await Promise.all([
        listColdStorageStocks({ kategoriStatus: "EXPIRED" }),
        listDisposalHistory(),
      ]);
      setExpiredStocks(expired);
      setHistory(historyRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data disposal");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const canSubmit =
    !submitting &&
    !!selectedBatch &&
    Number(jumlahDibuang) > 0 &&
    Number(jumlahDibuang) <= Number(selectedBatch?.jumlahStok ?? 0) &&
    alasan.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedBatch) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await disposeBatch({
        batchId: selectedBatch.batchId,
        jumlahDibuang: Number(jumlahDibuang),
        alasan: alasan.trim(),
      });
      setSuccess("Disposal berhasil dicatat");
      setBatchId("");
      setJumlahDibuang("");
      setAlasan("");
      await loadData();
    } catch (err) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiMessage ?? (err instanceof Error ? err.message : "Gagal mencatat disposal"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Disposal Stok Expired</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            E05-PBI-05: Catat pembuangan stok yang telah melewati masa simpan.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/cold-storage")}>
          Kembali
        </Button>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-card"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Form Disposal</h2>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Batch Expired</label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              disabled={loading}
              required
            >
              <option value="">
                {expiredStocks.length === 0
                  ? "Tidak ada batch Expired — tombol Dispose hanya muncul untuk batch Expired"
                  : "Pilih batch Expired..."}
              </option>
              {expiredStocks.map((s) => (
                <option key={s.batchId} value={s.batchId}>
                  {s.batchNumber} — {s.speciesName} (sisa {s.jumlahStok} {s.unit ?? ""})
                </option>
              ))}
            </select>
          </div>

          {selectedBatch && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Stok tersedia: <b>{selectedBatch.jumlahStok} {selectedBatch.unit ?? ""}</b>.
              Disposal tidak boleh melebihi angka ini.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Jumlah Dibuang <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={jumlahDibuang}
                onChange={(e) => setJumlahDibuang(e.target.value)}
                min={0.01}
                step="0.01"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
                required
              />
            </div>
            <div className="flex items-end text-sm text-gray-500">
              {selectedBatch?.unit ? `Unit: ${selectedBatch.unit}` : ""}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Alasan Disposal <span className="text-red-500">*</span>
            </label>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
              placeholder="Contoh: Melewati masa simpan & ditemukan kristal es..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? "Menyimpan..." : "Dispose"}
            </Button>
          </div>
        </form>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-card">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Histori Disposal</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Memuat...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada riwayat disposal.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {history.map((h) => (
                <li key={h.disposalId} className="py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{h.batchNumber}</span>
                    <span className="text-xs text-gray-500">{new Date(h.disposedAt).toLocaleString()}</span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    {h.jumlahDibuang} {h.unit ?? ""} — {h.alasan}
                  </div>
                  <div className="text-xs text-gray-500">
                    Sisa stok setelah disposal: {h.remainingAfterDisposal} — oleh {h.disposedBy ?? "system"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
