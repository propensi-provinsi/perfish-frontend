"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StockOutboundModuleShell from "../components/StockOutboundModuleShell";
import { stockOutboundApi } from "@/lib/stock-outbound-api";
import type {
  AllocationSummary,
  ExportReadiness,
  FefoBatchStock,
  SalesOrderOutboundSummary,
  Shipment,
  ShipmentStatus,
  TransportModeOption,
} from "@/types/stock-outbound";
import { formatDate, formatDateTime, formatKg, isOpenSalesOrderStatus } from "../components/formatters";

type TabKey = "proses" | "shipment";

type ScanItem = {
  id: string;
  allocationId: number;
  batchNumber: string;
  qrCode: string;
  weightKg: number;
  scannedAt: string;
};

function nextShipmentStatus(current: ShipmentStatus): ShipmentStatus | null {
  if (current === "ALLOCATED") return "OUTBOUND";
  if (current === "OUTBOUND") return "LOADING";
  if (current === "LOADING") return "DISPATCHED";
  if (current === "DISPATCHED") return "DELIVERED";
  if (current === "PICKING") return "OUTBOUND";
  if (current === "CHECKING") return "OUTBOUND";
  return null;
}

function dateAsNumber(value: string | null | undefined) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function firstAllocatableId(summary: AllocationSummary | null): string {
  if (!summary?.allocations?.length) return "";
  const first = summary.allocations.find((item) => item.status === "ALLOCATED");
  return first ? String(first.allocationId) : "";
}

