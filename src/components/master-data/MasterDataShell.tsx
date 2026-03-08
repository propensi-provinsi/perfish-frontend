"use client";

import { useState, useMemo } from "react";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlinePlus,
  HiOutlineTableCells,
  HiOutlineChartBar,
  HiOutlineChartPie,
  HiOutlineXMark,
} from "react-icons/hi2";

/* ── Types ──────────────────────────────────────────────────────── */

export interface ColumnDef {
  key: string;
  label: string;
}

export interface FilterFieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  options?: { value: string; label: string }[];
}

export interface EntityConfig {
  key: string;
  label: string;
  codeField: string;
  nameField: string;
  columns: ColumnDef[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[];
  filterFields: FilterFieldDef[];
}

interface Props {
  title: string;
  subtitle: string;
  entities: EntityConfig[];
}

type ViewMode = "table" | "bar" | "pie";

/* ── Component ──────────────────────────────────────────────────── */

export default function MasterDataShell({ title, subtitle, entities }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState<"name" | "code">("name");
  const [showFilter, setShowFilter] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const entity = entities[activeIdx];

  /* reset on entity switch */
  function handleEntityChange(idx: number) {
    setActiveIdx(idx);
    setSearchQuery("");
    setFilterValues({});
    setShowFilter(false);
  }

  /* filtered data */
  const filteredData = useMemo(() => {
    let rows = entity.data;

    // search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const field = searchBy === "name" ? entity.nameField : entity.codeField;
      rows = rows.filter((r) =>
        String(r[field] ?? "")
          .toLowerCase()
          .includes(q)
      );
    }

    // filters
    for (const [key, val] of Object.entries(filterValues)) {
      if (!val) continue;
      const def = entity.filterFields.find((f) => f.key === key);
      if (!def) continue;

      if (def.type === "boolean") {
        if (val === "true") rows = rows.filter((r) => r[key] === true);
        else if (val === "false") rows = rows.filter((r) => r[key] === false);
      } else if (def.type === "select") {
        rows = rows.filter((r) => String(r[key]) === val);
      } else if (def.type === "number") {
        rows = rows.filter((r) => String(r[key]).includes(val));
      } else {
        rows = rows.filter((r) =>
          String(r[key] ?? "")
            .toLowerCase()
            .includes(val.toLowerCase())
        );
      }
    }

    return rows;
  }, [entity, searchQuery, searchBy, filterValues]);

  function setFilter(key: string, val: string) {
    setFilterValues((prev) => ({ ...prev, [key]: val }));
  }

  const activeFilterCount = Object.values(filterValues).filter(Boolean).length;

  /* ── render helpers ───────────────────────────────────────────── */

  function renderCellValue(col: ColumnDef, row: Record<string, any>) {
    const val = row[col.key];

    // boolean → badge
    if (typeof val === "boolean") {
      return val ? (
        <span className="inline-flex rounded-full bg-green/10 px-2.5 py-0.5 text-xs font-medium text-green">
          Aktif
        </span>
      ) : (
        <span className="inline-flex rounded-full bg-red/10 px-2.5 py-0.5 text-xs font-medium text-red">
          Non-aktif
        </span>
      );
    }

    // status field → badge
    if (col.key === "status") {
      const s = String(val).toLowerCase();
      if (s === "available")
        return (
          <span className="inline-flex rounded-full bg-green/10 px-2.5 py-0.5 text-xs font-medium text-green">
            Available
          </span>
        );
      if (s === "occupied")
        return (
          <span className="inline-flex rounded-full bg-yellow/10 px-2.5 py-0.5 text-xs font-medium text-yellow">
            Occupied
          </span>
        );
      return (
        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {String(val)}
        </span>
      );
    }

    // number → formatted
    if (typeof val === "number") {
      return <span className="tabular-nums">{val}</span>;
    }

    return String(val ?? "—");
  }

