"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import SearchableSelect from "@/components/ui/SearchableSelect";
import ConfirmActionModal from "@/components/cold-storage/ConfirmActionModal";
import {
  COLD_STORAGE_PENDING_APPROVAL_MSG,
  disposeBatchMultipart,
  downloadDisposalBeritaAcara,
  listColdStorageStocks,
  listDisposalHistoryPaged,
} from "@/lib/coldstorage-api";
import {
  TableListPaginationFooter,
} from "@/components/ui/TableListPagination";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import { formatIdDateTime, resolveActorDisplay } from "@/lib/coldstorage-format";
import {
  alertErrorClass,
  alertSuccessClass,
  btnLightCyanClass,
  inputClass,
  labelClass,
  textMuted,
  textMutedXs,
} from "@/lib/coldstorage-ui";
import type {
  ColdStorageStockRow,
  DisposalResponse,
} from "@/types/coldstorage";

function formatDisposalQtyLine(h: DisposalResponse) {
  const unit = (h.unit ?? "KG").toUpperCase();
  const qty = h.jumlahDibuang;
  const reason = h.alasan?.trim() ? ` (${h.alasan.trim()})` : "";
  return `${qty} ${unit}${reason}`;
}

const DISPOSAL_HISTORY_PAGE_SIZE = 5;

export default function DisposalPanel() {
  const [availableStocks, setAvailableStocks] = useState<ColdStorageStockRow[]>([]);
  const [history, setHistory] = useState<DisposalResponse[]>([]);
  const [historyUiPage, setHistoryUiPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalElements, setHistoryTotalElements] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [batchId, setBatchId] = useState("");
  const [jumlahDibuang, setJumlahDibuang] = useState<string>("");
  const [alasan, setAlasan] = useState("");
  const [beritaAcara, setBeritaAcara] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const batchOptions = useMemo(
    () =>
      availableStocks.map((s) => ({
        value: String(s.batchId),
        label: `${s.batchNumber} — ${s.speciesName ?? "—"} (sisa ${s.jumlahStok} ${s.unit ?? ""})`,
        searchText: `${s.batchNumber} ${s.speciesName ?? ""}`,
      })),
    [availableStocks]
  );

  const selectedBatch = useMemo(
    () => availableStocks.find((s) => String(s.batchId) === batchId) ?? null,
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

  async function loadHistory(apiPage = historyUiPage - 1) {
    setHistoryLoading(true);
    try {
      const paged = await listDisposalHistoryPaged(apiPage, DISPOSAL_HISTORY_PAGE_SIZE);
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
    void loadHistory(page - 1);
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

  async function executeSubmit() {
    if (!canSubmit || !selectedBatch) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await disposeBatchMultipart({
        batchId: selectedBatch.batchId,
        jumlahDibuang: parsedJumlah,
        alasan: alasan.trim(),
        beritaAcara,
      });
      if (result.status === "pending") {
        setSuccess(result.message ?? COLD_STORAGE_PENDING_APPROVAL_MSG);
      } else {
        setSuccess("Disposal berhasil dicatat");
      }
      setBatchId("");
      setJumlahDibuang("");
      setAlasan("");
      setBeritaAcara(null);
      setHistoryUiPage(1);
      await Promise.all([loadStocks(), loadHistory(0)]);
    } catch (err) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiMessage ?? (err instanceof Error ? err.message : "Gagal mencatat disposal"));
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setConfirmOpen(true);
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

      {error && <div className={alertErrorClass}>{error}</div>}
      {success && <div className={alertSuccessClass}>{success}</div>}

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
            <SearchableSelect
              options={batchOptions}
              value={batchId}
              onChange={setBatchId}
              placeholder={
                availableStocks.length === 0
                  ? "Tidak ada batch dengan stok tersedia"
                  : "Pilih batch..."
              }
              disabled={loading}
              emptyMessage="Tidak ada batch dengan stok tersedia"
            />
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
              placeholder="Contoh: cacat, melewati masa simpan..."
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
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
              Total: <strong className="text-gray-900 dark:text-gray-100">{historyTotalElements}</strong> disposal
            </p>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {history.map((h) => (
                <li key={h.disposalId} className="py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{h.batchNumber}</span>
                    <span className={textMutedXs}>
                      <strong>{formatIdDateTime(h.disposedAt)}</strong>
                    </span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-200">{formatDisposalQtyLine(h)}</div>
                  <div className={textMutedXs}>
                    Sisa stok setelah disposal: {h.remainingAfterDisposal} kg (oleh{" "}
                    {resolveActorDisplay(h.disposedBy, h.disposedByName)})
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

      {confirmOpen && selectedBatch && (
        <ConfirmActionModal
          title="Catat Disposal"
          message={`Yakin membuang ${parsedJumlah} kg dari batch ${selectedBatch.batchNumber}?`}
          confirmLabel="Dispose"
          busy={submitting}
          onConfirm={() => void executeSubmit()}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
