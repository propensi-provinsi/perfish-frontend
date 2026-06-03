"use client";

import { ModalOverlay } from "@/components/inbound-fish/ModalPrimitives";
import { actionBtn } from "@/lib/ui-action";

export default function ConfirmActionModal({
  title,
  message,
  confirmLabel = "Yakin",
  cancelLabel = "Tidak",
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalOverlay onClose={onCancel} panelClassName="max-w-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className={actionBtn("neutral", "sm")}>
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} disabled={busy} className={actionBtn("primary", "sm")}>
          {busy ? "Memproses…" : confirmLabel}
        </button>
      </div>
    </ModalOverlay>
  );
}
