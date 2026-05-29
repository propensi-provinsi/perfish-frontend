"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "./ChartCard";
import { CHART_AXIS, CHART_COLORS, CHART_GRID, CHART_TOOLTIP_STYLE, colorAt } from "./chartTheme";
import {
  asArray,
  asNumber,
  asString,
  formatKg,
  formatNumber,
  formatPct,
  shortDateLabel,
} from "../dashboard-utils";

type NamedValue = { name: string; value: number; [key: string]: unknown };

function ChartEmpty({ message = "Tidak ada data untuk ditampilkan" }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
      {message}
    </div>
  );
}

function KgTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md dark:border-gray-600 dark:bg-dark-card"
      style={CHART_TOOLTIP_STYLE.contentStyle}
    >
      {label ? <p className="mb-1 font-medium text-gray-700 dark:text-gray-200">{label}</p> : null}
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatKg(asNumber(entry.value))}
        </p>
      ))}
    </div>
  );
}

function PctTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md dark:border-gray-600 dark:bg-dark-card">
      {label ? <p className="mb-1 font-medium text-gray-700 dark:text-gray-200">{label}</p> : null}
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatPct(asNumber(entry.value), 2)}
        </p>
      ))}
    </div>
  );
}

/** Stok — komposisi per species (pie/donut). */
export function StockSpeciesPieChart({ data }: { data: NamedValue[] }) {
  if (!data.length) {
    return (
      <ChartCard title="Komposisi Stok per Species" subtitle="Distribusi berdasarkan kg">
        <ChartEmpty />
      </ChartCard>
    );
  }

  const top = data.slice(0, 8);
  const rest = data.slice(8).reduce((s, d) => s + d.value, 0);
  const chartData = rest > 0 ? [...top, { name: "Lainnya", value: rest }] : top;

  return (
    <ChartCard title="Komposisi Stok per Species" subtitle="Pie chart — proporsi kg per species">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={2}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={colorAt(i)} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatKg(asNumber(v))} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Stok — perbandingan kg per species (bar). */
export function StockSpeciesBarChart({ data }: { data: NamedValue[] }) {
  if (!data.length) {
    return (
      <ChartCard title="Volume Stok per Species" subtitle="Bar chart — kg">
        <ChartEmpty />
      </ChartCard>
    );
  }

  const chartData = data.slice(0, 10);

  return (
    <ChartCard title="Volume Stok per Species" subtitle="Bar chart horizontal — top 10 species">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid {...CHART_GRID} horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => formatNumber(v, 0)} {...CHART_AXIS} />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
          <Tooltip content={<KgTooltip />} />
          <Bar dataKey="value" name="Stok (kg)" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={colorAt(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Harian — inbound vs outbound (area + line). */
export function DailyFlowChart({
  data,
}: {
  data: { date: string; inboundKg: number; outboundKg: number; netKg: number }[];
}) {
  if (!data.length) {
    return (
      <ChartCard title="Trend Inbound vs Outbound" subtitle="Periode terpilih">
        <ChartEmpty />
      </ChartCard>
    );
  }

  const chartData = data.map((row) => ({
    ...row,
    label: shortDateLabel(row.date),
  }));

  return (
    <ChartCard title="Trend Inbound vs Outbound" subtitle="Area chart — aliran harian (kg)">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tickFormatter={(v) => formatNumber(v, 0)} {...CHART_AXIS} width={56} />
          <Tooltip content={<KgTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area
            type="monotone"
            dataKey="inboundKg"
            name="Inbound"
            fill={CHART_COLORS[0]}
            fillOpacity={0.25}
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="outboundKg"
            name="Outbound"
            fill={CHART_COLORS[3]}
            fillOpacity={0.2}
            stroke={CHART_COLORS[3]}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="netKg"
            name="Net"
            stroke={CHART_COLORS[6]}
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Aging — distribusi kategori (donut). */
export function AgingDistributionPieChart({ data }: { data: NamedValue[] }) {
  if (!data.length) {
    return (
      <ChartCard title="Distribusi Umur Simpan" subtitle="Kategori aging">
        <ChartEmpty />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Distribusi Umur Simpan" subtitle="Donut chart — kg per kategori aging">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="48%"
            outerRadius="76%"
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colorAt(i)} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatKg(asNumber(v))} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Aging — jumlah batch per kategori (bar). */
export function AgingCategoryBarChart({
  data,
}: {
  data: { name: string; batchCount: number; value: number }[];
}) {
  if (!data.length) {
    return (
      <ChartCard title="Batch per Kategori Aging">
        <ChartEmpty />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Batch per Kategori Aging" subtitle="Bar chart — jumlah batch">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} {...CHART_AXIS} width={40} />
          <Tooltip />
          <Bar dataKey="batchCount" name="Batch" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={colorAt(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Utilisasi — snapshot per gudang (horizontal bar %). */
export function UtilizationBarChart({
  data,
}: {
  data: { name: string; utilization: number; usedTon: number; capacityTon: number }[];
}) {
  if (!data.length) {
    return (
      <ChartCard title="Utilisasi per Cold Storage">
        <ChartEmpty />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Utilisasi per Cold Storage" subtitle="Bar chart — % kapasitas terpakai">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 24, top: 8, bottom: 8 }}>
          <CartesianGrid {...CHART_GRID} horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} {...CHART_AXIS} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
          <Tooltip content={<PctTooltip />} />
          <Bar dataKey="utilization" name="Utilisasi" radius={[0, 4, 4, 0]}>
            {data.map((row, i) => (
              <Cell
                key={i}
                fill={row.utilization >= 90 ? CHART_COLORS[6] : row.utilization >= 70 ? CHART_COLORS[5] : colorAt(i)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Utilisasi — trend rata-rata (line). */
export function UtilizationTrendChart({
  series,
}: {
  series: { date: string; label: string; avgUtilization: number }[];
}) {
  if (!series.length) {
    return (
      <ChartCard title="Trend Utilisasi Rata-rata" subtitle="Estimasi dari snapshot">
        <ChartEmpty />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Trend Utilisasi Rata-rata" subtitle="Line chart — rata-rata semua gudang (%)">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} {...CHART_AXIS} width={44} />
          <Tooltip content={<PctTooltip />} />
          <Line
            type="monotone"
            dataKey="avgUtilization"
            name="Utilisasi rata-rata"
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Meeting — throughput overview (grouped bar). */
export function MeetingThroughputChart({
  stockKg,
  inboundKg,
  outboundKg,
  fulfillmentPct,
}: {
  stockKg: number;
  inboundKg: number;
  outboundKg: number;
  fulfillmentPct: number;
}) {
  const chartData = [
    { name: "Stok", value: stockKg },
    { name: "Inbound", value: inboundKg },
    { name: "Outbound", value: outboundKg },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_200px]">
      <ChartCard title="Ringkasan Operasional" subtitle="Bar chart — volume periode meeting (kg)" height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => formatNumber(v, 0)} {...CHART_AXIS} width={56} />
            <Tooltip content={<KgTooltip />} />
            <Bar dataKey="value" name="Volume (kg)" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={colorAt(i)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="SO Fulfillment" subtitle="Gauge ring — tingkat pemenuhan" height={280}>
        <div className="flex h-full flex-col items-center justify-center">
          <div
            className="relative flex h-36 w-36 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#06b6d4 ${Math.min(fulfillmentPct, 100) * 3.6}deg, #e2e8f0 0deg)`,
            }}
          >
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white dark:bg-dark-card">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatPct(fulfillmentPct, 1)}
              </span>
              <span className="text-xs text-gray-500">fulfillment</span>
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

/** Meeting — top fish outbound (bar). */
export function MeetingTopFishChart({ data }: { data: NamedValue[] }) {
  if (!data.length) {
    return (
      <ChartCard title="Top Fish Outbound">
        <ChartEmpty />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Top Fish Outbound" subtitle="Bar chart horizontal — volume kg">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid {...CHART_GRID} horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => formatNumber(v, 0)} {...CHART_AXIS} />
          <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 11 }} />
          <Tooltip content={<KgTooltip />} />
          <Bar dataKey="value" name="Outbound (kg)" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Laporan — status sertifikasi (pie). */
export function CertificationStatusPieChart({
  active,
  warning,
  expired,
}: {
  active: number;
  warning: number;
  expired: number;
}) {
  const data = [
    { name: "Aktif", value: active },
    { name: "Akan kedaluwarsa", value: warning },
    { name: "Kedaluwarsa", value: expired },
  ].filter((d) => d.value > 0);

  if (!data.length) {
    return (
      <ChartCard title="Status Sertifikasi Ekspor">
        <ChartEmpty />
      </ChartCard>
    );
  }

  const statusColors = [CHART_COLORS[4], CHART_COLORS[5], CHART_COLORS[6]];

  return (
    <ChartCard title="Status Sertifikasi Ekspor" subtitle="Pie chart — kesehatan sertifikat">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="76%" label>
            {data.map((_, i) => (
              <Cell key={i} fill={statusColors[i]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Laporan — KPI fulfillment & distribusi (bar). */
export function ReportsKpiBarChart({
  fulfillmentPct,
  distributionKg,
  exportKg,
  shrinkPct,
}: {
  fulfillmentPct: number;
  distributionKg: number;
  exportKg: number;
  shrinkPct: number;
}) {
  const chartData = [
    { name: "SO Fulfillment (%)", value: fulfillmentPct, isPct: true },
    { name: "Avg Shrink (%)", value: shrinkPct, isPct: true },
    { name: "Distribusi (kg)", value: distributionKg / 1000, isPct: false },
    { name: "Ekspor (kg)", value: exportKg / 1000, isPct: false },
  ];

  return (
    <ChartCard title="Ringkasan KPI Laporan" subtitle="Bar chart — metrik utama periode">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={56} />
          <YAxis {...CHART_AXIS} width={48} />
          <Tooltip
            formatter={(v, _n, item) => {
              const row = item?.payload as { isPct?: boolean };
              const num = asNumber(v);
              return row?.isPct ? formatPct(num, 2) : formatKg(num * 1000);
            }}
          />
          <Bar dataKey="value" name="Nilai" radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={colorAt(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Laporan — trend shrinkage (line). */
export function ShrinkageTrendLineChart({
  data,
}: {
  data: { name: string; shrinkPct: number; anomalyBatch: number }[];
}) {
  if (!data.length) {
    return (
      <ChartCard title="Trend Shrinkage">
        <ChartEmpty />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Trend Shrinkage" subtitle="Line chart — rata-rata shrink % per bulan">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `${v}%`} {...CHART_AXIS} width={44} />
          <Tooltip formatter={(v) => formatPct(asNumber(v), 3)} />
          <Line
            type="monotone"
            dataKey="shrinkPct"
            name="Avg shrink %"
            stroke={CHART_COLORS[6]}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Laporan — top discrepancy (horizontal bar). */
export function DiscrepancyBarChart({ data }: { data: NamedValue[] }) {
  if (!data.length) {
    return (
      <ChartCard title="Top Weight Discrepancy">
        <ChartEmpty />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Top Weight Discrepancy" subtitle="Bar chart — shrink % tertinggi">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid {...CHART_GRID} horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => `${v}%`} {...CHART_AXIS} />
          <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v) => formatPct(asNumber(v), 3)} />
          <Bar dataKey="value" name="Shrink %" fill={CHART_COLORS[6]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Executive — PO vs SO (composed bar + line). */
export function ExecutivePoSoChart({
  data,
}: {
  data: {
    name: string;
    poKg: number;
    soKg: number;
    poTargetKg?: number | null;
    soTargetKg?: number | null;
  }[];
}) {
  if (!data.length) {
    return (
      <ChartCard title="PO vs SO (Trend)">
        <ChartEmpty />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="PO vs SO (Trend)" subtitle="Grouped bar — realisasi vs target (kg)">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => formatNumber(v, 0)} {...CHART_AXIS} width={56} />
          <Tooltip content={<KgTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="poKg" name="PO" fill={CHART_COLORS[0]} radius={[2, 2, 0, 0]} />
          <Bar dataKey="soKg" name="SO" fill={CHART_COLORS[3]} radius={[2, 2, 0, 0]} />
          <Line type="monotone" dataKey="poTargetKg" name="Target PO" stroke={CHART_COLORS[1]} strokeDasharray="4 4" dot={false} />
          <Line type="monotone" dataKey="soTargetKg" name="Target SO" stroke={CHART_COLORS[4]} strokeDasharray="4 4" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Executive — top partners (horizontal bar). */
export function ExecutivePartnersBarChart({
  suppliers,
  customers,
}: {
  suppliers: NamedValue[];
  customers: NamedValue[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Top Supplier (PO)" subtitle="Bar chart horizontal" height={280}>
        {suppliers.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={suppliers} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid {...CHART_GRID} horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => formatNumber(v, 0)} {...CHART_AXIS} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
              <Tooltip content={<KgTooltip />} />
              <Bar dataKey="value" name="PO (kg)" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty />
        )}
      </ChartCard>

      <ChartCard title="Top Customer (SO)" subtitle="Bar chart horizontal" height={280}>
        {customers.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={customers} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid {...CHART_GRID} horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => formatNumber(v, 0)} {...CHART_AXIS} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
              <Tooltip content={<KgTooltip />} />
              <Bar dataKey="value" name="SO (kg)" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty />
        )}
      </ChartCard>
    </div>
  );
}

/** Executive — KPI perubahan (bar diverging style as simple comparison). */
export function ExecutiveTrendChangeChart({
  throughputChange,
  fulfillmentChange,
}: {
  throughputChange: number;
  fulfillmentChange: number;
}) {
  const chartData = [
    { name: "Throughput Out", value: throughputChange },
    { name: "Fulfillment", value: fulfillmentChange },
  ];

  return (
    <ChartCard title="Perubahan vs Periode Sebelumnya" subtitle="Bar chart — delta %">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `${v}%`} {...CHART_AXIS} width={48} />
          <Tooltip formatter={(v) => formatPct(asNumber(v), 2)} />
          <Bar dataKey="value" name="Perubahan %" radius={[4, 4, 0, 0]}>
            {chartData.map((row, i) => (
              <Cell key={i} fill={row.value >= 0 ? CHART_COLORS[4] : CHART_COLORS[6]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function buildUtilizationTrendSeries(
  trendItems: Record<string, unknown>[],
  utilizationRows: { coldStorageId: unknown; capacityTon: number }[],
): { date: string; label: string; avgUtilization: number }[] {
  if (!trendItems.length) return [];

  const capTonByCs = new Map<string, number>();
  utilizationRows.forEach((row) => {
    const id = String(row.coldStorageId ?? "");
    if (id) capTonByCs.set(id, asNumber(row.capacityTon));
  });

  const first = trendItems[0];
  const points = asArray(first.points);
  if (!points.length) return [];

  return points.map((point) => {
    const date = asString(point.date);
    let sum = 0;
    let count = 0;
    trendItems.forEach((item) => {
      const csId = String(item.coldStorageId ?? "");
      const pt = asArray(item.points).find((p) => asString(p.date) === date);
      if (!pt) return;
      const capTon = capTonByCs.get(csId) ?? 0;
      if (capTon <= 0) return;
      const usedTon = asNumber(pt.usedKg) / 1000;
      sum += Math.min((usedTon / capTon) * 100, 100);
      count += 1;
    });
    return {
      date,
      label: shortDateLabel(date),
      avgUtilization: count ? sum / count : 0,
    };
  });
}