export default function TransaksiFefoPage() {
  const [tab, setTab] = useState<TabKey>("proses");
  const [salesOrders, setSalesOrders] = useState<SalesOrderOutboundSummary[]>([]);
  const [fefoBatches, setFefoBatches] = useState<FefoBatchStock[]>([]);
  const [transportModes, setTransportModes] = useState<TransportModeOption[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [readinessByShipmentId, setReadinessByShipmentId] = useState<Record<number, ExportReadiness>>({});
  const [loadingReadinessIds, setLoadingReadinessIds] = useState<number[]>([]);

  const [selectedSoId, setSelectedSoId] = useState<number | null>(null);
  const [allocationSummary, setAllocationSummary] = useState<AllocationSummary | null>(null);
  const [selectedAllocationId, setSelectedAllocationId] = useState<string>("");
  const [selectedShipmentId, setSelectedShipmentId] = useState<number | null>(null);

  const [loadingMaster, setLoadingMaster] = useState(true);
  const [runningFefo, setRunningFefo] = useState(false);
  const [runningManualAllocation, setRunningManualAllocation] = useState(false);
  const [savingShipmentDetails, setSavingShipmentDetails] = useState(false);
  const [updatingShipmentId, setUpdatingShipmentId] = useState<number | null>(null);
  const [deallocatingId, setDeallocatingId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [qrInput, setQrInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [outboundQrCode, setOutboundQrCode] = useState("");
  const [scanItems, setScanItems] = useState<ScanItem[]>([]);

  const [shipmentForm, setShipmentForm] = useState({
    destination: "",
    vehicleNumber: "",
    driverName: "",
    transportModeId: "",
  });

  const [manualForm, setManualForm] = useState({
    quotationItemId: "",
    batchId: "",
    quantityKg: "",
    note: "",
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const clearAlert = useCallback(() => {
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  }, []);

  const fetchMasterData = useCallback(async () => {
    setLoadingMaster(true);
    setError(null);

    try {
      const [soRes, batchRes, modeRes, shipmentRes] = await Promise.all([
        stockOutboundApi.getSalesOrders(),
        stockOutboundApi.getFefoBatches(),
        stockOutboundApi.getTransportModes(),
        stockOutboundApi.getShipments(),
      ]);

      const soData = soRes.data.data ?? [];
      const shipmentData = shipmentRes.data.data ?? [];

      setSalesOrders(soData);
      setFefoBatches(batchRes.data.data ?? []);
      setTransportModes(modeRes.data.data ?? []);
      setShipments(shipmentData);

      const readinessCandidates = shipmentData.filter(
        (item) => item.isExport && nextShipmentStatus(item.status) === "DISPATCHED"
      );

      if (readinessCandidates.length === 0) {
        setReadinessByShipmentId({});
      } else {
        setLoadingReadinessIds(readinessCandidates.map((item) => item.shipmentId));

        const readinessResults = await Promise.all(
          readinessCandidates.map(async (item) => {
            try {
              const response = await stockOutboundApi.getExportReadiness(item.shipmentId);
              return {
                shipmentId: item.shipmentId,
                readiness: response.data.data ?? null,
              };
            } catch {
              return {
                shipmentId: item.shipmentId,
                readiness: null,
              };
            }
          })
        );

        const nextReadinessMap: Record<number, ExportReadiness> = {};
        readinessResults.forEach((result) => {
          if (result.readiness) {
            nextReadinessMap[result.shipmentId] = result.readiness;
          }
        });
        setReadinessByShipmentId(nextReadinessMap);
      }

      setLoadingReadinessIds([]);

      const actionableSo = soData.filter(
        (item) =>
          isOpenSalesOrderStatus(item.salesOrderStatus) &&
          (Boolean(item.allocatable) || Boolean(item.deallocatable))
      );
      setSelectedSoId((prev) => {
        if (prev != null && actionableSo.some((item) => item.soId === prev)) {
          return prev;
        }
        return actionableSo[0]?.soId ?? null;
      });
      setSelectedShipmentId((prev) => prev ?? shipmentData[0]?.shipmentId ?? null);
    } catch {
      setError("Gagal memuat data transaksi outbound.");
      clearAlert();
    } finally {
      setLoadingMaster(false);
    }
  }, [clearAlert]);

  const fetchAllocation = useCallback(async (soId: number) => {
    try {
      const response = await stockOutboundApi.getAllocationSummary(soId);
      const summary = response.data.data;
      setAllocationSummary(summary);
      setSelectedAllocationId(firstAllocatableId(summary));
    } catch {
      setAllocationSummary(null);
      setSelectedAllocationId("");
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  useEffect(() => {
    if (selectedSoId) {
      fetchAllocation(selectedSoId);
    } else {
      setAllocationSummary(null);
      setSelectedAllocationId("");
    }
  }, [selectedSoId, fetchAllocation]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Browser tidak mendukung akses kamera.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOpen(true);
    } catch {
      setCameraError("Izin kamera ditolak atau kamera tidak tersedia.");
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const openSalesOrders = useMemo(
    () => salesOrders.filter((item) => isOpenSalesOrderStatus(item.salesOrderStatus)),
    [salesOrders]
  );

  const actionableSalesOrders = useMemo(
    () => openSalesOrders.filter((item) => Boolean(item.allocatable) || Boolean(item.deallocatable)),
    [openSalesOrders]
  );

  const sortedFefoBatches = useMemo(() => {
    return [...fefoBatches]
      .filter((item) => item.currentQuantity > 0)
      .sort((left, right) => {
        const byExpiry = dateAsNumber(left.expirationDate) - dateAsNumber(right.expirationDate);
        if (byExpiry !== 0) return byExpiry;
        return dateAsNumber(left.productionDate) - dateAsNumber(right.productionDate);
      });
  }, [fefoBatches]);

  const selectedSo = actionableSalesOrders.find((item) => item.soId === selectedSoId) ?? null;

  useEffect(() => {
    const firstItem = selectedSo?.criteria?.[0];
    setManualForm((prev) => ({
      ...prev,
      quotationItemId: firstItem ? String(firstItem.quotationItemId) : "",
      batchId: "",
      quantityKg: "",
    }));
  }, [selectedSoId, selectedSo]);

  useEffect(() => {
    if (!selectedSo) return;
    setShipmentForm((prev) => ({
      ...prev,
      destination: prev.destination || selectedSo.customerName,
    }));
  }, [selectedSo]);

  const selectedShipment = shipments.find((item) => item.shipmentId === selectedShipmentId) ?? null;

  useEffect(() => {
    if (!selectedShipment) return;
    setShipmentForm((prev) => ({
      ...prev,
      destination: selectedShipment.destination ?? "",
      vehicleNumber: selectedShipment.vehicleNumber ?? "",
      transportModeId: selectedShipment.outboundChannelId != null ? String(selectedShipment.outboundChannelId) : "",
    }));
    setOutboundQrCode("");
  }, [selectedShipment]);

  const selectedManualCriteria =
    selectedSo?.criteria.find((item) => item.quotationItemId === Number(manualForm.quotationItemId)) ?? null;

  const manualBatchOptions = useMemo(() => {
    if (!selectedManualCriteria?.speciesId) {
      return sortedFefoBatches;
    }
    return sortedFefoBatches.filter((batch) => batch.fishSpeciesId === selectedManualCriteria.speciesId);
  }, [sortedFefoBatches, selectedManualCriteria]);

  const scanTotal = scanItems.reduce((acc, item) => acc + item.weightKg, 0);
  const requiredKg = allocationSummary?.totalRequiredKg ?? 0;

  const handleRunAutoFefo = async () => {
    if (!selectedSoId) {
      setError("Pilih Sales Order terlebih dahulu.");
      clearAlert();
      return;
    }

    setRunningFefo(true);
    setError(null);
    try {
      const response = await stockOutboundApi.allocateStock(selectedSoId, { autoAllocate: true });
      const summary = response.data.data ?? null;
      setAllocationSummary(summary);
      setSelectedAllocationId(firstAllocatableId(summary));
      setSuccess("Auto FEFO berhasil dijalankan.");
      clearAlert();
      await fetchMasterData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal menjalankan auto FEFO.";
      setError(message);
      clearAlert();
    } finally {
      setRunningFefo(false);
    }
  };

  const handleRunManualAllocation = async () => {
    if (!selectedSoId) {
      setError("Pilih Sales Order terlebih dahulu.");
      clearAlert();
      return;
    }

    const quotationItemId = Number(manualForm.quotationItemId);
    const batchId = Number(manualForm.batchId);
    const quantityKg = Number(manualForm.quantityKg);

    if (!quotationItemId || !batchId) {
      setError("Pilih item quotation dan batch untuk manual allocation.");
      clearAlert();
      return;
    }

    if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
      setError("Quantity manual allocation harus lebih dari 0.");
      clearAlert();
      return;
    }

    setRunningManualAllocation(true);
    setError(null);

    try {
      const response = await stockOutboundApi.allocateStock(selectedSoId, {
        autoAllocate: false,
        note: manualForm.note.trim() || undefined,
        manualAllocations: [
          {
            quotationItemId,
            batchId,
            quantityKg,
          },
        ],
      });

      const summary = response.data.data ?? null;
      setAllocationSummary(summary);
      setSelectedAllocationId(firstAllocatableId(summary));
      setManualForm((prev) => ({
        ...prev,
        batchId: "",
        quantityKg: "",
      }));
      setSuccess("Manual allocation berhasil diproses.");
      clearAlert();
      await fetchMasterData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal memproses manual allocation.";
      setError(message);
      clearAlert();
    } finally {
      setRunningManualAllocation(false);
    }
  };

  const handleDeallocate = async (allocationId: number) => {
    if (!selectedSoId) {
      setError("Pilih Sales Order terlebih dahulu.");
      clearAlert();
      return;
    }

    setDeallocatingId(allocationId);
    setError(null);

    try {
      const response = await stockOutboundApi.deallocateStock(selectedSoId, allocationId);
      const summary = response.data.data ?? null;
      setAllocationSummary(summary);
      setSelectedAllocationId(firstAllocatableId(summary));
      setSuccess("Alokasi berhasil di-deallocate.");
      clearAlert();
      await fetchMasterData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal melakukan de-allocation.";
      setError(message);
      clearAlert();
    } finally {
      setDeallocatingId(null);
    }
  };

  const handleAddScan = () => {
    const allocationIdNumber = Number(selectedAllocationId);
    const weight = Number(weightInput);

    if (!allocationIdNumber) {
      setError("Pilih alokasi batch terlebih dahulu.");
      clearAlert();
      return;
    }

    if (!qrInput.trim()) {
      setError("QR code wajib diisi.");
      clearAlert();
      return;
    }

    if (!Number.isFinite(weight) || weight <= 0) {
      setError("Berat scan harus lebih dari 0.");
      clearAlert();
      return;
    }

    const allocation = allocationSummary?.allocations.find((item) => item.allocationId === allocationIdNumber);
    if (!allocation) {
      setError("Alokasi tidak ditemukan.");
      clearAlert();
      return;
    }

    if (allocation.status !== "ALLOCATED") {
      setError("Hanya alokasi berstatus ALLOCATED yang dapat digunakan untuk scan.");
      clearAlert();
      return;
    }

    const item: ScanItem = {
      id: `${Date.now()}-${Math.random()}`,
      allocationId: allocationIdNumber,
      batchNumber: allocation.batchNumber,
      qrCode: qrInput.trim(),
      weightKg: weight,
      scannedAt: new Date().toISOString(),
    };

    setScanItems((prev) => [item, ...prev]);
    setQrInput("");
    setWeightInput("");
    setSuccess("Scan tercatat pada transaksi FEFO.");
    clearAlert();
  };

  const handleSaveShipmentDetails = async () => {
    if (!selectedShipmentId || !selectedShipment) {
      setError("Pilih Delivery Order terlebih dahulu.");
      clearAlert();
      return;
    }

    if (selectedShipment.status !== "OUTBOUND") {
      setError("Detail delivery hanya bisa diisi saat status Delivery Order OUTBOUND.");
      clearAlert();
      return;
    }

    if (!shipmentForm.destination.trim() || !shipmentForm.vehicleNumber.trim() || !shipmentForm.transportModeId) {
      setError("Destination, nomor kendaraan, dan moda transport wajib diisi sebelum lanjut ke LOADING.");
      clearAlert();
      return;
    }

    setSavingShipmentDetails(true);
    setError(null);

    try {
      await stockOutboundApi.updateShipmentDetails(selectedShipmentId, {
        destination: shipmentForm.destination.trim(),
        vehicleNumber: shipmentForm.vehicleNumber.trim(),
        outboundChannelId: shipmentForm.transportModeId ? Number(shipmentForm.transportModeId) : undefined,
        remarks: [
          shipmentForm.driverName ? `Driver: ${shipmentForm.driverName}` : "",
        ]
          .filter(Boolean)
          .join(" | ") || undefined,
      });

      setSuccess("Detail delivery berhasil disimpan.");
      clearAlert();
      await fetchMasterData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gagal menyimpan detail delivery.";
      setError(message);
      clearAlert();
    } finally {
      setSavingShipmentDetails(false);
    }
  };

  const handleAdvanceShipment = async (shipment: Shipment) => {
    const next = nextShipmentStatus(shipment.status);
    if (!next) return;

    if (next === "OUTBOUND" && !outboundQrCode.trim()) {
      setError("Masukkan QR code batch untuk approve OUTBOUND.");
      clearAlert();
      return;
    }

    if (next === "DISPATCHED" && shipment.isExport) {
      let readiness = readinessByShipmentId[shipment.shipmentId];

      if (!readiness) {
        try {
          const response = await stockOutboundApi.getExportReadiness(shipment.shipmentId);
          readiness = response.data.data ?? null;
          if (readiness) {
            setReadinessByShipmentId((prev) => ({
              ...prev,
              [shipment.shipmentId]: readiness as ExportReadiness,
            }));
          }
        } catch {
          setError("Gagal mengecek export readiness shipment.");
          clearAlert();
          return;
        }
      }

      if (!readiness || readiness.readinessScore < 100 || !readiness.readyToDispatch) {
        setError(`Shipment ekspor belum siap dispatch. Readiness saat ini ${readiness?.readinessScore ?? 0}%.`);
        clearAlert();
        return;
      }
    }

    setUpdatingShipmentId(shipment.shipmentId);
    try {
      await stockOutboundApi.updateShipmentStatus(shipment.shipmentId, {
        status: next,
        qrCode: next === "OUTBOUND" ? outboundQrCode.trim() : undefined,
        note: "Update status dari modul transaksi FEFO",
      });
      setSuccess(`Status shipment ${shipment.shipmentNumber} menjadi ${next}.`);
      clearAlert();
      if (next === "OUTBOUND") {
        setOutboundQrCode("");
      }
      await fetchMasterData();
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

  return (
    <StockOutboundModuleShell
      title="Transaksi FEFO"
      description="Alur operasional: alokasi FEFO/manual mengunci batch dan otomatis membuat Delivery Order (status ALLOCATED), lanjut approve QR ke OUTBOUND, isi detail delivery, lalu proses LOADING hingga DISPATCHED."
    >
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-3">
        <div className="grid grid-cols-2 gap-2 md:w-[380px]">
          <button
            type="button"
            onClick={() => setTab("proses")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === "proses"
                ? "bg-cyan text-white"
                : "bg-gray-100 text-gray-700 dark:bg-dark-section dark:text-gray-200"
            }`}
          >
            Proses FEFO
          </button>
          <button
            type="button"
            onClick={() => setTab("shipment")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === "shipment"
                ? "bg-cyan text-white"
                : "bg-gray-100 text-gray-700 dark:bg-dark-section dark:text-gray-200"
            }`}
          >
            Shipment
          </button>
        </div>
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

      {tab === "proses" ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
            <h2 className="text-base font-semibold text-navy dark:text-white">1. Pilih Sales Order yang Masih Bisa Diproses</h2>
            <select
              value={selectedSoId ?? ""}
              onChange={(event) => setSelectedSoId(event.target.value ? Number(event.target.value) : null)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
            >
              <option value="">Pilih Sales Order</option>
              {actionableSalesOrders.map((item) => (
                <option key={item.soId} value={item.soId}>
                  {item.soNumber} - {item.customerName}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-1 gap-2 rounded-lg bg-gray-50 dark:bg-dark-section p-3 text-sm">
              <p>
                Customer: <span className="font-semibold">{selectedSo?.customerName ?? "-"}</span>
              </p>
              <p>
                Required: <span className="font-semibold">{formatKg(selectedSo?.totalRequiredKg)} Kg</span>
              </p>
              <p>
                Remaining: <span className="font-semibold">{formatKg(selectedSo?.remainingKg)} Kg</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunAutoFefo}
              disabled={!selectedSoId || runningFefo || loadingMaster}
              className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningFefo ? "Memproses FEFO..." : "Jalankan Auto FEFO"}
            </button>

            <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div>
                <h3 className="text-sm font-semibold text-navy dark:text-white">Manual Allocation</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gunakan manual allocation untuk override FEFO. De-allocation hanya diperbolehkan sebelum delivery order masuk tahap OUTBOUND.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <select
                  value={manualForm.quotationItemId}
                  onChange={(event) =>
                    setManualForm((prev) => ({
                      ...prev,
                      quotationItemId: event.target.value,
                      batchId: "",
                    }))
                  }
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
                >
                  <option value="">Pilih item quotation</option>
                  {(selectedSo?.criteria ?? []).map((criteria) => (
                    <option key={criteria.quotationItemId} value={criteria.quotationItemId}>
                      Item #{criteria.quotationItemId} - {criteria.speciesName ?? criteria.speciesCode ?? "Unknown species"}
                    </option>
                  ))}
                </select>

                <select
                  value={manualForm.batchId}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, batchId: event.target.value }))}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
                >
                  <option value="">Pilih batch target</option>
                  {manualBatchOptions.map((batch) => (
                    <option key={batch.batchId} value={batch.batchId}>
                      {batch.batchNumber} - {batch.fishSpeciesName ?? "-"} - {formatKg(batch.currentQuantity)} Kg
                    </option>
                  ))}
                </select>

                <input
                  value={manualForm.quantityKg}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, quantityKg: event.target.value }))}
                  placeholder="Quantity Kg"
                  inputMode="decimal"
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
                />

                <input
                  value={manualForm.note}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, note: event.target.value }))}
                  placeholder="Catatan manual allocation (opsional)"
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
                />
              </div>

              <button
                type="button"
                onClick={handleRunManualAllocation}
                disabled={!selectedSoId || runningManualAllocation}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runningManualAllocation ? "Memproses Manual..." : "Simpan Manual Allocation"}
              </button>

              {selectedManualCriteria ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Kriteria item: {selectedManualCriteria.speciesName ?? selectedManualCriteria.speciesCode ?? "-"}
                </p>
              ) : null}
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-dark-section text-left">
                  <tr>
                    <th className="px-3 py-2">Batch</th>
                    <th className="px-3 py-2">Ikan</th>
                    <th className="px-3 py-2">Expiry</th>
                    <th className="px-3 py-2 text-right">Allocated</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingMaster ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                        Loading data...
                      </td>
                    </tr>
                  ) : allocationSummary?.allocations?.length ? (
                    allocationSummary.allocations.map((item) => (
                      <tr key={item.allocationId} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-2 font-medium">{item.batchNumber}</td>
                        <td className="px-3 py-2">{item.fishSpeciesName ?? "-"}</td>
                        <td className="px-3 py-2">{formatDate(item.expirationDate)}</td>
                        <td className="px-3 py-2 text-right">{formatKg(item.allocatedQuantity)} Kg</td>
                        <td className="px-3 py-2">{item.status}</td>
                        <td className="px-3 py-2">
                          {item.status === "ALLOCATED" ? (
                            <button
                              type="button"
                              onClick={() => handleDeallocate(item.allocationId)}
                              disabled={deallocatingId === item.allocationId}
                              className="text-xs font-semibold text-red-600 disabled:opacity-60 dark:text-red-300"
                            >
                              {deallocatingId === item.allocationId ? "Memproses..." : "De-allocate"}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                        No data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
            <h2 className="text-base font-semibold text-navy dark:text-white">2. Scan QR Batch</h2>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={cameraOpen ? stopCamera : startCamera}
                className="rounded-lg border border-cyan px-3 py-2 text-sm font-semibold text-cyan"
              >
                {cameraOpen ? "Matikan Kamera" : "Nyalakan Kamera"}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Kamera membantu operator membaca QR di perangkat mobile.
              </p>
            </div>

            {cameraError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                {cameraError}
              </div>
            ) : null}

            {cameraOpen ? (
              <video
                ref={videoRef}
                className="h-48 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-black object-cover"
                autoPlay
                playsInline
                muted
              />
            ) : null}

            <select
              value={selectedAllocationId}
              onChange={(event) => setSelectedAllocationId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
            >
              <option value="">Pilih alokasi batch</option>
              {(allocationSummary?.allocations ?? [])
                .filter((item) => item.status === "ALLOCATED")
                .map((item) => (
                <option key={item.allocationId} value={item.allocationId}>
                  {item.batchNumber} - {formatKg(item.allocatedQuantity)} Kg
                </option>
                ))}
            </select>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                value={qrInput}
                onChange={(event) => setQrInput(event.target.value)}
                placeholder="QR Code"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
              />
              <input
                value={weightInput}
                onChange={(event) => setWeightInput(event.target.value)}
                placeholder="Berat Kg"
                inputMode="decimal"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleAddScan}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white"
            >
              Tambahkan Hasil Scan
            </button>

            <div className="grid grid-cols-1 gap-2 rounded-lg bg-gray-50 dark:bg-dark-section p-3 text-sm">
              <p>
                Total Scan: <span className="font-semibold">{formatKg(scanTotal)} Kg</span>
              </p>
              <p>
                Required SO: <span className="font-semibold">{formatKg(requiredKg)} Kg</span>
              </p>
              <p>
                Selisih: <span className="font-semibold">{formatKg(requiredKg - scanTotal)} Kg</span>
              </p>
            </div>

            <div className="max-h-60 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-dark-section text-left">
                  <tr>
                    <th className="px-3 py-2">Batch</th>
                    <th className="px-3 py-2">QR</th>
                    <th className="px-3 py-2 text-right">Kg</th>
                    <th className="px-3 py-2">Waktu</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {scanItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                        No data available.
                      </td>
                    </tr>
                  ) : (
                    scanItems.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-2">{item.batchNumber}</td>
                        <td className="px-3 py-2">{item.qrCode}</td>
                        <td className="px-3 py-2 text-right">{formatKg(item.weightKg)}</td>
                        <td className="px-3 py-2">{formatDateTime(item.scannedAt)}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setScanItems((prev) => prev.filter((scan) => scan.id !== item.id))}
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

            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              Delivery Order dibuat otomatis saat alokasi dikunci. Lanjutkan ke tab Shipment untuk approval QR (status OUTBOUND), isi detail delivery, lalu lanjutkan ke LOADING dan DISPATCHED.
            </div>
          </article>

          <article className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4 lg:col-span-2">
            <h2 className="text-base font-semibold text-navy dark:text-white">Rekomendasi FEFO Batch</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-dark-section text-left">
                  <tr>
                    <th className="px-3 py-2">Prioritas</th>
                    <th className="px-3 py-2">Batch</th>
                    <th className="px-3 py-2">Ikan</th>
                    <th className="px-3 py-2">Expiry</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingMaster ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                        Loading data...
                      </td>
                    </tr>
                  ) : sortedFefoBatches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                        No data available.
                      </td>
                    </tr>
                  ) : (
                    sortedFefoBatches.slice(0, 10).map((item, index) => (
                      <tr key={item.batchId} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-2">#{index + 1}</td>
                        <td className="px-3 py-2 font-medium">{item.batchNumber}</td>
                        <td className="px-3 py-2">{item.fishSpeciesName ?? "-"}</td>
                        <td className="px-3 py-2">{formatDate(item.expirationDate)}</td>
                        <td className="px-3 py-2 text-right">{formatKg(item.currentQuantity)} Kg</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      ) : (
        <section className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4">
          <h2 className="text-base font-semibold text-navy dark:text-white">Progress Shipment</h2>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <select
              value={selectedShipmentId ?? ""}
              onChange={(event) =>
                setSelectedShipmentId(event.target.value ? Number(event.target.value) : null)
              }
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
            >
              <option value="">Pilih Delivery Order</option>
              {shipments.map((item) => (
                <option key={item.shipmentId} value={item.shipmentId}>
                  {item.shipmentNumber} - {item.customerName}
                </option>
              ))}
            </select>
            <input
              readOnly
              value={selectedShipment?.customerName ?? ""}
              placeholder="Customer otomatis"
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-section px-3 py-2 text-sm"
            />
            <input
              value={outboundQrCode}
              onChange={(event) => setOutboundQrCode(event.target.value)}
              placeholder="QR Code batch untuk approve OUTBOUND"
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm md:col-span-2"
            />
            <select
              value={shipmentForm.transportModeId}
              onChange={(event) => setShipmentForm((prev) => ({ ...prev, transportModeId: event.target.value }))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
            >
              <option value="">Pilih Moda Transport</option>
              {transportModes.filter((item) => item.isActive).map((item) => (
                <option key={item.transportModeId} value={item.transportModeId}>
                  {item.modeCode} - {item.modeName}
                </option>
              ))}
            </select>
            <input
              value={shipmentForm.destination}
              onChange={(event) => setShipmentForm((prev) => ({ ...prev, destination: event.target.value }))}
              placeholder="Lokasi pengiriman"
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
            />
            <input
              value={shipmentForm.vehicleNumber}
              onChange={(event) => setShipmentForm((prev) => ({ ...prev, vehicleNumber: event.target.value }))}
              placeholder="Nomor kendaraan"
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm"
            />
            <input
              value={shipmentForm.driverName}
              onChange={(event) => setShipmentForm((prev) => ({ ...prev, driverName: event.target.value }))}
              placeholder="Nama driver"
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-section px-3 py-2 text-sm md:col-span-2"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveShipmentDetails}
              disabled={!selectedShipment || selectedShipment.status !== "OUTBOUND" || savingShipmentDetails}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingShipmentDetails ? "Menyimpan Detail..." : "Simpan Detail Delivery"}
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
              Approval QR dilakukan saat transisi ALLOCATED ke OUTBOUND. Setelah OUTBOUND, isi detail delivery dulu sebelum lanjut ke LOADING.
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-section text-left">
                <tr>
                  <th className="px-3 py-2">DO Number</th>
                  <th className="px-3 py-2">SO Number</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Updated</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loadingMaster ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                      Loading data...
                    </td>
                  </tr>
                ) : shipments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                      No data available.
                    </td>
                  </tr>
                ) : (
                  shipments.map((item) => {
                    const next = nextShipmentStatus(item.status);
                    const needsReadinessGate = next === "DISPATCHED" && item.isExport;
                    const readiness = readinessByShipmentId[item.shipmentId];
                    const readinessUnavailable = needsReadinessGate && !readiness;
                    const readinessBlocked =
                      needsReadinessGate && Boolean(readiness) && readiness.readinessScore < 100;
                    const readinessLoading = loadingReadinessIds.includes(item.shipmentId);

                    return (
                      <tr
                        key={item.shipmentId}
                        className={`border-t border-gray-100 dark:border-gray-800 ${
                          item.shipmentId === selectedShipmentId ? "bg-cyan/5" : ""
                        }`}
                      >
                        <td className="px-3 py-2 font-medium">{item.shipmentNumber}</td>
                        <td className="px-3 py-2">{item.soNumber}</td>
                        <td className="px-3 py-2">{item.customerName}</td>
                        <td className="px-3 py-2">{item.status}</td>
                        <td className="px-3 py-2">{formatDateTime(item.createdAt)}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedShipmentId(item.shipmentId)}
                              className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs"
                            >
                              Pilih
                            </button>
                            <button
                              type="button"
                              disabled={
                                !next ||
                                updatingShipmentId === item.shipmentId ||
                                readinessUnavailable ||
                                readinessBlocked
                              }
                              onClick={() => handleAdvanceShipment(item)}
                              className="rounded-md bg-navy px-2 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {updatingShipmentId === item.shipmentId
                                ? "Updating..."
                                : readinessLoading
                                  ? "Cek readiness..."
                                  : readinessBlocked
                                    ? `Readiness ${readiness?.readinessScore ?? 0}%`
                                : next
                                  ? `Lanjut ${next}`
                                  : "Selesai"}
                            </button>
                          </div>
                          {needsReadinessGate ? (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {readiness
                                ? `Readiness ekspor: ${readiness.readinessScore}%`
                                : "Readiness ekspor belum tersedia"}
                            </p>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </StockOutboundModuleShell>
  );
}
