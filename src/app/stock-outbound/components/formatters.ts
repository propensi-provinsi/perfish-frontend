export function formatKg(value: number | null | undefined) {
  if (value == null) return "-";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeStatus(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

export function isOpenSalesOrderStatus(value: string | null | undefined) {
  const normalized = normalizeStatus(value);
  return normalized === "OPEN" || normalized === "ACTIVE";
}
