"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type Option = {
  value: string;
  label: string;
  searchText?: string;
};

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
};

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih…",
  disabled = false,
  emptyMessage = "Tidak ada hasil",
  className = "",
}: Props) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const hay = (o.searchText ?? o.label).toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setQuery(selected?.label ?? "");
    }
  }, [open, selected]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        disabled={disabled}
        value={open ? query : selected?.label ?? ""}
        placeholder={placeholder}
        onFocus={() => {
          if (disabled) return;
          setOpen(true);
          setQuery(selected?.label ?? "");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan disabled:bg-gray-100 disabled:text-gray-400 dark:border-gray-600 dark:bg-dark-card dark:text-gray-100 dark:placeholder:text-gray-400"
      />
      {open && !disabled && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg dark:border-gray-600 dark:bg-dark-card"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-gray-500 dark:text-gray-400">{emptyMessage}</li>
          ) : (
            filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  className={`block w-full px-3 py-2 text-left hover:bg-cyan/10 ${
                    opt.value === value ? "bg-cyan/5 font-medium text-cyan" : "text-gray-900 dark:text-gray-100"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(opt.value);
                    setQuery(opt.label);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
