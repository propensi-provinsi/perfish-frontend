/** Format tonase: "1 ton" bukan "1 t". */
export function formatTonLabel(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : v;
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("id-ID", { maximumFractionDigits: 4 })} ton`;
}

/** dd/M/yyyy, h:mm AM/PM — locale id-ID. */
export function formatIdDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Resolve display name: prefer name, fallback email/username. */
export function resolveActorDisplay(actor: string | null | undefined, actorName?: string | null): string {
  const name = actorName?.trim();
  if (name) return name;
  const raw = actor?.trim();
  if (!raw) return "—";
  if (raw.includes("@")) return raw.split("@")[0] ?? raw;
  return raw;
}
