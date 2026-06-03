import type { ReactNode } from "react";
import { actionBtn } from "@/lib/ui-action";

export const listFilterInputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-card dark:text-gray-100";

export function ListFilterSection({
  description,
  onReset,
  children,
  columnsClass = "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
}: {
  description: string;
  onReset: () => void;
  children: ReactNode;
  columnsClass?: string;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        <button type="button" onClick={onReset} className={actionBtn("neutral", "xs")}>
          Reset Filter
        </button>
      </div>
      <div className={`grid gap-3 ${columnsClass}`}>{children}</div>
    </section>
  );
}

export function ListFilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="block text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
      {children}
    </div>
  );
}
