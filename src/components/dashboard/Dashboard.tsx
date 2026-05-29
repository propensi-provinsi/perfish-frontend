"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { dashboardApi, reportApi, type AnalyticsPayload } from "@/lib/dashboard-api";
import {
  AgingTabPanel,
  DailyTabPanel,
  ExecutiveTabPanel,
  MeetingTabPanel,
  ReportsTabPanel,
  StockTabPanel,
  UtilizationTabPanel,
} from "./DashboardTabPanels";
import { asArray, asRecord, dateToInput, daysAgo } from "./dashboard-utils";

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
  receivingGroupRollup: AnalyticsPayload | null;
  stockOpnameShrinkage: AnalyticsPayload | null;
  executive: AnalyticsPayload | null;
  executiveAlerts: AnalyticsPayload | null;
  executivePoVsSo: AnalyticsPayload | null;
  executiveTopPartners: AnalyticsPayload | null;
  executiveSoPendingDelivery: AnalyticsPayload | null;
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
  receivingGroupRollup: null,
  stockOpnameShrinkage: null,
  executive: null,
  executiveAlerts: null,
  executivePoVsSo: null,
  executiveTopPartners: null,
  executiveSoPendingDelivery: null,
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
  const [selectedStockLabel, setSelectedStockLabel] = useState<string>("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("");

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
        receivingGroupRollup,
        stockOpnameShrinkage,
        executive,
        executiveAlerts,
        executivePoVsSo,
        executiveTopPartners,
        executiveSoPendingDelivery,
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
        reportApi.receivingGroupRollup({ from: fromDate, to: toDate }),
        reportApi.stockOpnameShrinkage({ from: fromDate, to: toDate }),
        dashboardApi.executive({ period: executivePeriod, from: fromDate, to: toDate }),
        dashboardApi.executiveAlerts(),
        dashboardApi.executivePoVsSo({ period: executivePeriod, from: fromDate, to: toDate }),
        dashboardApi.executiveTopPartners({ period: executivePeriod, from: fromDate, to: toDate, limit: 5 }),
        dashboardApi.executiveSoPendingDelivery(),
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
        receivingGroupRollup,
        stockOpnameShrinkage,
        executive,
        executiveAlerts,
        executivePoVsSo,
        executiveTopPartners,
        executiveSoPendingDelivery,
      });
      setLastRefreshedAt(new Date().toISOString());
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
      setData((prev) => ({ ...prev, meetingDivision: division }));
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

  const stockBreakdownRows = asArray(data.stockBreakdown?.items);
  const stockBatchRows = asArray(data.stockBatchDetail?.items);
  const dailyTrendRows = asArray(data.dailyTrend?.trend);
  const agingRows = asArray(data.aging?.categories);
  const agingCriticalRows = asArray(data.agingCritical?.items);
  const utilizationRows = asArray(data.utilization?.items);
  const utilizationTrendItems = asArray(data.utilizationTrend?.items);
  const meetingHighlights = asArray(data.meetingSummary?.highlights);
  const meetingTopFish = asArray(data.meetingSummary?.topFish);
  const discrepancyRows = asArray(data.discrepancy?.items);
  const discrepancyTrendRows = asArray(data.discrepancyTrend?.trend);
  const receivingGroupRows = asArray(data.receivingGroupRollup?.items);
  const stockOpnameTrendRows = asArray(data.stockOpnameShrinkage?.trend);
  const executiveAlerts = asArray(data.executiveAlerts?.items);
  const poVsSoTrendRows = asArray(data.executivePoVsSo?.trend);
  const topSuppliers = asArray(data.executiveTopPartners?.suppliers);
  const topCustomers = asArray(data.executiveTopPartners?.customers);
  const soPendingDeliveryRows = asArray(data.executiveSoPendingDelivery?.items);

  const tabContent = useMemo(() => {
    if (loading) return null;

    switch (activeTab) {
      case "stock":
        return (
          <StockTabPanel
            stockSummary={data.stockSummary}
            stockBreakdownRows={stockBreakdownRows}
            stockBatchRows={stockBatchRows}
            selectedStockLabel={selectedStockLabel}
            onSelectStockLabel={setSelectedStockLabel}
            lastRefreshedAt={lastRefreshedAt}
          />
        );
      case "daily":
        return <DailyTabPanel dailySummary={data.dailySummary} dailyTrendRows={dailyTrendRows} />;
      case "aging":
        return (
          <AgingTabPanel
            agingRows={agingRows}
            agingCritical={data.agingCritical}
            agingCriticalRows={agingCriticalRows}
          />
        );
      case "utilization":
        return (
          <UtilizationTabPanel
            utilizationRows={utilizationRows}
            utilizationTrendItems={utilizationTrendItems}
          />
        );
      case "meeting":
        return (
          <MeetingTabPanel
            meetingSummary={data.meetingSummary}
            meetingDivision={data.meetingDivision}
            meetingTopFish={meetingTopFish}
            meetingHighlights={meetingHighlights}
            selectedDivision={selectedDivision}
            onDivisionChange={setSelectedDivision}
            divisionLoading={divisionLoading}
          />
        );
      case "reports":
        return (
          <ReportsTabPanel
            soSummary={asRecord(data.soFulfillment?.summary)}
            distributionSummary={asRecord(data.distribution?.summary)}
            exportSummary={asRecord(data.exportReport?.summary)}
            certificationSummary={asRecord(data.certification?.summary)}
            discrepancySummary={asRecord(data.discrepancy?.summary)}
            discrepancyRows={discrepancyRows}
            discrepancyTrendRows={discrepancyTrendRows}
            receivingGroupRows={receivingGroupRows}
            stockOpnameTrendRows={stockOpnameTrendRows}
          />
        );
      case "executive":
        return (
          <ExecutiveTabPanel
            executiveKpi={asRecord(data.executive?.kpi)}
            executiveTrend={asRecord(data.executive?.trend)}
            executiveAlerts={executiveAlerts}
            poVsSoTrendRows={poVsSoTrendRows}
            topSuppliers={topSuppliers}
            topCustomers={topCustomers}
            soPendingDeliveryRows={soPendingDeliveryRows}
          />
        );
      default:
        return null;
    }
  }, [
    activeTab,
    agingCriticalRows,
    agingRows,
    dailyTrendRows,
    data,
    discrepancyRows,
    discrepancyTrendRows,
    divisionLoading,
    lastRefreshedAt,
    receivingGroupRows,
    stockOpnameTrendRows,
    executiveAlerts,
    loading,
    meetingHighlights,
    meetingTopFish,
    poVsSoTrendRows,
    selectedDivision,
    selectedStockLabel,
    soPendingDeliveryRows,
    stockBatchRows,
    stockBreakdownRows,
    topCustomers,
    topSuppliers,
    utilizationRows,
    utilizationTrendItems,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Selamat datang, <span className="font-medium">{user?.name}</span>. Pantau KPI operasional,
            fulfillment, distribusi, ekspor, dan alert strategis dalam satu halaman.
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
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
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
        tabContent
      )}
    </div>
  );
}
