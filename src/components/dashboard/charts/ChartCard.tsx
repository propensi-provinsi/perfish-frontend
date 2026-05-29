"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  height?: number;
  action?: ReactNode;
};

export default function ChartCard({
  title,
  subtitle,
  children,
  className = "",
  height = 320,
  action,
}: Props) {
  return (
    <section
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div style={{ width: "100%", height }}>{children}</div>
    </section>
  );
}
