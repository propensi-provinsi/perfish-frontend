"use client";

import { useEffect, useMemo, useState } from "react";
import StockOutboundModuleShell from "../components/StockOutboundModuleShell";
import { stockOutboundApi } from "@/lib/stock-outbound-api";
import type { SalesOrderOutboundSummary } from "@/types/stock-outbound";
import { formatDate, formatKg, isOpenSalesOrderStatus } from "../components/formatters";

function joinUnique(values: Array<string | null | undefined>) {
  const unique = Array.from(new Set(values.map((value) => (value ?? "").trim()).filter(Boolean)));
  return unique.length > 0 ? unique.join(", ") : "-";
}

function renderCriteria(item: SalesOrderOutboundSummary) {
  const criteria = item.criteria ?? [];
  return {
    species: joinUnique(criteria.map((entry) => entry.speciesName ?? entry.speciesCode)),
    grade: joinUnique(criteria.map((entry) => entry.gradeName ?? entry.gradeCode ?? entry.qualityGrade)),
    form: joinUnique(criteria.map((entry) => entry.formName ?? entry.formCode)),
    packaging: joinUnique(criteria.map((entry) => entry.packagingName ?? entry.packagingCode)),
    sku: joinUnique(criteria.map((entry) => entry.skuCode)),
  };
}

export default function PenerimaanSalesOrderPage() {
  const [salesOrders, setSalesOrders] = useState<SalesOrderOutboundSummary[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await stockOutboundApi.getSalesOrders();
        if (mounted) {
          setSalesOrders(response.data.data ?? []);
        }
      } catch {
        if (mounted) {
          setError("Gagal memuat data sales order outbound.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, []);

  const openSalesOrders = useMemo(
    () => salesOrders.filter((item) => isOpenSalesOrderStatus(item.salesOrderStatus)),
    [salesOrders]
  );

  const filteredSalesOrders = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) return openSalesOrders;

    return openSalesOrders.filter((item) => {
      const criteriaText = (item.criteria ?? [])
        .flatMap((entry) => [
          entry.speciesName,
          entry.speciesCode,
          entry.gradeName,
          entry.gradeCode,
          entry.formName,
          entry.formCode,
          entry.packagingName,
          entry.packagingCode,
          entry.skuCode,
        ])
        .filter(Boolean)
        .join(" ");
      const haystack = [item.soNumber, item.customerName, criteriaText].join(" ").toLowerCase();
      return haystack.includes(search);
    });
  }, [keyword, openSalesOrders]);

  const fullyAllocatedCount = openSalesOrders.filter((item) => item.fullyAllocated).length;

  return (
    <StockOutboundModuleShell
      title="Penerimaan Sales Order"
      description="Menampilkan daftar Sales Order OPEN/ACTIVE yang siap diproses ke alokasi outbound."
    >
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">SO OPEN/ACTIVE</p>
          <p className="mt-1 text-2xl font-bold text-navy dark:text-white">{openSalesOrders.length}</p>
        </article>
        <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">SO Fully Allocated</p>
          <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-400">{fullyAllocatedCount}</p>
        </article>
        <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">SO Belum Allocated Penuh</p>
          <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
            {Math.max(openSalesOrders.length - fullyAllocatedCount, 0)}
          </p>
        </article>
      </section>

      <section className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-base font-semibold text-navy dark:text-white">Daftar Sales Order</h2>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Cari no SO atau customer"
            className="w-full md:w-80 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-section text-left">
              <tr>
                <th className="px-3 py-2">Nomor SO</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Species</th>
                <th className="px-3 py-2">Grade</th>
                <th className="px-3 py-2">Form</th>
                <th className="px-3 py-2">Packaging</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Issue Date</th>
                <th className="px-3 py-2 text-right">Required (Kg)</th>
                <th className="px-3 py-2 text-right">Allocated (Kg)</th>
                <th className="px-3 py-2 text-right">Remaining (Kg)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading data...
                  </td>
                </tr>
              ) : filteredSalesOrders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                    No data available.
                  </td>
                </tr>
              ) : (
                filteredSalesOrders.map((item) => {
                  const criteria = renderCriteria(item);

                  return (
                    <tr key={item.soId} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2 font-medium">{item.soNumber}</td>
                      <td className="px-3 py-2">{item.customerName}</td>
                      <td className="px-3 py-2">{criteria.species}</td>
                      <td className="px-3 py-2">{criteria.grade}</td>
                      <td className="px-3 py-2">{criteria.form}</td>
                      <td className="px-3 py-2">{criteria.packaging}</td>
                      <td className="px-3 py-2">{criteria.sku}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-cyan/10 px-2 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                          {item.salesOrderStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2">{formatDate(item.issueDate)}</td>
                      <td className="px-3 py-2 text-right">{formatKg(item.totalRequiredKg)}</td>
                      <td className="px-3 py-2 text-right">{formatKg(item.totalAllocatedKg)}</td>
                      <td className="px-3 py-2 text-right">{formatKg(item.remainingKg)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </StockOutboundModuleShell>
  );
}
