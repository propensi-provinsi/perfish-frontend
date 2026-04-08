"use client";

import { useEffect, useMemo, useState } from "react";
import StockOutboundModuleShell from "../components/StockOutboundModuleShell";
import { stockOutboundApi } from "@/lib/stock-outbound-api";
import type { FefoBatchStock, PalletStock } from "@/types/stock-outbound";
import { formatDate, formatKg } from "../components/formatters";

function dateAsNumber(value: string | null | undefined) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

export default function AlokasiPalletPage() {
  const [fefoBatches, setFefoBatches] = useState<FefoBatchStock[]>([]);
  const [pallets, setPallets] = useState<PalletStock[]>([]);
  const [batchSearch, setBatchSearch] = useState("");
  const [palletSearch, setPalletSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const [batchRes, palletRes] = await Promise.all([
          stockOutboundApi.getFefoBatches(batchSearch.trim()),
          stockOutboundApi.getPallets(palletSearch.trim()),
        ]);

        if (mounted) {
          setFefoBatches(batchRes.data.data ?? []);
          setPallets(palletRes.data.data ?? []);
        }
      } catch {
        if (mounted) {
          setError("Gagal memuat data batch FEFO atau pallet.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [batchSearch, palletSearch]);

  const prioritizedBatches = useMemo(() => {
    return [...fefoBatches]
      .filter((item) => item.currentQuantity > 0)
      .sort((left, right) => {
        const byExpiry = dateAsNumber(left.expirationDate) - dateAsNumber(right.expirationDate);
        if (byExpiry !== 0) return byExpiry;
        return dateAsNumber(left.productionDate) - dateAsNumber(right.productionDate);
      });
  }, [fefoBatches]);

  const availablePallets = pallets.filter((item) => item.status === "AVAILABLE").length;

  return (
    <StockOutboundModuleShell
      title="Data Pallet Alokasi"
      description="Prioritas alokasi mengikuti FEFO: batch dengan expiry paling dekat dan produksi paling lama diproses terlebih dahulu."
    >
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Batch FEFO Tersedia</p>
          <p className="mt-1 text-2xl font-bold text-navy dark:text-white">{prioritizedBatches.length}</p>
        </article>
        <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Pallet</p>
          <p className="mt-1 text-2xl font-bold text-navy dark:text-white">{pallets.length}</p>
        </article>
        <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Pallet Available</p>
          <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-400">{availablePallets}</p>
        </article>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <section className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-base font-semibold text-navy dark:text-white">Prioritas Batch FEFO</h2>
          <input
            value={batchSearch}
            onChange={(event) => setBatchSearch(event.target.value)}
            placeholder="Cari nomor batch / ikan"
            className="w-full md:w-80 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-section text-left">
              <tr>
                <th className="px-3 py-2">Prioritas</th>
                <th className="px-3 py-2">Batch Number</th>
                <th className="px-3 py-2">Jenis Ikan</th>
                <th className="px-3 py-2">Expiry</th>
                <th className="px-3 py-2">Production</th>
                <th className="px-3 py-2 text-right">Qty Saat Ini (Kg)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading data...
                  </td>
                </tr>
              ) : prioritizedBatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                    No data available.
                  </td>
                </tr>
              ) : (
                prioritizedBatches.map((item, index) => (
                  <tr key={item.batchId} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">#{index + 1}</td>
                    <td className="px-3 py-2 font-medium">{item.batchNumber}</td>
                    <td className="px-3 py-2">{item.fishSpeciesName ?? "-"}</td>
                    <td className="px-3 py-2">{formatDate(item.expirationDate)}</td>
                    <td className="px-3 py-2">{formatDate(item.productionDate)}</td>
                    <td className="px-3 py-2 text-right">{formatKg(item.currentQuantity)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-base font-semibold text-navy dark:text-white">Data Pallet</h2>
          <input
            value={palletSearch}
            onChange={(event) => setPalletSearch(event.target.value)}
            placeholder="Cari nomor pallet / QR"
            className="w-full md:w-80 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-section text-left">
              <tr>
                <th className="px-3 py-2">Pallet</th>
                <th className="px-3 py-2">QR</th>
                <th className="px-3 py-2">Species</th>
                <th className="px-3 py-2">Grade</th>
                <th className="px-3 py-2">Form</th>
                <th className="px-3 py-2">Packaging</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Range SKU (Kg)</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Block/Rack/Posisi</th>
                <th className="px-3 py-2 text-right">Current (Kg)</th>
                <th className="px-3 py-2 text-right">Capacity (Kg)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading data...
                  </td>
                </tr>
              ) : pallets.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                    No data available.
                  </td>
                </tr>
              ) : (
                pallets.map((item) => (
                  <tr key={item.palletId} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2 font-medium">{item.palletNumber}</td>
                    <td className="px-3 py-2">{item.qrCode}</td>
                    <td className="px-3 py-2">{item.speciesName ?? item.speciesCode ?? "-"}</td>
                    <td className="px-3 py-2">{item.gradeName ?? item.gradeCode ?? "-"}</td>
                    <td className="px-3 py-2">{item.formName ?? item.formCode ?? "-"}</td>
                    <td className="px-3 py-2">{item.packagingName ?? item.packagingCode ?? "-"}</td>
                    <td className="px-3 py-2">{item.skuCode ?? "-"}</td>
                    <td className="px-3 py-2">
                      {item.skuMinWeightKg != null || item.skuMaxWeightKg != null
                        ? `${formatKg(item.skuMinWeightKg)} - ${formatKg(item.skuMaxWeightKg)}`
                        : "-"}
                    </td>
                    <td className="px-3 py-2">{item.status}</td>
                    <td className="px-3 py-2">
                      {[item.blockName, item.rackCode, item.positionCode].filter(Boolean).join(" / ") || "-"}
                    </td>
                    <td className="px-3 py-2 text-right">{formatKg(item.currentWeight)}</td>
                    <td className="px-3 py-2 text-right">{formatKg(item.maxWeightCapacity)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </StockOutboundModuleShell>
  );
}
