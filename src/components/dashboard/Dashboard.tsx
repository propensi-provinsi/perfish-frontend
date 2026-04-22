"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { dashboardApi, reportApi, type AnalyticsPayload } from "@/lib/dashboard-api";

const TAB_ITEMS = [
  { id: "stock", label: "Stok" },
  { id: "daily", label: "Harian" },
  { id: "aging", label: "Aging" },
  { id: "utilization", label: "Utilisasi" },
  { id: "meeting", label: "Meeting" },
  { id: "reports", label: "Laporan" },
  { id: "executive", label: "Executive" },
] as const;

const DIVISION_OPTIONS = ["SBB", "PPL", "MARKETING", "PEMBELIAN"] as const;

type DashboardTab = (typeof TAB_ITEMS)[number]["id"];

type DashboardDataState = {
  stockSummary: AnalyticsPayload | null;
  stockBreakdown: AnalyticsPayload | null;
  stockBatchDetail: AnalyticsPayload | null;
  dailySummary: AnalyticsPayload | null;
  dailyTrend: AnalyticsPayload | null;
  aging: AnalyticsPayload | null;
  agingCritical: AnalyticsPayload | null;
  utilization: AnalyticsPayload | null;
  utilizationTrend: AnalyticsPayload | null;
  meetingSummary: AnalyticsPayload | null;
  meetingDivision: AnalyticsPayload | null;
  soFulfillment: AnalyticsPayload | null;
  distribution: AnalyticsPayload | null;
  exportReport: AnalyticsPayload | null;
  certification: AnalyticsPayload | null;
  discrepancy: AnalyticsPayload | null;
  discrepancyTrend: AnalyticsPayload | null;
  executive: AnalyticsPayload | null;
  executiveAlerts: AnalyticsPayload | null;
};

