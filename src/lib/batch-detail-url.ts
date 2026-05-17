/** Path halaman detail batch (untuk link & QR). */
export function batchDetailHref(batchNumber: string): string {
  return `/storage/batch/${encodeURIComponent(batchNumber.trim())}`;
}

/** URL penuh untuk isi QR (client-side). */
export function batchDetailQrValue(batchNumber: string): string {
  const path = batchDetailHref(batchNumber);
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
}
