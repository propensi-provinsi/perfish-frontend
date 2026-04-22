"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StockOutboundModuleShell from "../components/StockOutboundModuleShell";
import { stockOutboundApi } from "@/lib/stock-outbound-api";
import type {
  Certification,
  CertificationAlert,
  CertificationStatusSummary,
  ExportReadiness,
  Shipment,
  ShipmentDocumentChecklist,
  TrackedDocumentStatus,
} from "@/types/stock-outbound";
import { formatDate, formatDateTime } from "../components/formatters";

const documentStatuses: TrackedDocumentStatus[] = ["MISSING", "DRAFT", "FINAL", "EXPIRED"];

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
}

function resolveChecklistActionLink(key: string) {
  if (key === "export_documents" || key === "country_certification") {
    return "/stock-outbound/dokumen-ekspor";
  }
  return "/stock-outbound/transaksi-fefo";
}

export default function DokumenEksporPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<number | null>(null);
  const [checklist, setChecklist] = useState<ShipmentDocumentChecklist | null>(null);
  const [readiness, setReadiness] = useState<ExportReadiness | null>(null);

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [certStatus, setCertStatus] = useState<CertificationStatusSummary | null>(null);
  const [alerts, setAlerts] = useState<CertificationAlert[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewingDocumentId, setPreviewingDocumentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [documentForm, setDocumentForm] = useState({
    documentName: "",
    documentNumber: "",
    status: "DRAFT" as TrackedDocumentStatus,
    expiryDate: "",
    fileUrl: "",
    remarks: "",
  });

  const clearAlert = useCallback(() => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3500);
  }, []);

  const fetchMaster = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [shipmentRes, certRes, certStatusRes, alertRes] = await Promise.all([
        stockOutboundApi.getShipments(),
        stockOutboundApi.getCertifications(),
        stockOutboundApi.getCertificationStatus(),
        stockOutboundApi.getCertificationAlerts(),
      ]);

      const shipmentData = shipmentRes.data.data ?? [];
      setShipments(shipmentData);
      setCertifications(certRes.data.data ?? []);
      setCertStatus(certStatusRes.data.data ?? null);
      setAlerts(alertRes.data.data ?? []);
      setSelectedShipmentId((prev) => prev ?? shipmentData[0]?.shipmentId ?? null);
    } catch {
      setError("Gagal memuat data dokumen ekspor.");
      clearAlert();
    } finally {
      setLoading(false);
    }
  }, [clearAlert]);

  const fetchShipmentContext = useCallback(async (shipmentId: number) => {
    try {
      const [docRes, readinessRes] = await Promise.all([
        stockOutboundApi.getShipmentDocuments(shipmentId),
        stockOutboundApi.getExportReadiness(shipmentId),
      ]);
      setChecklist(docRes.data.data ?? null);
      setReadiness(readinessRes.data.data ?? null);
    } catch {
      setChecklist(null);
      setReadiness(null);
    }
  }, []);

  useEffect(() => {
    fetchMaster();
  }, [fetchMaster]);

  useEffect(() => {
    if (selectedShipmentId) {
      fetchShipmentContext(selectedShipmentId);
    } else {
      setChecklist(null);
      setReadiness(null);
    }
  }, [selectedShipmentId, fetchShipmentContext]);

  const selectedShipment = useMemo(
    () => shipments.find((item) => item.shipmentId === selectedShipmentId) ?? null,
    [shipments, selectedShipmentId]
  );

  const assignSelectedPdf = (file: File | null) => {
    if (!file) {
      setSelectedPdfFile(null);
      return;
    }

    const isPdfMime = file.type === "application/pdf";
    const isPdfName = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfMime && !isPdfName) {
      setError("File harus berformat PDF.");
      clearAlert();
      return;
    }

    setSelectedPdfFile(file);
    setError(null);
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    assignSelectedPdf(event.target.files?.[0] ?? null);
  };

  const handleDropFile = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    assignSelectedPdf(event.dataTransfer.files?.[0] ?? null);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handlePreviewPdf = async (shipmentDocumentId: number, fileUrl: string | null) => {
    if (!fileUrl) {
      setError("Dokumen ini belum memiliki file PDF.");
      clearAlert();
      return;
    }

    setPreviewingDocumentId(shipmentDocumentId);

    try {
      const response = await stockOutboundApi.fetchExportDocumentPdf(fileUrl);
      const objectUrl = window.URL.createObjectURL(response.data);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 60_000);
    } catch {
      // Fallback for external URLs when blob fetch is blocked by remote CORS policy.
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    } finally {
      setPreviewingDocumentId(null);
    }
  };

  const handleCreateDocument = async () => {
    if (!selectedShipmentId) {
      setError("Pilih shipment terlebih dahulu.");
      clearAlert();
      return;
    }

    if (!documentForm.documentName.trim()) {
      setError("Nama dokumen wajib diisi.");
      clearAlert();
      return;
    }

    setSaving(true);
    try {
      let fileUrl = documentForm.fileUrl || undefined;
      if (selectedPdfFile) {
        const uploadResponse = await stockOutboundApi.uploadExportDocumentPdf(selectedPdfFile);
        fileUrl = uploadResponse.data.data?.fileUrl || fileUrl;
      }

      await stockOutboundApi.createShipmentDocument({
        shipmentId: selectedShipmentId,
        documentName: documentForm.documentName.trim(),
        documentNumber: documentForm.documentNumber || undefined,
        status: documentForm.status,
        expiryDate: documentForm.expiryDate || undefined,
        fileUrl,
        remarks: documentForm.remarks || undefined,
      });

      setDocumentForm({
        documentName: "",
        documentNumber: "",
        status: "DRAFT",
        expiryDate: "",
        fileUrl: "",
        remarks: "",
      });
      setSelectedPdfFile(null);
      setSuccess("Dokumen ekspor berhasil ditambahkan.");
      clearAlert();
      await fetchShipmentContext(selectedShipmentId);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal menambahkan dokumen ekspor.";
      setError(message);
      clearAlert();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDocumentStatus = async (shipmentDocumentId: number, status: TrackedDocumentStatus) => {
    if (!selectedShipmentId) return;

    try {
      await stockOutboundApi.updateShipmentDocument(shipmentDocumentId, {
        shipmentId: selectedShipmentId,
        status,
      });
      await fetchShipmentContext(selectedShipmentId);
      setSuccess("Status dokumen diperbarui.");
      clearAlert();
    } catch {
      setError("Gagal memperbarui status dokumen.");
      clearAlert();
    }
  };

  const handleDeleteDocument = async (shipmentDocumentId: number) => {
    if (!selectedShipmentId) return;

    try {
      await stockOutboundApi.deleteShipmentDocument(shipmentDocumentId);
      await fetchShipmentContext(selectedShipmentId);
      setSuccess("Dokumen dihapus.");
      clearAlert();
    } catch {
      setError("Gagal menghapus dokumen.");
      clearAlert();
    }
  };

  const handleMarkAlertRead = async (alertId: number) => {
    try {
      await stockOutboundApi.markCertificationAlertRead(alertId);
      setAlerts((prev) => prev.map((item) => (item.alertId === alertId ? { ...item, isRead: true } : item)));
    } catch {
      setError("Gagal memperbarui status alert sertifikasi.");
      clearAlert();
    }
  };

  return (
    <StockOutboundModuleShell
      title="Dokumen Ekspor"
      description="Kelola checklist dokumen per shipment dan pantau kesiapan sertifikasi untuk memenuhi persyaratan ekspor."
    >
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Readiness Shipment</p>
          <p className="mt-1 text-2xl font-bold text-navy dark:text-white">{readiness?.readinessScore ?? 0}%</p>
        </article>
        <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Sertifikasi Aktif</p>
          <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-400">{certStatus?.totalActive ?? 0}</p>
        </article>
        <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Sertifikasi Warning/Expired</p>
          <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
            {(certStatus?.totalWarning ?? 0) + (certStatus?.totalExpired ?? 0)}
          </p>
        </article>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
          {success}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4 xl:col-span-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-base font-semibold text-navy dark:text-white">Checklist Dokumen Shipment</h2>
            <select
              value={selectedShipmentId ?? ""}
              onChange={(event) =>
                setSelectedShipmentId(event.target.value ? Number(event.target.value) : null)
              }
              className="w-full md:w-96 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
            >
              <option value="">Pilih Delivery Order</option>
              {shipments.map((item) => (
                <option key={item.shipmentId} value={item.shipmentId}>
                  {item.shipmentNumber} - {item.customerName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-lg bg-gray-50 dark:bg-dark-section p-3 text-sm md:grid-cols-3">
            <p>
              Customer: <span className="font-semibold">{selectedShipment?.customerName ?? "-"}</span>
            </p>
            <p>
              Destination: <span className="font-semibold">{selectedShipment?.destination ?? "-"}</span>
            </p>
            <p>
              Completion: <span className="font-semibold">{checklist?.completionPercent ?? 0}%</span>
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-section text-left">
                <tr>
                  <th className="px-3 py-2">Dokumen</th>
                  <th className="px-3 py-2">Nomor</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Expiry</th>
                  <th className="px-3 py-2">PDF</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                      Loading data...
                    </td>
                  </tr>
                ) : (checklist?.uploadedDocuments ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                      No data available.
                    </td>
                  </tr>
                ) : (
                  checklist?.uploadedDocuments.map((item) => (
                    <tr key={item.shipmentDocumentId} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2 font-medium">{item.documentName}</td>
                      <td className="px-3 py-2">{item.documentNumber ?? "-"}</td>
                      <td className="px-3 py-2">
                        <select
                          value={item.status}
                          onChange={(event) =>
                            handleUpdateDocumentStatus(
                              item.shipmentDocumentId,
                              event.target.value as TrackedDocumentStatus
                            )
                          }
                          className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-2 py-1 text-xs"
                        >
                          {documentStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">{formatDate(item.expiryDate)}</td>
                      <td className="px-3 py-2">
                        {item.fileUrl ? (
                          <button
                            type="button"
                            onClick={() => handlePreviewPdf(item.shipmentDocumentId, item.fileUrl)}
                            disabled={previewingDocumentId === item.shipmentDocumentId}
                            className="text-xs font-semibold text-cyan disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {previewingDocumentId === item.shipmentDocumentId ? "Membuka..." : "Lihat PDF"}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Belum ada</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(item.shipmentDocumentId)}
                          className="text-xs font-semibold text-red-600 dark:text-red-300"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <h3 className="text-sm font-semibold text-navy dark:text-white">Tambah Dokumen</h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input
                value={documentForm.documentName}
                onChange={(event) =>
                  setDocumentForm((prev) => ({ ...prev, documentName: event.target.value }))
                }
                placeholder="Nama Dokumen"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
              />
              <input
                value={documentForm.documentNumber}
                onChange={(event) =>
                  setDocumentForm((prev) => ({ ...prev, documentNumber: event.target.value }))
                }
                placeholder="Nomor Dokumen"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
              />
              <select
                value={documentForm.status}
                onChange={(event) =>
                  setDocumentForm((prev) => ({ ...prev, status: event.target.value as TrackedDocumentStatus }))
                }
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
              >
                {documentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={documentForm.expiryDate}
                onChange={(event) =>
                  setDocumentForm((prev) => ({ ...prev, expiryDate: event.target.value }))
                }
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
              />
              <div
                onDrop={handleDropFile}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`rounded-lg border-2 border-dashed px-3 py-4 text-sm md:col-span-2 transition ${
                  isDragOver
                    ? "border-cyan bg-cyan/10"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <p className="font-medium text-navy dark:text-white">Upload PDF</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Drag & drop file PDF ke sini atau pilih file secara manual.
                  </p>
                  <input type="file" accept="application/pdf" onChange={handleFileInput} className="text-xs" />
                  {selectedPdfFile ? (
                    <div className="rounded-md bg-gray-50 dark:bg-dark-card px-2 py-2 text-xs">
                      <p className="font-semibold">{selectedPdfFile.name}</p>
                      <p className="text-gray-500 dark:text-gray-400">{formatFileSize(selectedPdfFile.size)}</p>
                      <button
                        type="button"
                        onClick={() => setSelectedPdfFile(null)}
                        className="mt-1 font-semibold text-red-600 dark:text-red-300"
                      >
                        Hapus file terpilih
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <input
                value={documentForm.fileUrl}
                onChange={(event) =>
                  setDocumentForm((prev) => ({ ...prev, fileUrl: event.target.value }))
                }
                placeholder="URL File eksternal (opsional)"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm md:col-span-2"
              />
              <textarea
                value={documentForm.remarks}
                onChange={(event) =>
                  setDocumentForm((prev) => ({ ...prev, remarks: event.target.value }))
                }
                placeholder="Catatan"
                rows={3}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm md:col-span-2"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateDocument}
              disabled={saving || !selectedShipmentId}
              className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Dokumen"}
            </button>
          </div>
        </article>

        <article className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
          <h2 className="text-base font-semibold text-navy dark:text-white">Sertifikasi & Alert</h2>

          <div className="space-y-2 max-h-48 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 p-2">
            {alerts.length === 0 ? (
              <p className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400">No data available.</p>
            ) : (
              alerts.map((item) => (
                <div key={item.alertId} className="rounded-lg border border-amber-200 dark:border-amber-900 p-2 text-xs">
                  <p className="font-semibold">{item.certificationName}</p>
                  <p>{item.message}</p>
                  <p className="text-gray-500 dark:text-gray-400">{formatDate(item.alertDate)}</p>
                  {!item.isRead ? (
                    <button
                      type="button"
                      onClick={() => handleMarkAlertRead(item.alertId)}
                      className="mt-1 text-xs font-semibold text-cyan"
                    >
                      Tandai dibaca
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 dark:bg-dark-section text-left">
                <tr>
                  <th className="px-2 py-2">Sertifikasi</th>
                  <th className="px-2 py-2">State</th>
                  <th className="px-2 py-2">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {certifications.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-2 py-3 text-center text-gray-500 dark:text-gray-400">
                      No data available.
                    </td>
                  </tr>
                ) : (
                  certifications.map((item) => (
                    <tr key={item.certificationId} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-2 py-2">{item.certificationName}</td>
                      <td className="px-2 py-2">{item.state}</td>
                      <td className="px-2 py-2">{formatDate(item.expiryDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg bg-gray-50 dark:bg-dark-section p-3 text-xs text-gray-600 dark:text-gray-300">
            <p className="font-semibold text-sm text-navy dark:text-white">Readiness Detail</p>
            {(readiness?.items ?? []).length === 0 ? (
              <p className="mt-2">No data available.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {readiness?.items.map((item) => (
                  <div key={item.key} className="rounded-md border border-gray-200 dark:border-gray-700 px-2 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-gray-700 dark:text-gray-200">
                        <span className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                          item.passed
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        }`}>
                          {item.passed ? "✔" : "✖"}
                        </span>
                        {item.label}
                      </p>
                      {!item.passed ? (
                        <Link
                          href={resolveChecklistActionLink(item.key)}
                          className="shrink-0 rounded bg-cyan/10 px-2 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300"
                        >
                          Selesaikan
                        </Link>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{item.details}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/stock-outbound/transaksi-fefo")}
                className="rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs font-semibold"
              >
                Buka Workflow Shipment
              </button>
              <button
                type="button"
                onClick={() => router.push("/stock-outbound/transaksi-fefo")}
                disabled={!readiness?.readyToDispatch}
                className="rounded bg-navy px-2 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Proceed ke Dispatch
              </button>
            </div>

            {selectedShipment ? (
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Shipment dibuat: {formatDateTime(selectedShipment.createdAt)}
              </p>
            ) : null}
          </div>
        </article>
      </section>
    </StockOutboundModuleShell>
  );
}
