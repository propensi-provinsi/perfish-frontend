/** Palet konsisten dengan tema PERFISH (cyan / navy). */
export const CHART_COLORS = [
  "#06b6d4",
  "#0ea5e9",
  "#6366f1",
  "#14b8a6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#64748b",
  "#22c55e",
  "#ec4899",
] as const;

export const CHART_AXIS = {
  stroke: "#94a3b8",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export const CHART_GRID = {
  stroke: "#e2e8f0",
  strokeDasharray: "3 3",
  vertical: false,
} as const;

export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "12px",
  },
} as const;

export function colorAt(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
