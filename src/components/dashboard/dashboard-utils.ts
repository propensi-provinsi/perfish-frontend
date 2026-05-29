import type { AnalyticsPayload } from "@/lib/dashboard-api";

export function asRecord(value: unknown): AnalyticsPayload {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as AnalyticsPayload;
  }
  return {};
}

export function asArray(value: unknown): AnalyticsPayload[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is AnalyticsPayload =>
      typeof item === "object" && item !== null && !Array.isArray(item),
  );
}

export function asString(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
}

export function asNumber(value: unknown): number {
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

export function formatNumber(value: number, maxFractionDigits = 2): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: maxFractionDigits }).format(
    value,
  );
}

export function formatInt(value: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

export function formatKg(value: number): string {
  return `${formatNumber(value, 2)} kg`;
}

export function formatTon(value: number): string {
  return `${formatNumber(value, 2)} ton`;
}

export function formatPct(value: number, digits = 1): string {
  return `${formatNumber(value, digits)}%`;
}

export function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

export function max(values: number[]): number {
  if (!values.length) return 0;
  return Math.max(...values);
}

export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export function dateToInput(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function shortDateLabel(value: unknown): string {
  const raw = asString(value);
  if (raw === "-") return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}
