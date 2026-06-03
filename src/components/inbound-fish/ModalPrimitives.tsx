"use client";

export function ModalOverlay({
  onClose,
  children,
  panelClassName,
  hideCloseButton = false,
}: {
  onClose: () => void;
  children: React.ReactNode;
  /** Tambahan kelas panel (sama pola dengan Master Data Supplier: default lebar max-w-2xl) */
  panelClassName?: string;
  /** Sembunyikan tombol tutup (✕) di pojok kanan atas */
  hideCloseButton?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full rounded-xl bg-white p-6 shadow-2xl dark:bg-dark-card ${
          panelClassName ?? "max-w-2xl"
        }`}
      >
        {!hideCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-lg leading-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Tutup"
          >
            ✕
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
