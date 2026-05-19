// Client component — rendered from MasterDataShell ("use client")
import { useEffect, useState } from "react";
import { HiOutlineXMark, HiOutlineCheckCircle } from "react-icons/hi2";

/* ── FormFieldDef — exported for use in EntityConfig ─────────────── */

export interface FormFieldDef {
  /** key that maps to the request body field name */
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select" | "multiselect";
  required?: boolean;
  placeholder?: string;
  /** For number inputs */
  min?: number;
  max?: number;
  step?: number;
  /** For select / multiselect — pass dynamic options from hook data */
  options?: Array<{ value: string | number; label: string }>;
  disabled?: boolean;
}

/* ── Props ────────────────────────────────────────────────────────── */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Modal title, e.g. "Tambah Species" or "Edit Block" */
  title: string;
  fields: FormFieldDef[];
  /** Pass the row data when editing; undefined for create */
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

/* ── Component ────────────────────────────────────────────────────── */

export default function EntityFormModal({
  isOpen,
  onClose,
  title,
  fields,
  initialData,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* reset form when modal opens / entity changes */
  useEffect(() => {
    if (isOpen) {
      const base = initialData ?? {};
      // Initialize boolean fields to false when absent so display matches submission
      const initialized: Record<string, unknown> = { ...base };
      for (const f of fields) {
        if (f.type === "boolean" && initialized[f.key] === undefined) {
          initialized[f.key] = false;
        }
      }
      setValues(initialized);
      setErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, fields]);

  /* ── helpers ──────────────────────────────────────────────────────── */

  function setValue(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
    // clear error on change
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function toggleMultiselect(key: string, value: string | number) {
    const current = (values[key] as (string | number)[]) ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setValue(key, next);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    for (const f of fields) {
      if (!f.required) continue;
      const v = values[f.key];
      if (f.type === "multiselect") {
        if (!Array.isArray(v) || v.length === 0) {
          errs[f.key] = `${f.label} wajib dipilih minimal satu`;
        }
      } else if (v === undefined || v === null || String(v).trim() === "") {
        errs[f.key] = `${f.label} wajib diisi`;
      }
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // coerce field values to correct types before submitting
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      let v = values[f.key];
      if (f.type === "number" && v !== undefined && v !== "") {
        v = Number(v);
      }
      if (f.type === "boolean") {
        v = v === "true" || v === true;
      }
      // select with numeric option values → coerce string back to number
      if (f.type === "select" && f.options && f.options.length > 0) {
        if (typeof f.options[0].value === "number" && v !== "" && v !== undefined && v !== null) {
          v = Number(v);
        }
      }
      payload[f.key] = v;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      const msg =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.message ??
        (err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi");
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── field renderer ───────────────────────────────────────────────── */

  function renderInput(f: FormFieldDef) {
    const baseClass =
      "w-full rounded-lg border border-gray-300 dark:border-gray-600 " +
      "dark:bg-dark-section dark:text-gray-100 px-3 py-2 text-sm " +
      "focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 " +
      "transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
      "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-800";

    const val = values[f.key];

    switch (f.type) {
      case "text":
        return (
          <input
            type="text"
            value={(val as string) ?? ""}
            onChange={(e) => setValue(f.key, e.target.value)}
            placeholder={f.placeholder ?? `Masukkan ${f.label.toLowerCase()}…`}
            disabled={f.disabled}
            className={baseClass}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={(val as number | "") ?? ""}
            onChange={(e) => setValue(f.key, e.target.value)}
            placeholder={f.placeholder ?? `0`}
            min={f.min}
            max={f.max}
            step={f.step ?? "any"}
            disabled={f.disabled}
            className={baseClass}
          />
        );

      case "boolean":
        return (
          <select
            value={String(val ?? false)}
            onChange={(e) => setValue(f.key, e.target.value)}
            disabled={f.disabled}
            className={baseClass}
          >
            <option value="true">Aktif</option>
            <option value="false">Non-aktif</option>
          </select>
        );

      case "select":
        return (
          <select
            value={String(val ?? "")}
            onChange={(e) => setValue(f.key, e.target.value)}
            disabled={f.disabled}
            className={baseClass}
          >
            <option value="">— Pilih {f.label} —</option>
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );

      case "multiselect": {
        const selected = (val as (string | number)[]) ?? [];
        return (
          <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-600 p-2 space-y-1">
            {f.options?.length === 0 && (
              <p className="text-xs text-gray-400 py-2 text-center">
                Tidak ada pilihan tersedia
              </p>
            )}
            {f.options?.map((o) => (
              <label
                key={o.value}
                className="flex items-center gap-2 cursor-pointer rounded px-2 py-1
                  hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(o.value)}
                  onChange={() => toggleMultiselect(f.key, o.value)}
                  disabled={f.disabled}
                  className="h-4 w-4 rounded border-gray-300 text-cyan focus:ring-cyan/30 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {o.label}
                </span>
              </label>
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  }

  /* ── early return if closed ───────────────────────────────────────── */

  if (!isOpen) return null;

  /* ── JSX ──────────────────────────────────────────────────────────── */

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-dark-card shadow-2xl border border-gray-200 dark:border-gray-700">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-base font-semibold text-navy dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  {f.label}
                  {f.required && (
                    <span className="ml-1 text-red">*</span>
                  )}
                </label>
                {renderInput(f)}
                {errors[f.key] && (
                  <p className="mt-1 text-xs text-red">{errors[f.key]}</p>
                )}
              </div>
            ))}

            {/* Server-side error */}
            {submitError && (
              <div className="rounded-lg bg-red/10 border border-red/20 px-3 py-2 text-sm text-red">
                {submitError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400
                border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/5
                disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan px-5 py-2 text-sm font-semibold text-white
                hover:bg-cyan-hover active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Menyimpan…
                </>
              ) : (
                <>
                  <HiOutlineCheckCircle className="h-4 w-4" />
                  Simpan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
