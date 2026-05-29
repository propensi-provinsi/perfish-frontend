"use client";

import { useState, type ReactNode } from "react";
import type { AnalyticsPayload } from "@/lib/dashboard-api";
import {
  AgingCategoryBarChart,
  AgingDistributionPieChart,
  buildUtilizationTrendSeries,
  CertificationStatusPieChart,
  DailyFlowChart,
  DiscrepancyBarChart,
  ExecutivePartnersBarChart,
  ExecutivePoSoChart,
  ExecutiveTrendChangeChart,
  MeetingThroughputChart,
  MeetingTopFishChart,
  ReportsKpiBarChart,
  ShrinkageTrendLineChart,
  StockSpeciesBarChart,
  StockSpeciesPieChart,
  UtilizationBarChart,
  UtilizationTrendChart,
} from "./charts/DashboardCharts";
import {
  asNumber,
  asRecord,
  asString,
  avg,
  formatInt,
  formatKg,
  formatNumber,
  formatTon,
  max,
} from "./dashboard-utils";

function VisualisasiSection({ children }: { children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Visualisasi
      </h3>
      {children}
    </section>
  );
}

export function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

export function DataTableCard({
  title,
  columns,
  children,
}: {
  title: string;
  columns: string[];
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
      <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700">
              {columns.map((column) => (
                <th key={column} className="px-3 py-2">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </section>
  );
}

type StockTabProps = {
  stockSummary: AnalyticsPayload | null;
  stockBreakdownRows: AnalyticsPayload[];
  stockBatchRows: AnalyticsPayload[];
  selectedStockLabel: string;
  onSelectStockLabel: (label: string) => void;
  lastRefreshedAt: string;
};

export function StockTabPanel({
  stockSummary,
  stockBreakdownRows,
  stockBatchRows,
  selectedStockLabel,
  onSelectStockLabel,
  lastRefreshedAt,
}: StockTabProps) {
  const [stockView, setStockView] = useState<"table" | "chart">("chart");

  const speciesData = stockBreakdownRows.map((row) => ({
    name: asString(row.label),
    value: asNumber(row.quantityKg),
  }));

  const filteredBatchRows = selectedStockLabel
    ? stockBatchRows.filter((row) => asString(row.speciesName) === selectedStockLabel)
    : stockBatchRows;

  const totalStockKg = asNumber(stockSummary?.totalStockKg);

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Stok" value={formatKg(totalStockKg)} />
        <MetricCard title="Total Ton" value={formatTon(asNumber(stockSummary?.totalStockTon))} />
        <MetricCard title="Batch Aktif" value={formatInt(asNumber(stockSummary?.activeBatchCount))} />
        <MetricCard title="Total Grup" value={formatInt(stockBreakdownRows.length)} />
      </section>

      <VisualisasiSection>
        <div className="grid gap-4 xl:grid-cols-2">
          <StockSpeciesPieChart data={speciesData} />
          <StockSpeciesBarChart data={speciesData} />
        </div>
      </VisualisasiSection>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Breakdown Stok per Species
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last updated:{" "}
              {lastRefreshedAt ? new Date(lastRefreshedAt).toLocaleString("id-ID") : "-"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStockView("chart")}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                stockView === "chart"
                  ? "bg-cyan text-white"
                  : "bg-gray-100 text-gray-700 dark:bg-dark-section dark:text-gray-200"
              }`}
            >
              Chart View
            </button>
            <button
              type="button"
              onClick={() => setStockView("table")}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                stockView === "table"
                  ? "bg-cyan text-white"
                  : "bg-gray-100 text-gray-700 dark:bg-dark-section dark:text-gray-200"
              }`}
            >
              Table View
            </button>
          </div>
        </div>

        {stockView === "chart" ? (
          <div className="space-y-3">
            {stockBreakdownRows.slice(0, 10).map((row) => {
              const label = asString(row.label);
              const quantityKg = asNumber(row.quantityKg);
              const ratio =
                totalStockKg > 0 ? Math.max((quantityKg / totalStockKg) * 100, 6) : 0;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onSelectStockLabel(selectedStockLabel === label ? "" : label)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    selectedStockLabel === label
                      ? "border-cyan bg-cyan/5"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{label}</span>
                    <span className="text-gray-500 dark:text-gray-400">{formatKg(quantityKg)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-section">
                    <div
                      className="h-full rounded-full bg-cyan transition-all"
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700">
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2">Quantity (Kg)</th>
                  <th className="px-3 py-2">Quantity (Ton)</th>
                </tr>
              </thead>
              <tbody>
                {stockBreakdownRows.slice(0, 10).map((row) => {
                  const label = asString(row.label);
                  return (
                    <tr
                      key={label}
                      onClick={() => onSelectStockLabel(selectedStockLabel === label ? "" : label)}
                      className={`cursor-pointer border-b border-gray-100 dark:border-gray-800 ${
                        selectedStockLabel === label ? "bg-cyan/5" : ""
                      }`}
                    >
                      <td className="px-3 py-2">{label}</td>
                      <td className="px-3 py-2">{formatKg(asNumber(row.quantityKg))}</td>
                      <td className="px-3 py-2">{formatTon(asNumber(row.quantityTon))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DataTableCard
        title={selectedStockLabel ? `Batch Detail: ${selectedStockLabel}` : "Batch Detail (Top 10 Aging)"}
        columns={["Batch", "Species", "Qty (Kg)", "Aging", "Lokasi", "Status"]}
      >
        {filteredBatchRows.slice(0, 10).map((row) => (
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
  );
}

export function DailyTabPanel({
  dailySummary,
  dailyTrendRows,
}: {
  dailySummary: AnalyticsPayload | null;
  dailyTrendRows: AnalyticsPayload[];
}) {
  const trendData = dailyTrendRows.map((row) => ({
    date: asString(row.date),
    inboundKg: asNumber(row.inboundKg),
    outboundKg: asNumber(row.outboundKg),
    netKg: asNumber(row.netKg),
  }));

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Inbound Harian" value={formatKg(asNumber(asRecord(dailySummary?.inbound).totalKg))} />
        <MetricCard title="Outbound Harian" value={formatKg(asNumber(asRecord(dailySummary?.outbound).totalKg))} />
        <MetricCard title="Net Flow" value={formatKg(asNumber(dailySummary?.netChangeKg))} />
        <MetricCard title="Total Hari" value={formatInt(dailyTrendRows.length)} />
      </section>

      <VisualisasiSection>
        <DailyFlowChart data={trendData} />
      </VisualisasiSection>

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
  );
}

export function AgingTabPanel({
  agingRows,
  agingCritical,
  agingCriticalRows,
}: {
  agingRows: AnalyticsPayload[];
  agingCritical: AnalyticsPayload | null;
  agingCriticalRows: AnalyticsPayload[];
}) {
  const pieData = agingRows.map((row) => ({
    name: asString(row.label),
    value: asNumber(row.quantityKg),
  }));

  const barData = agingRows.map((row) => ({
    name: asString(row.label),
    batchCount: asNumber(row.batchCount),
    value: asNumber(row.quantityKg),
  }));

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Threshold Critical" value={`${formatInt(asNumber(agingCritical?.thresholdDays))} hari`} />
        <MetricCard title="Batch Critical" value={formatInt(asNumber(agingCritical?.count))} />
        <MetricCard title="Qty Critical" value={formatKg(asNumber(agingCritical?.totalQuantityKg))} />
        <MetricCard title="Kategori Aging" value={formatInt(agingRows.length)} />
      </section>

      <VisualisasiSection>
        <div className="grid gap-4 xl:grid-cols-2">
          <AgingDistributionPieChart data={pieData} />
          <AgingCategoryBarChart data={barData} />
        </div>
      </VisualisasiSection>

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

      <DataTableCard title="Batch Aging Kritis" columns={["Batch", "Species", "Age", "Qty", "Cold Storage"]}>
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
  );
}

export function UtilizationTabPanel({
  utilizationRows,
  utilizationTrendItems,
}: {
  utilizationRows: AnalyticsPayload[];
  utilizationTrendItems: AnalyticsPayload[];
}) {
  const barData = utilizationRows.map((row) => ({
    name: `${asString(row.csCode)}`,
    utilization: asNumber(row.utilizationPercent),
    usedTon: asNumber(row.usedTon),
    capacityTon: asNumber(row.capacityTon),
  }));

  const trendSeries = buildUtilizationTrendSeries(
    utilizationTrendItems,
    utilizationRows.map((row) => ({
      coldStorageId: row.coldStorageId,
      capacityTon: asNumber(row.capacityTon),
    })),
  );

  return (
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
        <MetricCard title="Trend Item" value={formatInt(utilizationTrendItems.length)} />
      </section>

      <VisualisasiSection>
        <div className="grid gap-4 xl:grid-cols-2">
          <UtilizationBarChart data={barData} />
          <UtilizationTrendChart series={trendSeries} />
        </div>
      </VisualisasiSection>

      <DataTableCard
        title="Utilisasi per Cold Storage"
        columns={["Gudang", "Terpakai (Ton)", "Kapasitas (Ton)", "Utilisasi"]}
      >
        {utilizationRows.map((row) => (
          <tr key={asString(row.coldStorageId)} className="border-b border-gray-100 dark:border-gray-800">
            <td className="px-3 py-2">
              {asString(row.csCode)} - {asString(row.csName)}
            </td>
            <td className="px-3 py-2">{formatTon(asNumber(row.usedTon))}</td>
            <td className="px-3 py-2">{formatTon(asNumber(row.capacityTon))}</td>
            <td className="px-3 py-2">{formatNumber(asNumber(row.utilizationPercent), 2)}%</td>
          </tr>
        ))}
      </DataTableCard>
    </div>
  );
}

export function MeetingTabPanel({
  meetingSummary,
  meetingDivision,
  meetingTopFish,
  meetingHighlights,
  selectedDivision,
  onDivisionChange,
  divisionLoading,
}: {
  meetingSummary: AnalyticsPayload | null;
  meetingDivision: AnalyticsPayload | null;
  meetingTopFish: AnalyticsPayload[];
  meetingHighlights: AnalyticsPayload[];
  selectedDivision: string;
  onDivisionChange: (division: string) => void;
  divisionLoading: boolean;
}) {
  const overview = asRecord(meetingSummary?.overview);
  const topFishData = meetingTopFish.map((row) => ({
    name: asString(row.label),
    value: asNumber(row.value),
  }));

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Stock" value={formatKg(asNumber(overview.totalStockKg))} />
        <MetricCard title="Throughput In" value={formatKg(asNumber(overview.throughputInboundKg))} />
        <MetricCard title="Throughput Out" value={formatKg(asNumber(overview.throughputOutboundKg))} />
        <MetricCard
          title="Fulfillment"
          value={`${formatNumber(asNumber(overview.fulfillmentRate), 2)}%`}
        />
      </section>

      <VisualisasiSection>
        <MeetingThroughputChart
          stockKg={asNumber(overview.totalStockKg)}
          inboundKg={asNumber(overview.throughputInboundKg)}
          outboundKg={asNumber(overview.throughputOutboundKg)}
          fulfillmentPct={asNumber(overview.fulfillmentRate)}
        />
        <MeetingTopFishChart data={topFishData} />
      </VisualisasiSection>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Meeting Summary per Divisi
          </h3>
          <select
            value={selectedDivision}
            onChange={(e) => onDivisionChange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
          >
            {["SBB", "PPL", "MARKETING", "PEMBELIAN"].map((division) => (
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
                {asString(meetingDivision?.focus)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-dark-section">
              <p className="text-xs uppercase tracking-wide text-gray-500">Periode</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                {asString(meetingDivision?.from)} - {asString(meetingDivision?.to)}
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
  );
}

export function ReportsTabPanel({
  soSummary,
  distributionSummary,
  exportSummary,
  certificationSummary,
  discrepancySummary,
  discrepancyRows,
  discrepancyTrendRows,
  receivingGroupRows,
  stockOpnameTrendRows,
}: {
  soSummary: AnalyticsPayload;
  distributionSummary: AnalyticsPayload;
  exportSummary: AnalyticsPayload;
  certificationSummary: AnalyticsPayload;
  discrepancySummary: AnalyticsPayload;
  discrepancyRows: AnalyticsPayload[];
  discrepancyTrendRows: AnalyticsPayload[];
  receivingGroupRows: AnalyticsPayload[];
  stockOpnameTrendRows: AnalyticsPayload[];
}) {
  const shrinkTrend = discrepancyTrendRows.map((row) => ({
    name: asString(row.month),
    shrinkPct: asNumber(row.averageShrinkPercent),
    anomalyBatch: asNumber(row.anomalyBatch),
  }));

  const discrepancyBar = discrepancyRows.slice(0, 8).map((row) => ({
    name: asString(row.batchNumber),
    value: asNumber(row.shrinkPercent),
  }));

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="SO Fulfillment" value={`${formatNumber(asNumber(soSummary.fulfillmentRate), 2)}%`} />
        <MetricCard title="Total Distribusi" value={formatKg(asNumber(distributionSummary.totalAllocatedKg))} />
        <MetricCard title="Ekspor Volume" value={formatKg(asNumber(exportSummary.totalVolumeKg))} />
        <MetricCard title="Cert Expired" value={formatInt(asNumber(certificationSummary.expired))} />
        <MetricCard title="Batch Anomali" value={formatInt(asNumber(discrepancySummary.anomalyBatch))} />
      </section>

      <VisualisasiSection>
        <div className="grid gap-4 xl:grid-cols-2">
          <CertificationStatusPieChart
            active={asNumber(certificationSummary.active)}
            warning={asNumber(certificationSummary.warning)}
            expired={asNumber(certificationSummary.expired)}
          />
          <ReportsKpiBarChart
            fulfillmentPct={asNumber(soSummary.fulfillmentRate)}
            distributionKg={asNumber(distributionSummary.totalAllocatedKg)}
            exportKg={asNumber(exportSummary.totalVolumeKg)}
            shrinkPct={asNumber(
              discrepancySummary.averageShrinkPercent ?? discrepancySummary.avgShrinkPercent,
            )}
          />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <ShrinkageTrendLineChart data={shrinkTrend} />
          <DiscrepancyBarChart data={discrepancyBar} />
        </div>
      </VisualisasiSection>

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

      <DataTableCard title="Trend Shrinkage" columns={["Bulan", "Avg Shrink %", "Anomaly Batch"]}>
        {discrepancyTrendRows.map((row) => (
          <tr key={asString(row.month)} className="border-b border-gray-100 dark:border-gray-800">
            <td className="px-3 py-2">{asString(row.month)}</td>
            <td className="px-3 py-2">{formatNumber(asNumber(row.averageShrinkPercent), 3)}%</td>
            <td className="px-3 py-2">{formatInt(asNumber(row.anomalyBatch))}</td>
          </tr>
        ))}
      </DataTableCard>

      <DataTableCard
        title="Receiving-Group Rollup"
        columns={["Receipt", "Tanggal", "Supplier", "Received (Kg)", "Current (Kg)", "Batch"]}
      >
        {receivingGroupRows.slice(0, 12).map((row) => (
          <tr key={asString(row.receiptId)} className="border-b border-gray-100 dark:border-gray-800">
            <td className="px-3 py-2 font-medium">{asString(row.receiptCode)}</td>
            <td className="px-3 py-2">{asString(row.tanggalPenerimaan)}</td>
            <td className="px-3 py-2">{asString(row.supplierName)}</td>
            <td className="px-3 py-2">{formatKg(asNumber(row.receivedQuantityKg))}</td>
            <td className="px-3 py-2">{formatKg(asNumber(row.currentQuantityKg))}</td>
            <td className="px-3 py-2">{formatInt(asNumber(row.batchCount))}</td>
          </tr>
        ))}
      </DataTableCard>

      <DataTableCard
        title="Shrinkage (Stock Opname)"
        columns={["Periode", "System (Kg)", "Counted (Kg)", "Variance (Kg)", "Shrink %", "Session"]}
      >
        {stockOpnameTrendRows.map((row) => (
          <tr key={asString(row.periodYyyymm)} className="border-b border-gray-100 dark:border-gray-800">
            <td className="px-3 py-2">{asString(row.period)}</td>
            <td className="px-3 py-2">{formatKg(asNumber(row.systemKg))}</td>
            <td className="px-3 py-2">{formatKg(asNumber(row.countedKg))}</td>
            <td className="px-3 py-2">{formatKg(asNumber(row.varianceKg))}</td>
            <td className="px-3 py-2">{formatNumber(asNumber(row.shrinkagePercent), 3)}%</td>
            <td className="px-3 py-2">{formatInt(asNumber(row.sessionCount))}</td>
          </tr>
        ))}
      </DataTableCard>
    </div>
  );
}

export function ExecutiveTabPanel({
  executiveKpi,
  executiveTrend,
  executiveAlerts,
  poVsSoTrendRows,
  topSuppliers,
  topCustomers,
  soPendingDeliveryRows,
}: {
  executiveKpi: AnalyticsPayload;
  executiveTrend: AnalyticsPayload;
  executiveAlerts: AnalyticsPayload[];
  poVsSoTrendRows: AnalyticsPayload[];
  topSuppliers: AnalyticsPayload[];
  topCustomers: AnalyticsPayload[];
  soPendingDeliveryRows: AnalyticsPayload[];
}) {
  const poSoData = poVsSoTrendRows.map((row) => ({
    name: asString(row.month),
    poKg: asNumber(row.poKg),
    soKg: asNumber(row.soKg),
    poTargetKg: row.poTargetKg == null ? undefined : asNumber(row.poTargetKg),
    soTargetKg: row.soTargetKg == null ? undefined : asNumber(row.soTargetKg),
  }));

  const suppliers = topSuppliers.map((row) => ({
    name: asString(row.supplierName),
    value: asNumber(row.poKg),
  }));

  const customers = topCustomers.map((row) => ({
    name: asString(row.customerName),
    value: asNumber(row.soKg),
  }));

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Stock Ton" value={formatTon(asNumber(executiveKpi.totalStockTon))} />
        <MetricCard title="Fulfillment" value={`${formatNumber(asNumber(executiveKpi.fulfillmentRate), 2)}%`} />
        <MetricCard title="On Time Delivery" value={`${formatNumber(asNumber(executiveKpi.onTimeDeliveryRate), 2)}%`} />
        <MetricCard title="Export Volume" value={formatKg(asNumber(executiveKpi.exportVolumeKg))} />
        <MetricCard title="Avg Shrink" value={`${formatNumber(asNumber(executiveKpi.avgShrinkPercent), 3)}%`} />
      </section>

      <VisualisasiSection>
        <ExecutivePoSoChart data={poSoData} />
        <div className="grid gap-4 lg:grid-cols-2">
          <ExecutiveTrendChangeChart
            throughputChange={asNumber(executiveTrend.throughputOutboundChangePercent)}
            fulfillmentChange={asNumber(executiveTrend.fulfillmentRateChangePercent)}
          />
          <ExecutivePartnersBarChart suppliers={suppliers} customers={customers} />
        </div>
      </VisualisasiSection>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">
            Perubahan vs Periode Sebelumnya
          </h3>
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
              <li
                key={`${asString(row.type)}-${idx}`}
                className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-dark-section"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {asString(row.level)} - {asString(row.type)}
                </p>
                <p className="text-gray-600 dark:text-gray-300">{asString(row.message)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <DataTableCard
        title="PO vs SO (Trend)"
        columns={["Bulan", "PO (Kg)", "Target PO", "SO (Kg)", "Target SO"]}
      >
        {poVsSoTrendRows.map((row) => (
          <tr key={asString(row.month)} className="border-b border-gray-100 dark:border-gray-800">
            <td className="px-3 py-2">{asString(row.month)}</td>
            <td className="px-3 py-2">{formatKg(asNumber(row.poKg))}</td>
            <td className="px-3 py-2">{row.poTargetKg == null ? "-" : formatKg(asNumber(row.poTargetKg))}</td>
            <td className="px-3 py-2">{formatKg(asNumber(row.soKg))}</td>
            <td className="px-3 py-2">{row.soTargetKg == null ? "-" : formatKg(asNumber(row.soTargetKg))}</td>
          </tr>
        ))}
      </DataTableCard>

      <section className="grid gap-4 lg:grid-cols-2">
        <DataTableCard title="Top Supplier (PO)" columns={["Supplier", "Volume (Kg)"]}>
          {topSuppliers.map((row) => (
            <tr key={asString(row.supplierId)} className="border-b border-gray-100 dark:border-gray-800">
              <td className="px-3 py-2">{asString(row.supplierName)}</td>
              <td className="px-3 py-2">{formatKg(asNumber(row.poKg))}</td>
            </tr>
          ))}
        </DataTableCard>

        <DataTableCard title="Top Customer (SO)" columns={["Customer", "Volume (Kg)"]}>
          {topCustomers.map((row) => (
            <tr key={asString(row.customerId)} className="border-b border-gray-100 dark:border-gray-800">
              <td className="px-3 py-2">{asString(row.customerName)}</td>
              <td className="px-3 py-2">{formatKg(asNumber(row.soKg))}</td>
            </tr>
          ))}
        </DataTableCard>
      </section>

      <DataTableCard
        title="Active SO Pending Delivery"
        columns={["SO", "Customer", "Required (Kg)", "Allocated (Kg)", "Remaining (Kg)", "Latest Shipment"]}
      >
        {soPendingDeliveryRows.slice(0, 12).map((row) => (
          <tr key={asString(row.soId)} className="border-b border-gray-100 dark:border-gray-800">
            <td className="px-3 py-2 font-medium">{asString(row.soNumber)}</td>
            <td className="px-3 py-2">{asString(row.customer)}</td>
            <td className="px-3 py-2">{formatKg(asNumber(row.requiredKg))}</td>
            <td className="px-3 py-2">{formatKg(asNumber(row.allocatedKg))}</td>
            <td className="px-3 py-2">{formatKg(asNumber(row.remainingKg))}</td>
            <td className="px-3 py-2">
              {asString(row.latestShipmentStatus)}
              {row.latestShipmentNumber == null || row.latestShipmentNumber === ""
                ? ""
                : ` (${asString(row.latestShipmentNumber)})`}
            </td>
          </tr>
        ))}
      </DataTableCard>
    </div>
  );
}
