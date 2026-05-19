"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import StockOutboundModuleShell from "../components/StockOutboundModuleShell";
import { stockOutboundApi } from "@/lib/stock-outbound-api";
import { ModalOverlay } from "@/components/inbound-fish/ModalPrimitives";
import type {
  Certification,
  CertificationAlert,
  CountryReadiness,
  CertificationStatusSummary,
  ExportReadiness,
  Shipment,
  ShipmentDocumentChecklist,
  ShipmentStatus,
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

function nextShipmentStatus(current: ShipmentStatus): ShipmentStatus | null {
  if (current === "ALLOCATED") return "PICKING";
  if (current === "PICKING") return "CHECKING";
  if (current === "CHECKING") return "LOADING";
  if (current === "OUTBOUND") return "LOADING";
  if (current === "LOADING") return "DISPATCHED";
  if (current === "DISPATCHED") return "DELIVERED";
  return null;
}

function parseCountryList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

export default function DokumenEksporPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DokumenEksporContent />
    </Suspense>
  );
}

function DokumenEksporContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedShipmentId = useMemo(() => {
    const raw = searchParams.get("shipmentId");
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }, [searchParams]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<number | null>(null);
  const [checklist, setChecklist] = useState<ShipmentDocumentChecklist | null>(null);
  const [readiness, setReadiness] = useState<ExportReadiness | null>(null);

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [certStatus, setCertStatus] = useState<CertificationStatusSummary | null>(null);
  const [countryReadiness, setCountryReadiness] = useState<CountryReadiness | null>(null);
  const [alerts, setAlerts] = useState<CertificationAlert[]>([]);
  const [certificationFilter, setCertificationFilter] = useState({
    query: "",
    state: "" as "" | "ACTIVE" | "WARNING" | "EXPIRED",
    country: "",
  });
  const [certificationForm, setCertificationForm] = useState({
    certificationId: null as number | null,
    certificationName: "",
    certificateType: "",
    issuingBody: "",
    gradeLevel: "",
    issueDate: "",
    expiryDate: "",
    documentUrl: "",
    responsibleUser: "",
    countries: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCertification, setSavingCertification] = useState(false);
  const [updatingShipmentId, setUpdatingShipmentId] = useState<number | null>(null);
  const [previewingDocumentId, setPreviewingDocumentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [documentForm, setDocumentForm] = useState({
    documentName: "",
    documentNumber: "",
    status: "DRAFT" as TrackedDocumentStatus,
    expiryDate: new Date().toISOString().split("T")[0],
    fileUrl: "",
    remarks: "",
  });
  const [confirmCreate, setConfirmCreate] = useState(false);

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
    if (!preselectedShipmentId || shipments.length === 0) return;
    if (shipments.some((item) => item.shipmentId === preselectedShipmentId)) {
      setSelectedShipmentId(preselectedShipmentId);
    }
  }, [preselectedShipmentId, shipments]);

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
  const availableCountries = useMemo(
    () =>
      Array.from(
        new Set(
          certifications.flatMap((item) => item.countries ?? []).filter((item) => item && item.trim().length > 0)
        )
      ).sort(),
    [certifications]
  );

  const nextStatus = useMemo(
    () => (selectedShipment ? nextShipmentStatus(selectedShipment.status) : null),
    [selectedShipment]
  );

  const filteredCertifications = useMemo(() => {
    const query = certificationFilter.query.trim().toLowerCase();
    const selectedCountry = certificationFilter.country.trim().toUpperCase();

    return certifications.filter((item) => {
      const matchesQuery =
        !query ||
        [
          item.certificationName,
          item.certificateType,
          item.issuingBody,
          item.gradeLevel,
          item.responsibleUser,
          ...(item.countries ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesState = !certificationFilter.state || item.state === certificationFilter.state;
      const matchesCountry = !selectedCountry || (item.countries ?? []).includes(selectedCountry);
      return matchesQuery && matchesState && matchesCountry;
    });
  }, [certificationFilter, certifications]);

  const isUpdatingShipment = updatingShipmentId === selectedShipment?.shipmentId;
  const requiresReadiness = Boolean(selectedShipment?.isExport && nextStatus === "DISPATCHED");
  const readinessReadyToDispatch = Boolean(readiness && readiness.readyToDispatch && readiness.readinessScore >= 100);
  const canAdvanceShipment =
    Boolean(selectedShipment && nextStatus) && !isUpdatingShipment && (!requiresReadiness || readinessReadyToDispatch);

  useEffect(() => {
    const destination = selectedShipment?.destination?.trim().toUpperCase();
    if (!destination) {
      setCountryReadiness(null);
      return;
    }

    let mounted = true;
    stockOutboundApi
      .getCountryReadiness(destination)
      .then((response) => {
        if (mounted) {
          setCountryReadiness(response.data.data ?? null);
        }
      })
      .catch(() => {
        if (mounted) {
          setCountryReadiness(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [selectedShipment?.destination]);

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

  const handleCreateDocument = () => {
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

    setConfirmCreate(true);
  };

  const handleConfirmCreate = async () => {
    setConfirmCreate(false);
    setSaving(true);
    setError(null);

    if (!selectedShipmentId) {
      setSaving(false);
      return;
    }

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
        expiryDate: new Date().toISOString().split('T')[0],
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

  const handleDeleteDocument = async (shipmentDocumentId: number) => {
    if (!selectedShipmentId) {
      return;
    }

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

  const handleUpdateDocumentStatus = async (
    shipmentDocumentId: number,
    status: TrackedDocumentStatus
  ) => {
    if (!selectedShipmentId) {
      return;
    }

    const current = (checklist?.uploadedDocuments ?? []).find((item) => item.shipmentDocumentId === shipmentDocumentId);
    if (!current) {
      return;
    }

    try {
      await stockOutboundApi.updateShipmentDocument(shipmentDocumentId, {
        shipmentId: selectedShipmentId,
        documentName: current.documentName,
        documentNumber: current.documentNumber ?? undefined,
        status,
        expiryDate: current.expiryDate ?? undefined,
        fileUrl: current.fileUrl ?? undefined,
        countryCode: current.countryCode ?? undefined,
        remarks: current.remarks ?? undefined,
      });
      await fetchShipmentContext(selectedShipmentId);
      setSuccess("Status dokumen diperbarui.");
      clearAlert();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal memperbarui status dokumen.";
      setError(message);
      clearAlert();
    }
  };

  const handleAdvanceShipment = async (shipment: Shipment, next: ShipmentStatus) => {
    if (next === "DELIVERED") {
      try {
        const response = await stockOutboundApi.getShipmentDocuments(shipment.shipmentId);
        const uploaded = response.data.data?.uploadedDocuments ?? [];
        const hasPdf = uploaded.some((doc) => Boolean(doc.fileUrl));
        if (!hasPdf) {
          setError("Unggah PDF shipment terlebih dahulu sebelum DELIVERED.");
          clearAlert();
          return;
        }
      } catch {
        setError("Gagal mengecek dokumen shipment.");
        clearAlert();
        return;
      }
    }

    if (next === "DISPATCHED" && shipment.isExport) {
      let currentReadiness = readiness;

      if (!currentReadiness) {
        try {
          const response = await stockOutboundApi.getExportReadiness(shipment.shipmentId);
          currentReadiness = response.data.data ?? null;
          setReadiness(currentReadiness);
        } catch {
          setError("Gagal mengecek export readiness shipment.");
          clearAlert();
          return;
        }
      }

      if (!currentReadiness || currentReadiness.readinessScore < 100 || !currentReadiness.readyToDispatch) {
        setError(`Shipment ekspor belum siap dispatch. Readiness saat ini ${currentReadiness?.readinessScore ?? 0}%.`);
        clearAlert();
        return;
      }
    }

    setUpdatingShipmentId(shipment.shipmentId);
    try {
      await stockOutboundApi.updateShipmentStatus(shipment.shipmentId, {
        status: next,
        note: "Update status dari modul dokumen ekspor",
      });
      setSuccess(`Status shipment ${shipment.shipmentNumber} menjadi ${next}.`);
      clearAlert();
      await fetchMaster();
      await fetchShipmentContext(shipment.shipmentId);
      setSelectedShipmentId(shipment.shipmentId);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal memperbarui status shipment.";
      setError(message);
      clearAlert();
    } finally {
      setUpdatingShipmentId(null);
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

  const resetCertificationForm = () => {
    setCertificationForm({
      certificationId: null,
      certificationName: "",
      certificateType: "",
      issuingBody: "",
      gradeLevel: "",
      issueDate: "",
      expiryDate: "",
      documentUrl: "",
      responsibleUser: "",
      countries: "",
    });
  };

  const handleSaveCertification = async () => {
    if (!certificationForm.certificationName.trim() || !certificationForm.expiryDate) {
      setError("Nama sertifikasi dan expiry date wajib diisi.");
      clearAlert();
      return;
    }

    setSavingCertification(true);
    setError(null);

    try {
      const payload = {
        certificationName: certificationForm.certificationName.trim(),
        certificateType: certificationForm.certificateType.trim() || undefined,
        issuingBody: certificationForm.issuingBody.trim() || undefined,
        gradeLevel: certificationForm.gradeLevel.trim() || undefined,
        issueDate: certificationForm.issueDate || undefined,
        expiryDate: certificationForm.expiryDate,
        documentUrl: certificationForm.documentUrl.trim() || undefined,
        responsibleUser: certificationForm.responsibleUser.trim() || undefined,
        countries: parseCountryList(certificationForm.countries),
      };

      if (certificationForm.certificationId) {
        await stockOutboundApi.updateCertification(certificationForm.certificationId, payload);
        setSuccess("Sertifikasi berhasil diperbarui.");
      } else {
        await stockOutboundApi.createCertification(payload);
        setSuccess("Sertifikasi berhasil ditambahkan.");
      }

      clearAlert();
      resetCertificationForm();
      await fetchMaster();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal menyimpan sertifikasi.";
      setError(message);
      clearAlert();
    } finally {
      setSavingCertification(false);
    }
  };

  const handleEditCertification = (item: Certification) => {
    setCertificationForm({
      certificationId: item.certificationId,
      certificationName: item.certificationName ?? "",
      certificateType: item.certificateType ?? "",
      issuingBody: item.issuingBody ?? "",
      gradeLevel: item.gradeLevel ?? "",
      issueDate: item.issueDate ?? "",
      expiryDate: item.expiryDate ?? "",
      documentUrl: item.documentUrl ?? "",
      responsibleUser: item.responsibleUser ?? "",
      countries: (item.countries ?? []).join(", "),
    });
  };

  const handleDeleteCertification = async (certificationId: number) => {
    if (!window.confirm("Hapus sertifikasi ini?")) {
      return;
    }

    try {
      await stockOutboundApi.deleteCertification(certificationId);
      setSuccess("Sertifikasi berhasil dihapus.");
      clearAlert();
      if (certificationForm.certificationId === certificationId) {
        resetCertificationForm();
      }
      await fetchMaster();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal menghapus sertifikasi.";
      setError(message);
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
                            disabled={item.status === "FINAL"}
                            className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-60"
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

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input
              value={certificationFilter.query}
              onChange={(event) =>
                setCertificationFilter((prev) => ({ ...prev, query: event.target.value }))
              }
              placeholder="Cari nama sertifikasi / issuing body / PIC"
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
            />
            <select
              value={certificationFilter.country}
              onChange={(event) =>
                setCertificationFilter((prev) => ({ ...prev, country: event.target.value }))
              }
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
            >
              <option value="">Semua Negara</option>
              {availableCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <select
              value={certificationFilter.state}
              onChange={(event) =>
                setCertificationFilter((prev) => ({
                  ...prev,
                  state: event.target.value as typeof certificationFilter.state,
                }))
              }
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="WARNING">WARNING</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
            <button
              type="button"
              onClick={() => setCertificationFilter({ query: "", state: "", country: "" })}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-semibold"
            >
              Reset Filter
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-section p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Country Readiness</p>
              <p className="mt-1 text-xl font-bold text-navy dark:text-white">
                {countryReadiness?.readinessPercent ?? 0}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedShipment?.destination ? `Tujuan: ${selectedShipment.destination}` : "Pilih shipment ekspor"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-section p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Coverage Negara</p>
              <p className="mt-1 text-xl font-bold text-green-700 dark:text-green-400">
                {countryReadiness?.activeCertifications ?? 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">sertifikasi aktif untuk negara tujuan</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-section p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Gap Sertifikasi</p>
              <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-400">
                {(countryReadiness?.warningCertifications ?? 0) + (countryReadiness?.expiredCertifications ?? 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">warning + expired</p>
            </div>
          </div>

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
                  <th className="px-2 py-2">Negara</th>
                  <th className="px-2 py-2">State</th>
                  <th className="px-2 py-2">Expiry</th>
                  <th className="px-2 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-3 text-center text-gray-500 dark:text-gray-400">
                      No data available.
                    </td>
                  </tr>
                ) : (
                  filteredCertifications.map((item) => (
                    <tr key={item.certificationId} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-2 py-2">
                        <p className="font-semibold">{item.certificationName}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.certificateType ?? "-"}</p>
                      </td>
                      <td className="px-2 py-2">{(item.countries ?? []).join(", ") || "-"}</td>
                      <td className="px-2 py-2">{item.state}</td>
                      <td className="px-2 py-2">{formatDate(item.expiryDate)}</td>
                      <td className="px-2 py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditCertification(item)}
                            className="text-xs font-semibold text-cyan"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCertification(item.certificationId)}
                            className="text-xs font-semibold text-red-600 dark:text-red-300"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-navy dark:text-white">
                {certificationForm.certificationId ? "Edit Sertifikasi" : "Tambah Sertifikasi"}
              </h3>
              {certificationForm.certificationId ? (
                <button
                  type="button"
                  onClick={resetCertificationForm}
                  className="text-xs font-semibold text-gray-500 dark:text-gray-400"
                >
                  Batal Edit
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input
                value={certificationForm.certificationName}
                onChange={(event) =>
                  setCertificationForm((prev) => ({ ...prev, certificationName: event.target.value }))
                }
                placeholder="Nama Sertifikasi"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
              />
              <input
                value={certificationForm.certificateType}
                onChange={(event) =>
                  setCertificationForm((prev) => ({ ...prev, certificateType: event.target.value }))
                }
                placeholder="Tipe Sertifikat"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
              />
              <input
                value={certificationForm.issuingBody}
                onChange={(event) =>
                  setCertificationForm((prev) => ({ ...prev, issuingBody: event.target.value }))
                }
                placeholder="Issuing Body"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
              />
              <input
                value={certificationForm.gradeLevel}
                onChange={(event) =>
                  setCertificationForm((prev) => ({ ...prev, gradeLevel: event.target.value }))
                }
                placeholder="Grade / Level"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={certificationForm.issueDate}
                onChange={(event) =>
                  setCertificationForm((prev) => ({ ...prev, issueDate: event.target.value }))
                }
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={certificationForm.expiryDate}
                onChange={(event) =>
                  setCertificationForm((prev) => ({ ...prev, expiryDate: event.target.value }))
                }
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
              />
              <input
                value={certificationForm.responsibleUser}
                onChange={(event) =>
                  setCertificationForm((prev) => ({ ...prev, responsibleUser: event.target.value }))
                }
                placeholder="PIC / Responsible User"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
              />
              <input
                value={certificationForm.documentUrl}
                onChange={(event) =>
                  setCertificationForm((prev) => ({ ...prev, documentUrl: event.target.value }))
                }
                placeholder="Document URL"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
              />
              <input
                value={certificationForm.countries}
                onChange={(event) =>
                  setCertificationForm((prev) => ({ ...prev, countries: event.target.value }))
                }
                placeholder="Negara tujuan (pisahkan dengan koma, contoh: JP, US)"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm md:col-span-2"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveCertification}
              disabled={savingCertification}
              className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingCertification
                ? "Menyimpan..."
                : certificationForm.certificationId
                  ? "Update Sertifikasi"
                  : "Simpan Sertifikasi"}
            </button>
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
                onClick={() => {
                  if (!selectedShipment || !nextStatus) return;
                  handleAdvanceShipment(selectedShipment, nextStatus);
                }}
                disabled={!canAdvanceShipment}
                className="rounded bg-navy px-2 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdatingShipment
                  ? "Memproses..."
                  : nextStatus
                    ? `Proceed ke ${nextStatus}`
                    : "Status selesai"}
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

      {confirmCreate ? (
        <ModalOverlay onClose={() => setConfirmCreate(false)} panelClassName="max-w-lg">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-navy dark:text-white">Konfirmasi Simpan Dokumen</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Simpan dokumen <span className="font-semibold">{documentForm.documentName}</span>?
              {documentForm.status === "FINAL" ? (
                <span> Status FINAL tidak bisa diubah lagi.</span>
              ) : null}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmCreate(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white"
              >
                Ya, simpan
              </button>
            </div>
          </div>
        </ModalOverlay>
      ) : null}
    </StockOutboundModuleShell>
  );
}
