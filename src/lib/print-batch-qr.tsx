"use client";

import { createRoot, type Root } from "react-dom/client";
import { QRCodeSVG } from "qrcode.react";
import { batchDetailQrValue } from "@/lib/batch-detail-url";

export type BatchQrPrintItem = {
  batchNumber: string;
};

const PRINT_HOST_ID = "propen-qr-print-host";

/**
 * Cetak label QR saja (grid) tanpa popup — memakai iframe tersembunyi agar tidak diblokir browser.
 */
export function printBatchQrCodes(items: BatchQrPrintItem[]) {
  const numbers = items.map((i) => i.batchNumber.trim()).filter(Boolean);
  if (numbers.length === 0) return;

  const existing = document.getElementById(PRINT_HOST_ID);
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = PRINT_HOST_ID;
  iframe.setAttribute("title", "Cetak QR Batch");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Cetak QR Batch</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; padding: 12mm; }
    @media print { body { padding: 8mm; } }
  </style>
</head>
<body><div id="qr-print-root"></div></body>
</html>`);
  doc.close();

  const mount = doc.getElementById("qr-print-root");
  if (!mount) {
    iframe.remove();
    return;
  }

  let root: Root | null = createRoot(mount);
  root.render(
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "16px",
        justifyItems: "center",
      }}
    >
      {numbers.map((batchNumber) => (
        <div
          key={batchNumber}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            padding: "12px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            pageBreakInside: "avoid",
          }}
        >
          <QRCodeSVG value={batchDetailQrValue(batchNumber)} size={128} level="M" />
          <p
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: "13px",
              fontWeight: 700,
              textAlign: "center",
              wordBreak: "break-all",
            }}
          >
            {batchNumber}
          </p>
        </div>
      ))}
    </div>
  );

  const cleanup = () => {
    root?.unmount();
    root = null;
    iframe.remove();
  };

  const triggerPrint = () => {
    win.focus();
    win.print();
    win.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(cleanup, 60_000);
  };

  if (doc.readyState === "complete") {
    setTimeout(triggerPrint, 350);
  } else {
    win.addEventListener("load", () => setTimeout(triggerPrint, 350), { once: true });
  }
}
