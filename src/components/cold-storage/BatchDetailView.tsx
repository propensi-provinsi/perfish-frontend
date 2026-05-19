"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import Button from "@/components/ui/Button";
import { getBatchDetailByNumber } from "@/lib/coldstorage-api";
import { batchDetailQrValue } from "@/lib/batch-detail-url";
import { stockCategoryStatusBadgeClass } from "@/lib/coldstorage-status";
import {
  alertErrorClass,
  formatDateDdMmYyyy,
  tableHeadClass,
  textBodySm,
  textHeadingLg,
  textMuted,
} from "@/lib/coldstorage-ui";
import type { BatchDetailResponse } from "@/types/coldstorage";
import { actionBtn } from "@/lib/ui-action";

function fmtQty(v: number | string | null | undefined): string {
  if (v == null) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);
}

function fmtTemp(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? Number(String(v).replace(",", ".")) : v;
  if (!Number.isFinite(n)) return "—";
  return `${n} °C`;
}

function fmtInstant(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID");
  } catch {
    return iso;
  }
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[minmax(140px,36%)_1fr]">
      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className={`text-sm ${textBodySm}`}>{value}</dd>
    </div>
  );
}

export default function BatchDetailView({ batchNumber }: { batchNumber: string }) {
  const [data, setData] = useState<BatchDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrValue, setQrValue] = useState(batchNumber);

  useEffect(() => {
    setQrValue(batchDetailQrValue(batchNumber));
  }, [batchNumber]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await getBatchDetailByNumber(batchNumber);
        if (!cancelled) setData(detail);
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setError(e instanceof Error ? e.message : "Gagal memuat detail batch");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [batchNumber]);

  const gradeLabel = useMemo(() => {
    if (!data) return "—";
    return data.gradeLabel ?? data.currentStock?.gradeLabel ?? data.batch.qualityGrade ?? "—";
  }, [data]);

  const skuCode = data?.fishSkuCode ?? data?.currentStock?.fishSkuCode ?? "—";
  const kategori = data?.batch.kategoriStatus ?? data?.currentStock?.kategoriStatus;

  if (loading) {
    return <p className={textMuted}>Memuat detail batch…</p>;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button type="button" variant="outline" size="sm" onClick={() => window.history.back()}>
          Kembali
        </Button>
        <div className={alertErrorClass}>{error ?? "Batch tidak ditemukan"}</div>
      </div>
    );
  }

  const { batch, inLoadingBay, currentStock, assignContext, history, storageTempC } = data;

  return (
    <div className="space-y-6">
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => window.history.back()}>
          Kembali
        </Button>
        <h1 className="mt-2 text-2xl font-bold text-navy dark:text-white">{batch.batchNumber}</h1>
        <div className="mt-3 inline-flex rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-dark-card">
          <QRCodeSVG value={qrValue} size={112} level="M" />
        </div>
      </div>

      <section className="flex flex-wrap gap-2">
        {batch.status ? (
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {batch.status}
          </span>
        ) : null}
        {kategori ? (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${stockCategoryStatusBadgeClass(kategori)}`}
          >
            {kategori}
          </span>
        ) : null}
        {inLoadingBay ? (
          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
            Loading Bay
          </span>
        ) : currentStock ? (
          <span className="inline-flex rounded-full bg-cyan/15 px-3 py-1 text-xs font-semibold text-cyan dark:bg-cyan/25 dark:text-cyan-300">
            Di Cold Storage
          </span>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
          <h2 className={textHeadingLg}>Informasi Batch</h2>
          <dl className="mt-4 space-y-3">
            <DetailRow label="Species" value={batch.fishSpeciesName ?? "—"} />
            <DetailRow label="Grade" value={gradeLabel} />
            <DetailRow label="SKU" value={skuCode} />
            <DetailRow
              label="Stok Saat Ini"
              value={
                <>
                  {fmtQty(batch.currentQuantity)} {batch.unit ?? ""}
                  {batch.totalQuantity != null && (
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                      (awal: {fmtQty(batch.totalQuantity)} {batch.unit ?? ""})
                    </span>
                  )}
                </>
              }
            />
            <DetailRow label="Tanggal Batch" value={formatDateDdMmYyyy(batch.batchDate ?? null)} />
            <DetailRow label="Kadaluarsa" value={formatDateDdMmYyyy(batch.expirationDate ?? null)} />
            {currentStock?.daysToExpire != null ? (
              <DetailRow label="Hari ke Kadaluarsa" value={String(currentStock.daysToExpire)} />
            ) : null}
            <DetailRow label="Supplier" value={batch.supplierName ?? "—"} />
            <DetailRow label="Suhu" value={fmtTemp(storageTempC)} />
            <DetailRow
              label="Umur Simpan"
              value={
                batch.umurSimpanDays != null ? (
                  <>
                    {batch.umurSimpanDays} hari
                    {(batch.umurSimpanBulan ?? 0) > 0 && (
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                        ({batch.umurSimpanBulan} bln)
                      </span>
                    )}
                  </>
                ) : (
                  "—"
                )
              }
            />
          </dl>
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
            <h2 className={textHeadingLg}>Penerimaan Inbound</h2>
            <dl className="mt-4 space-y-3">
              <DetailRow label="Kode Penerimaan" value={batch.inboundReceiptCode ?? "—"} />
              <DetailRow
                label="Lokasi Penerimaan"
                value={batch.lokasiPenerimaan ?? assignContext?.inboundColdStorageName ?? "—"}
              />
              <DetailRow label="Tanggal Penerimaan" value={formatDateDdMmYyyy(batch.tanggalMasuk ?? null)} />
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
            <h2 className={textHeadingLg}>Lokasi Penyimpanan</h2>
            {inLoadingBay ? (
              <div className="mt-4 space-y-3">
                <p className={`text-sm ${textBodySm}`}>
                  Batch berada di <strong>Loading Bay</strong> — belum ditetapkan ke posisi rack.
                </p>
                <Link
                  href={`/cold-storage/assign-location?batchId=${batch.batchId}`}
                  className={actionBtn("primary", "sm")}
                >
                  Tetapkan Lokasi
                </Link>
              </div>
            ) : currentStock ? (
              <dl className="mt-4 space-y-3">
                <DetailRow
                  label="Gudang"
                  value={`${currentStock.warehouseCode} — ${currentStock.warehouseName}`}
                />
                <DetailRow label="Storage Area" value={currentStock.storageArea} />
                <DetailRow label="Tanggal Masuk Rack" value={formatDateDdMmYyyy(currentStock.tanggalMasuk)} />
                <Link
                  href={`/cold-storage/move-batch?batchId=${batch.batchId}`}
                  className={`mt-2 inline-flex ${actionBtn("primary", "sm")}`}
                >
                  Pemindahan Lokasi
                </Link>
              </dl>
            ) : (
              <p className={`mt-4 text-sm ${textMuted}`}>Tidak ada lokasi rack aktif untuk batch ini.</p>
            )}
          </div>
        </section>
      </div>

      {history.timeline.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
          <h2 className={textHeadingLg}>Linimasa</h2>
          <ol className="mt-4 space-y-4 border-l-2 border-gray-200 pl-4 dark:border-gray-700">
            {history.timeline.map((item, idx) => (
              <li key={`${item.timestamp}-${idx}`} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-cyan" />
                <p className="text-xs text-gray-500 dark:text-gray-400">{fmtInstant(item.timestamp)}</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
                <p className={`text-sm ${textBodySm}`}>{item.description}</p>
                {item.actor ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">oleh {item.actor}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      )}

      {history.movementHistory.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
          <h2 className={textHeadingLg}>Histori Perpindahan Lokasi</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className={tableHeadClass}>
                  <th className="py-2 pr-3">Gudang</th>
                  <th className="py-2 pr-3">Area</th>
                  <th className="py-2 pr-3">Tgl Masuk</th>
                  <th className="py-2 pr-3">Aktif</th>
                  <th className="py-2 pr-3">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {history.movementHistory.map((m) => (
                  <tr key={m.locationId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className={`py-2 pr-3 ${textBodySm}`}>
                      {m.warehouseCode ? `${m.warehouseCode} — ${m.warehouseName ?? ""}` : "—"}
                    </td>
                    <td className={`py-2 pr-3 ${textBodySm}`}>{m.storageArea ?? "—"}</td>
                    <td className={`py-2 pr-3 ${textBodySm}`}>{formatDateDdMmYyyy(m.tanggalMasuk)}</td>
                    <td className={`py-2 pr-3 ${textBodySm}`}>{m.isActive ? "Ya" : "Tidak"}</td>
                    <td className={`py-2 pr-3 text-xs ${textBodySm}`}>{fmtInstant(m.movedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {history.disposalHistory.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
          <h2 className={textHeadingLg}>Histori Disposal</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className={tableHeadClass}>
                  <th className="py-2 pr-3">Jumlah</th>
                  <th className="py-2 pr-3">Alasan</th>
                  <th className="py-2 pr-3">Sisa Stok</th>
                  <th className="py-2 pr-3">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {history.disposalHistory.map((d) => (
                  <tr key={d.disposalId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className={`py-2 pr-3 ${textBodySm}`}>
                      {d.jumlahDibuang} {d.unit ?? ""}
                    </td>
                    <td className={`py-2 pr-3 ${textBodySm}`}>{d.alasan}</td>
                    <td className={`py-2 pr-3 ${textBodySm}`}>{d.remainingAfterDisposal ?? "—"}</td>
                    <td className={`py-2 pr-3 text-xs ${textBodySm}`}>{fmtInstant(d.disposedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  );
}