  /* ── JSX ──────────────────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      </div>

      {/* ── Entity tabs ─────────────────────────────────────────── */}
      {entities.length > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-px">
          {entities.map((e, i) => (
            <button
              key={e.key}
              onClick={() => handleEntityChange(i)}
              className={`
                shrink-0 rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition-colors
                ${
                  i === activeIdx
                    ? "border-cyan text-cyan bg-cyan/5"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500"
                }
              `}
            >
              {e.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input + dropdown */}
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-md">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari berdasarkan ${searchBy === "name" ? "nama" : "kode"}…`}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-card dark:text-gray-100 py-2 pl-9 pr-3 text-sm
                focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 dark:placeholder:text-gray-500 transition-colors"
            />
          </div>
          <select
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value as "name" | "code")}
            className="rounded-lg bg-navy text-white px-3 py-2 text-sm cursor-pointer
              border border-navy focus:outline-none focus:ring-2 focus:ring-cyan/30 transition-colors"
          >
            <option value="name">Nama</option>
            <option value="code">Kode</option>
          </select>
        </div>

        {/* Filter + Create */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`
              relative inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors
              ${
                showFilter || activeFilterCount > 0
                  ? "border-cyan bg-cyan-light text-cyan"
                  : "border-cyan bg-cyan-light text-cyan hover:bg-cyan/15"
              }
            `}
          >
            <HiOutlineFunnel className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white
              hover:bg-cyan-hover active:scale-[0.98] transition-all"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* ── Filter panel ────────────────────────────────────────── */}
      {showFilter && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-navy dark:text-white">Filter Lanjutan</p>
            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilterValues({})}
                className="inline-flex items-center gap-1 text-xs text-red hover:underline"
              >
                <HiOutlineXMark className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {entity.filterFields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {f.label}
                </label>
                {f.type === "select" || f.type === "boolean" ? (
                  <select
                    value={filterValues[f.key] ?? ""}
                    onChange={(e) => setFilter(f.key, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section dark:text-gray-100 px-3 py-1.5 text-sm
                      focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
                  >
                    <option value="">Semua</option>
                    {f.type === "boolean" ? (
                      <>
                        <option value="true">Aktif</option>
                        <option value="false">Non-aktif</option>
                      </>
                    ) : (
                      f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))
                    )}
                  </select>
                ) : (
                  <input
                    type={f.type === "number" ? "number" : "text"}
                    value={filterValues[f.key] ?? ""}
                    onChange={(e) => setFilter(f.key, e.target.value)}
                    placeholder={`Filter ${f.label.toLowerCase()}…`}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-dark-section dark:text-gray-100 px-3 py-1.5 text-sm
                      focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 dark:placeholder:text-gray-500"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── View mode tabs ──────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {(
          [
            { mode: "table" as ViewMode, Icon: HiOutlineTableCells, tip: "Tabel" },
            { mode: "bar" as ViewMode, Icon: HiOutlineChartBar, tip: "Bar Chart" },
            { mode: "pie" as ViewMode, Icon: HiOutlineChartPie, tip: "Pie Chart" },
          ] as const
        ).map(({ mode, Icon, tip }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            title={tip}
            className={`
              rounded-lg p-2 transition-colors
              ${
                viewMode === mode
                  ? "bg-cyan/10 text-cyan"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-white/10"
              }
            `}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}

        <span className="ml-auto text-xs text-gray-400">
          {filteredData.length} data
        </span>
      </div>

      {/* ── Content area ────────────────────────────────────────── */}
      {viewMode === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-dark-section">
              <tr>
                {entity.columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={entity.columns.length}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, ri) => (
                  <tr
                    key={ri}
                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    {entity.columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                      >
                        {renderCellValue(col, row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Placeholder for chart views */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card py-16">
          {viewMode === "bar" ? (
            <HiOutlineChartBar className="h-12 w-12 text-gray-300" />
          ) : (
            <HiOutlineChartPie className="h-12 w-12 text-gray-300" />
          )}
          <p className="mt-3 text-sm text-gray-400">
            Visualisasi {viewMode === "bar" ? "Bar Chart" : "Pie Chart"} akan tersedia setelah integrasi data.
          </p>
        </div>
      )}
    </div>
  );
}
