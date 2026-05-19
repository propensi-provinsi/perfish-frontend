"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import {
  disposeBatchMultipart,
  downloadDisposalBeritaAcara,
  listColdStorageStocks,
  listDisposalHistoryPaged,
} from "@/lib/coldstorage-api";
import {
  TableListPaginationFooter,
  TableListPaginationToolbar,
} from "@/components/ui/TableListPagination";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import {
  alertErrorClass,
  alertSuccessClass,
  btnLightCyanClass,
  inputClass,
  labelClass,
  textBody,
  textHeadingLg,
  textMuted,
  textMutedXs,
} from "@/lib/coldstorage-ui";
import type {
  ColdStorageStockRow,
  DisposalResponse,
} from "@/types/coldstorage";

/**
 * Panel untuk E05-PBI-05 (Pencatatan Disposal Stok Expired).
 *
 * - Dropdown batch dengan stok tersedia (tidak terbatas status EXPIRED).
 * - Unggah Berita Acara Pemusnahan (wajib).
 * - Field jumlah dan alasan wajib diisi.
 * - Menampilkan pesan sukses "Disposal berhasil dicatat".
 */
export default function DisposalPanel() {
  const [availableStocks, setAvailableStocks] = useState<ColdStorageStockRow[]>([]);
  const [history, setHistory] = useState<DisposalResponse[]>([]);
  const [historyUiPage, setHistoryUiPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalElements, setHistoryTotalElements] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [batchId, setBatchId] = useState<number | "">("");
  const [jumlahDibuang, setJumlahDibuang] = useState<string>("");
  const [alasan, setAlasan] = useState("");
  const [beritaAcara, setBeritaAcara] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedBatch = useMemo(
    () => availableStocks.find((s) => s.batchId === batchId) ?? null,
    [availableStocks, batchId]
  );

  async function loadStocks() {
    const stocks = await listColdStorageStocks();
    setAvailableStocks(
      stocks.filter((s) => {
        const q = Number(s.jumlahStok ?? 0);
        return Number.isFinite(q) && q > 0;
      })
    );
  }

  async function loadHistory(apiPage = historyUiPage - 1, size = historyPageSize) {
    setHistoryLoading(true);
    try {
      const paged = await listDisposalHistoryPaged(apiPage, size);
      setHistory(paged.content ?? []);
      setHistoryTotalPages(Math.max(1, paged.totalPages ?? 1));
      setHistoryTotalElements(paged.totalElements ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat histori disposal");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadStocks(), loadHistory(0)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data disposal");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHistoryPageChange = (page: number) => {
    setHistoryUiPage(page);
    void loadHistory(page - 1, historyPageSize);
  };

  const handleHistoryPageSizeChange = (size: number) => {
    setHistoryPageSize(size);
    setHistoryUiPage(1);
    void loadHistory(0, size);
  };

  const maxQty = selectedBatch ? Number(selectedBatch.jumlahStok ?? 0) : 0;
  const parsedJumlah = Number(String(jumlahDibuang).replace(",", "."));

  const canSubmit =
    !submitting &&
    !!selectedBatch &&
    Number.isFinite(parsedJumlah) &&
    parsedJumlah > 0 &&
    parsedJumlah <= maxQty &&
    alasan.trim().length > 0 &&
    !!beritaAcara;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedBatch) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await disposeBatchMultipart({
        batchId: selectedBatch.batchId,
        jumlahDibuang: parsedJumlah,
        alasan: alasan.trim(),
        beritaAcara,
      });
      setSuccess("Disposal berhasil dicatat");
      setBatchId("");
      setJumlahDibuang("");
      setAlasan("");
      setBeritaAcara(null);
      setHistoryUiPage(1);
      await Promise.all([loadStocks(), loadHistory(0, historyPageSize)]);
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
      <header>
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Disposal Stok</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Mencatat pembuangan stok</p>
        </div>
      </header>
      <ColdStorageModuleNav />

      {error && (
        <div className={alertErrorClass}>{error}</div>
      )}
      {success && (
        <div className={alertSuccessClass}>{success}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-card"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Form Disposal</h2>

          <div>
            <label className={labelClass}>
              Pilih Batch <span className="text-red-500">*</span>
            </label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value ? Number(e.target.value) : "")}
              className={inputClass}
              disabled={loading}
              required
            >
              <option value="">
                {availableStocks.length === 0
                  ? "Tidak ada batch dengan stok tersedia"
                  : "Pilih batch..."}
              </option>
              {availableStocks.map((s) => (
                <option key={s.batchId} value={s.batchId}>
                  {s.batchNumber} — {s.speciesName} (sisa {s.jumlahStok} {s.unit ?? ""})
                </option>
              ))}
            </select>
          </div>

          {selectedBatch && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              Stok tersedia: <b>{selectedBatch.jumlahStok} {selectedBatch.unit ?? ""}</b>.
              Disposal tidak boleh melebihi angka ini.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Jumlah Dibuang (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={jumlahDibuang}
                onChange={(e) => setJumlahDibuang(e.target.value)}
                min={0.01}
                step="0.01"
                className={inputClass}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Diisi dalam kilogram (kg), tidak melebihi sisa stok yang ditampilkan.
              </p>
            </div>
            <div className="flex items-end text-sm text-gray-500 dark:text-gray-400">
              {selectedBatch?.unit ? `Unit stok batch: ${selectedBatch.unit}` : ""}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Alasan Disposal <span className="text-red-500">*</span>
            </label>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={3}
              maxLength={500}
              className={inputClass}
              placeholder="Contoh: Melewati masa simpan & ditemukan kristal es..."
              required
            />
          </div>

          <div>
            <label className={labelClass}>
              Berita Acara Pemusnahan <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={(e) => setBeritaAcara(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-700 dark:text-gray-200 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">PDF, JPG, atau PNG — wajib untuk setiap disposal.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/40"
            >
              {submitting ? "Menyimpan..." : "Dispose"}
            </Button>
          </div>
        </form>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-card">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Histori Disposal</h2>
          {loading || historyLoading ? (
            <p className={textMuted}>Memuat...</p>
          ) : history.length === 0 ? (
            <p className={textMuted}>Belum ada riwayat disposal.</p>
          ) : (
            <>
            <TableListPaginationToolbar
              totalCount={historyTotalElements}
              itemLabel="disposal"
              pageSize={historyPageSize}
              onPageSizeChange={handleHistoryPageSizeChange}
            />
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {history.map((h) => (
                <li key={h.disposalId} className="py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{h.batchNumber}</span>
                    <span className={textMutedXs}>{new Date(h.disposedAt).toLocaleString()}</span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-200">
                    {h.jumlahDibuang} {h.unit ?? ""} — {h.alasan}
                  </div>
                  <div className={textMutedXs}>
                    Sisa stok setelah disposal: {h.remainingAfterDisposal} — oleh {h.disposedBy ?? "system"}
                  </div>
                  {h.beritaAcaraStoredName && (
                    <div className="mt-1">
                      <button
                        type="button"
                        className={btnLightCyanClass}
                        onClick={async () => {
                          try {
                            const { blob, filename } = await downloadDisposalBeritaAcara(h.disposalId);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = filename;
                            a.click();
                            URL.revokeObjectURL(url);
                          } catch {
                            // eslint-disable-next-line no-alert
                            alert("Gagal mengunduh Berita Acara Pemusnahan");
                          }
                        }}
                      >
                        View BAP
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <TableListPaginationFooter
              page={historyUiPage}
              totalPages={historyTotalPages}
              totalCount={historyTotalElements}
              onPageChange={handleHistoryPageChange}
              disabled={historyLoading}
              show={historyTotalElements > 0}
            />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