const INITIAL_DATA: DashboardDataState = {
  stockSummary: null,
  stockBreakdown: null,
  stockBatchDetail: null,
  dailySummary: null,
  dailyTrend: null,
  aging: null,
  agingCritical: null,
  utilization: null,
  utilizationTrend: null,
  meetingSummary: null,
  meetingDivision: null,
  soFulfillment: null,
  distribution: null,
  exportReport: null,
  certification: null,
  discrepancy: null,
  discrepancyTrend: null,
  executive: null,
  executiveAlerts: null,
};

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>("stock");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [divisionLoading, setDivisionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardDataState>(INITIAL_DATA);

  const [fromDate, setFromDate] = useState<string>(() => dateToInput(daysAgo(30)));
  const [toDate, setToDate] = useState<string>(() => dateToInput(new Date()));
  const [meetingPeriod, setMeetingPeriod] = useState<"weekly" | "monthly">("weekly");
  const [executivePeriod, setExecutivePeriod] = useState<string>("monthly");
  const [selectedDivision, setSelectedDivision] = useState<string>(DIVISION_OPTIONS[0]);

  const loadAll = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const [
        stockSummary,
        stockBreakdown,
        stockBatchDetail,
        dailySummary,
        dailyTrend,
        aging,
        agingCritical,
        utilization,
        utilizationTrend,
        meetingSummary,
        soFulfillment,
        distribution,
        exportReport,
        certification,
        discrepancy,
        discrepancyTrend,
        executive,
        executiveAlerts,
      ] = await Promise.all([
        dashboardApi.stockSummary(),
        dashboardApi.stockBreakdown({ groupBy: "species" }),
        dashboardApi.stockBatchDetail(),
        dashboardApi.dailySummary({ date: toDate }),
        dashboardApi.dailySummaryTrend({ from: fromDate, to: toDate }),
        dashboardApi.aging({ thresholdDays: 180 }),
        dashboardApi.agingCritical({ thresholdDays: 270 }),
        dashboardApi.coldStorageUtilization(),
        dashboardApi.coldStorageUtilizationTrend({ from: fromDate, to: toDate }),
        dashboardApi.meetingSummary({ period: meetingPeriod }),
        reportApi.soFulfillment({ from: fromDate, to: toDate }),
        reportApi.distribution({ from: fromDate, to: toDate }),
        reportApi.export({ from: fromDate, to: toDate }),
        reportApi.certificationSummary(),
        reportApi.weightDiscrepancy({ from: fromDate, to: toDate, threshold: 3 }),
        reportApi.weightDiscrepancyTrend({ from: fromDate, to: toDate, threshold: 3 }),
        dashboardApi.executive({ period: executivePeriod, from: fromDate, to: toDate }),
        dashboardApi.executiveAlerts(),
      ]);

      setData({
        stockSummary,
        stockBreakdown,
        stockBatchDetail,
        dailySummary,
        dailyTrend,
        aging,
        agingCritical,
        utilization,
        utilizationTrend,
        meetingSummary,
        meetingDivision: null,
        soFulfillment,
        distribution,
        exportReport,
        certification,
        discrepancy,
        discrepancyTrend,
        executive,
        executiveAlerts,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data dashboard";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [executivePeriod, fromDate, meetingPeriod, toDate]);

  const loadDivisionDetail = useCallback(async () => {
    setDivisionLoading(true);
    try {
      const division = await dashboardApi.meetingSummaryDivision(selectedDivision);
      setData((prev) => ({
        ...prev,
        meetingDivision: division,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat detail divisi";
      setError(message);
    } finally {
      setDivisionLoading(false);
    }
  }, [selectedDivision]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    void loadDivisionDetail();
  }, [loadDivisionDetail]);

  const titleDescription = useMemo(() => {
    return `Pantau KPI operasional, fulfillment, distribusi, ekspor, dan alert strategis dalam satu halaman.`;
  }, []);

  const stockSummary = data.stockSummary;
  const stockBreakdownRows = asArray(data.stockBreakdown?.items);
  const stockBatchRows = asArray(data.stockBatchDetail?.items);
  const dailySummary = data.dailySummary;
  const dailyTrendRows = asArray(data.dailyTrend?.trend);
  const agingRows = asArray(data.aging?.categories);
  const agingCriticalRows = asArray(data.agingCritical?.items);
  const utilizationRows = asArray(data.utilization?.items);
  const utilizationTrendRows = asArray(data.utilizationTrend?.items);
  const meetingHighlights = asArray(data.meetingSummary?.highlights);
  const meetingTopFish = asArray(data.meetingSummary?.topFish);
  const soSummary = asRecord(data.soFulfillment?.summary);
  const distributionSummary = asRecord(data.distribution?.summary);
  const exportSummary = asRecord(data.exportReport?.summary);
  const certificationSummary = asRecord(data.certification?.summary);
  const discrepancySummary = asRecord(data.discrepancy?.summary);
  const discrepancyRows = asArray(data.discrepancy?.items);
  const discrepancyTrendRows = asArray(data.discrepancyTrend?.trend);
  const executiveKpi = asRecord(data.executive?.kpi);
  const executiveTrend = asRecord(data.executive?.trend);
  const executiveAlerts = asArray(data.executiveAlerts?.items);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Selamat datang, <span className="font-medium">{user?.name}</span>. {titleDescription}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRefreshing(true);
            void loadAll();
          }}
          disabled={loading || refreshing}
        >
          {refreshing ? "Menyegarkan..." : "Refresh Data"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Filter Periode</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-gray-500">Dari</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-gray-500">Sampai</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-gray-500">Periode Meeting</span>
            <select
              value={meetingPeriod}
              onChange={(e) => setMeetingPeriod(e.target.value as "weekly" | "monthly")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-gray-500">Periode Executive</span>
            <select
              value={executivePeriod}
              onChange={(e) => setExecutivePeriod(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
        </div>
      </section>

      <section className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-dark-card">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-cyan text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-section"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-dark-card">
          Memuat dashboard...
        </div>
      ) : (
        <>
          {activeTab === "stock" && (
            <div className="space-y-4">
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Total Stok" value={formatKg(asNumber(stockSummary?.totalStockKg))} />
                <MetricCard title="Total Ton" value={formatTon(asNumber(stockSummary?.totalStockTon))} />
                <MetricCard title="Batch Aktif" value={formatInt(asNumber(stockSummary?.activeBatchCount))} />
                <MetricCard title="Total Grup" value={formatInt(stockBreakdownRows.length)} />
              </section>

              <DataTableCard title="Breakdown Stok per Species" columns={["Label", "Quantity (Kg)", "Quantity (Ton)"]}>
                {stockBreakdownRows.slice(0, 10).map((row) => (
                  <tr key={asString(row.label)} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">{asString(row.label)}</td>
                    <td className="px-3 py-2">{formatKg(asNumber(row.quantityKg))}</td>
                    <td className="px-3 py-2">{formatTon(asNumber(row.quantityTon))}</td>
                  </tr>
                ))}
              </DataTableCard>

              <DataTableCard
                title="Batch Detail (Top 10 Aging)"
                columns={["Batch", "Species", "Qty (Kg)", "Aging", "Lokasi", "Status"]}
              >
                {stockBatchRows.slice(0, 10).map((row) => (
                  <tr key={asString(row.batchId)} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2 font-medium">{asString(row.batchNumber)}</td>
                    <td className="px-3 py-2">{asString(row.speciesName)}</td>
                    <td className="px-3 py-2">{formatKg(asNumber(row.quantityKg))}</td>
                    <td className="px-3 py-2">{formatInt(asNumber(row.ageDays))} hari</td>
                    <td className="px-3 py-2">{asString(row.location)}</td>
                    <td className="px-3 py-2">{asString(row.status)}</td>
                  </tr>
                ))}
              </DataTableCard>
            </div>
          )}

          {activeTab === "daily" && (
            <div className="space-y-4">
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Inbound Harian" value={formatKg(asNumber(asRecord(dailySummary?.inbound).totalKg))} />
                <MetricCard title="Outbound Harian" value={formatKg(asNumber(asRecord(dailySummary?.outbound).totalKg))} />
                <MetricCard title="Net Flow" value={formatKg(asNumber(dailySummary?.netChangeKg))} />
                <MetricCard title="Total Hari" value={formatInt(dailyTrendRows.length)} />
              </section>

              <DataTableCard
                title="Trend Inbound vs Outbound"
                columns={["Tanggal", "Inbound (Kg)", "Outbound (Kg)", "Net (Kg)"]}
              >
                {dailyTrendRows.map((row) => (
                  <tr key={asString(row.date)} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">{asString(row.date)}</td>
                    <td className="px-3 py-2">{formatKg(asNumber(row.inboundKg))}</td>
                    <td className="px-3 py-2">{formatKg(asNumber(row.outboundKg))}</td>
                    <td className="px-3 py-2">{formatKg(asNumber(row.netKg))}</td>
                  </tr>
                ))}
              </DataTableCard>
            </div>
          )}

          {activeTab === "aging" && (
            <div className="space-y-4">
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Threshold Critical" value={`${formatInt(asNumber(data.agingCritical?.thresholdDays))} hari`} />
                <MetricCard title="Batch Critical" value={formatInt(asNumber(data.agingCritical?.count))} />
                <MetricCard title="Qty Critical" value={formatKg(asNumber(data.agingCritical?.totalQuantityKg))} />
                <MetricCard title="Kategori Aging" value={formatInt(agingRows.length)} />
              </section>

              <DataTableCard
                title="Distribusi Aging"
                columns={["Kategori", "Batch", "Quantity (Kg)", "Quantity (Ton)"]}
              >
                {agingRows.map((row) => (
                  <tr key={asString(row.label)} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">{asString(row.label)}</td>
                    <td className="px-3 py-2">{formatInt(asNumber(row.batchCount))}</td>
                    <td className="px-3 py-2">{formatKg(asNumber(row.quantityKg))}</td>
                    <td className="px-3 py-2">{formatTon(asNumber(row.quantityTon))}</td>
                  </tr>
                ))}
              </DataTableCard>

              <DataTableCard
                title="Batch Aging Kritis"
                columns={["Batch", "Species", "Age", "Qty", "Cold Storage"]}
              >
                {agingCriticalRows.slice(0, 15).map((row) => (
                  <tr key={asString(row.batchId)} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2 font-medium">{asString(row.batchNumber)}</td>
                    <td className="px-3 py-2">{asString(row.speciesName)}</td>
                    <td className="px-3 py-2">{formatInt(asNumber(row.ageDays))} hari</td>
                    <td className="px-3 py-2">{formatKg(asNumber(row.quantityKg))}</td>
                    <td className="px-3 py-2">{asString(row.coldStorageCode)}</td>
                  </tr>
                ))}
              </DataTableCard>
            </div>
          )}

          {activeTab === "utilization" && (
            <div className="space-y-4">
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Cold Storage Aktif" value={formatInt(utilizationRows.length)} />
                <MetricCard
                  title="Rata-rata Utilisasi"
                  value={`${formatNumber(avg(utilizationRows.map((row) => asNumber(row.utilizationPercent))), 2)}%`}
                />
                <MetricCard
                  title="Utilisasi Tertinggi"
                  value={`${formatNumber(max(utilizationRows.map((row) => asNumber(row.utilizationPercent))), 2)}%`}
                />
                <MetricCard title="Trend Item" value={formatInt(utilizationTrendRows.length)} />
              </section>

              <DataTableCard
                title="Utilisasi per Cold Storage"
                columns={["Gudang", "Terpakai (Ton)", "Kapasitas (Ton)", "Utilisasi"]}
              >
                {utilizationRows.map((row) => (
                  <tr key={asString(row.coldStorageId)} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">{asString(row.csCode)} - {asString(row.csName)}</td>
                    <td className="px-3 py-2">{formatTon(asNumber(row.usedTon))}</td>
                    <td className="px-3 py-2">{formatTon(asNumber(row.capacityTon))}</td>
                    <td className="px-3 py-2">{formatNumber(asNumber(row.utilizationPercent), 2)}%</td>
                  </tr>
                ))}
              </DataTableCard>
            </div>
          )}

          {activeTab === "meeting" && (
            <div className="space-y-4">
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Stock"
                  value={formatKg(asNumber(asRecord(data.meetingSummary?.overview).totalStockKg))}
                />
                <MetricCard
                  title="Throughput In"
                  value={formatKg(asNumber(asRecord(data.meetingSummary?.overview).throughputInboundKg))}
                />
                <MetricCard
                  title="Throughput Out"
                  value={formatKg(asNumber(asRecord(data.meetingSummary?.overview).throughputOutboundKg))}
                />
                <MetricCard
                  title="Fulfillment"
                  value={`${formatNumber(asNumber(asRecord(data.meetingSummary?.overview).fulfillmentRate), 2)}%`}
                />
              </section>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Meeting Summary per Divisi</h3>
                  <select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
                  >
                    {DIVISION_OPTIONS.map((division) => (
                      <option key={division} value={division}>
                        {division}
                      </option>
                    ))}
                  </select>
                </div>

                {divisionLoading ? (
                  <p className="text-sm text-gray-500">Memuat detail divisi...</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-dark-section">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Fokus Divisi</p>
                      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {asString(data.meetingDivision?.focus)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-dark-section">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Periode</p>
                      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {asString(data.meetingDivision?.from)} - {asString(data.meetingDivision?.to)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <DataTableCard title="Top Fish Outbound" columns={["Fish", "Volume (Kg)"]}>
                {meetingTopFish.map((row) => (
                  <tr key={asString(row.label)} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">{asString(row.label)}</td>
                    <td className="px-3 py-2">{formatKg(asNumber(row.value))}</td>
                  </tr>
                ))}
              </DataTableCard>

              <DataTableCard title="Highlight Meeting" columns={["Level", "Pesan"]}>
                {meetingHighlights.map((row, idx) => (
                  <tr key={`${asString(row.level)}-${idx}`} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">{asString(row.level)}</td>
                    <td className="px-3 py-2">{asString(row.message)}</td>
                  </tr>
                ))}
              </DataTableCard>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="space-y-4">
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <MetricCard
                  title="SO Fulfillment"
                  value={`${formatNumber(asNumber(soSummary.fulfillmentRate), 2)}%`}
                />
                <MetricCard title="Total Distribusi" value={formatKg(asNumber(distributionSummary.totalAllocatedKg))} />
                <MetricCard title="Ekspor Volume" value={formatKg(asNumber(exportSummary.totalVolumeKg))} />
                <MetricCard title="Cert Expired" value={formatInt(asNumber(certificationSummary.expired))} />
                <MetricCard title="Batch Anomali" value={formatInt(asNumber(discrepancySummary.anomalyBatch))} />
              </section>

              <DataTableCard
                title="Top Weight Discrepancy"
                columns={["Batch", "Species", "Inbound Approved", "Current Cold Storage", "Shrink %"]}
              >
                {discrepancyRows.slice(0, 12).map((row) => (
                  <tr key={asString(row.batchId)} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">{asString(row.batchNumber)}</td>
                    <td className="px-3 py-2">{asString(row.species)}</td>
                    <td className="px-3 py-2">{formatKg(asNumber(row.inboundKg))}</td>
                    <td className="px-3 py-2">{formatKg(asNumber(row.coldStorageKg ?? row.outboundKg))}</td>
                    <td className="px-3 py-2">{formatNumber(asNumber(row.shrinkPercent), 3)}%</td>
                  </tr>
                ))}
              </DataTableCard>

              <DataTableCard
                title="Trend Shrinkage"
                columns={["Bulan", "Avg Shrink %", "Anomaly Batch"]}
              >
                {discrepancyTrendRows.map((row) => (
                  <tr key={asString(row.month)} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">{asString(row.month)}</td>
                    <td className="px-3 py-2">{formatNumber(asNumber(row.averageShrinkPercent), 3)}%</td>
                    <td className="px-3 py-2">{formatInt(asNumber(row.anomalyBatch))}</td>
                  </tr>
                ))}
              </DataTableCard>
            </div>
          )}

          {activeTab === "executive" && (
            <div className="space-y-4">
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <MetricCard title="Stock Ton" value={formatTon(asNumber(executiveKpi.totalStockTon))} />
                <MetricCard
                  title="Fulfillment"
                  value={`${formatNumber(asNumber(executiveKpi.fulfillmentRate), 2)}%`}
                />
                <MetricCard
                  title="On Time Delivery"
                  value={`${formatNumber(asNumber(executiveKpi.onTimeDeliveryRate), 2)}%`}
                />
                <MetricCard title="Export Volume" value={formatKg(asNumber(executiveKpi.exportVolumeKg))} />
                <MetricCard
                  title="Avg Shrink"
                  value={`${formatNumber(asNumber(executiveKpi.avgShrinkPercent), 3)}%`}
                />
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
                  <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">Perubahan vs Periode Sebelumnya</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500">Throughput Outbound</dt>
                      <dd className="font-medium text-gray-900 dark:text-gray-100">
                        {formatNumber(asNumber(executiveTrend.throughputOutboundChangePercent), 2)}%
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500">Fulfillment Rate</dt>
                      <dd className="font-medium text-gray-900 dark:text-gray-100">
                        {formatNumber(asNumber(executiveTrend.fulfillmentRateChangePercent), 2)}%
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
                  <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">Executive Alerts</h3>
                  <ul className="space-y-2 text-sm">
                    {executiveAlerts.map((row, idx) => (
                      <li key={`${asString(row.type)}-${idx}`} className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-dark-section">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {asString(row.level)} - {asString(row.type)}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">{asString(row.message)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

function DataTableCard({
  title,
  columns,
  children,
}: {
  title: string;
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
      <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700">
              {columns.map((column) => (
                <th key={column} className="px-3 py-2">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </section>
  );
}

function asRecord(value: unknown): AnalyticsPayload {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as AnalyticsPayload;
  }
  return {};
}

function asArray(value: unknown): AnalyticsPayload[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is AnalyticsPayload => typeof item === "object" && item !== null && !Array.isArray(item));
}

function asString(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function formatNumber(value: number, maxFractionDigits = 2): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: maxFractionDigits }).format(value);
}

function formatInt(value: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

function formatKg(value: number): string {
  return `${formatNumber(value, 2)} kg`;
}

function formatTon(value: number): string {
  return `${formatNumber(value, 2)} ton`;
}

function avg(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function max(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  return Math.max(...values);
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function dateToInput(value: Date): string {
  return value.toISOString().slice(0, 10);
}
