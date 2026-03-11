"use client";

import { useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import MasterDataShell, {
  type EntityConfig,
} from "@/components/master-data/MasterDataShell";
import {
  useOutboundType,
  useTransportMode,
  usePort,
  useExportDocument,
  useOutboundChannel,
} from "@/hooks/useOutboundMaster";
import type { DocumentInfo } from "@/types/outbound";

/* ── Page ───────────────────────────────────────────────────────── */

export default function OutboundMasterDataPage() {
  const outboundType   = useOutboundType();
  const transportMode  = useTransportMode();
  const port           = usePort();
  const exportDocument = useExportDocument();
  const channel        = useOutboundChannel();

  // Flatten requiredDocuments → string[] for tag-cloud rendering
  const channelData = useMemo(
    () =>
      channel.data.map((ch) => ({
        ...ch,
        documentNames: (ch.requiredDocuments ?? []).map(
          (d: DocumentInfo) => d.documentName
        ),
      })),
    [channel.data]
  );

  /* ── Outbound Type ──────────────────────────────────────────── */
  const outboundTypeEntity: EntityConfig = {
    key:       "outbound-type",
    label:     "Tipe Outbound",
    idField:   "outboundTypeId",
    codeField: "outboundTypeCode",
    nameField: "outboundTypeName",
    columns: [
      { key: "outboundTypeCode", label: "Kode Tipe" },
      { key: "outboundTypeName", label: "Nama Tipe" },
      { key: "isActive",         label: "Status" },
    ],
    data:    outboundType.data,
    loading: outboundType.loading,
    isMock:  outboundType.isMock,
    error:   outboundType.error,
    filterFields: [
      { key: "outboundTypeCode", label: "Kode",   type: "text" },
      { key: "outboundTypeName", label: "Nama",   type: "text" },
      { key: "isActive",         label: "Status", type: "boolean" },
    ],
    formFields: [
      { key: "outboundTypeCode", label: "Kode Tipe",  type: "text", required: true, placeholder: "EKSPOR" },
      { key: "outboundTypeName", label: "Nama Tipe",  type: "text", required: true, placeholder: "Ekspor Luar Negeri" },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => outboundType.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => outboundType.update(Number(id), data as any),
    onDelete: (id) => outboundType.remove(Number(id)),
  };

  /* ── Transport Mode ─────────────────────────────────────────── */
  const transportModeEntity: EntityConfig = {
    key:       "transport-mode",
    label:     "Moda Transportasi",
    idField:   "transportModeId",
    codeField: "modeCode",
    nameField: "modeName",
    columns: [
      { key: "modeCode",            label: "Kode Moda" },
      { key: "modeName",            label: "Nama Moda" },
      { key: "tempControlRequired", label: "Suhu Terkontrol" },
      { key: "isActive",            label: "Status" },
    ],
    data:    transportMode.data,
    loading: transportMode.loading,
    isMock:  transportMode.isMock,
    error:   transportMode.error,
    filterFields: [
      { key: "modeCode",            label: "Kode",            type: "text" },
      { key: "modeName",            label: "Nama",            type: "text" },
      { key: "tempControlRequired", label: "Suhu Terkontrol", type: "boolean" },
      { key: "isActive",            label: "Status",          type: "boolean" },
    ],
    formFields: [
      { key: "modeCode", label: "Kode Moda", type: "text", required: true, placeholder: "SEA" },
      { key: "modeName", label: "Nama Moda", type: "text", required: true, placeholder: "Angkutan Laut" },
      { key: "tempControlRequired", label: "Suhu Terkontrol (Reefer)", type: "boolean" },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => transportMode.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => transportMode.update(Number(id), data as any),
    onDelete: (id) => transportMode.remove(Number(id)),
  };

  /* ── Port ───────────────────────────────────────────────────── */
  const portEntity: EntityConfig = {
    key:       "port",
    label:     "Pelabuhan",
    idField:   "portId",
    codeField: "portCode",
    nameField: "portName",
    columns: [
      { key: "portCode", label: "Kode Pelabuhan" },
      { key: "portName", label: "Nama Pelabuhan" },
      { key: "country",  label: "Negara" },
      { key: "isActive", label: "Status" },
    ],
    data:    port.data,
    loading: port.loading,
    isMock:  port.isMock,
    error:   port.error,
    filterFields: [
      { key: "portCode", label: "Kode",   type: "text" },
      { key: "portName", label: "Nama",   type: "text" },
      { key: "country",  label: "Negara", type: "text" },
      { key: "isActive", label: "Status", type: "boolean" },
    ],
    formFields: [
      { key: "portCode", label: "Kode Pelabuhan (UN/LOCODE)", type: "text", required: true, placeholder: "IDJKT" },
      { key: "portName", label: "Nama Pelabuhan",             type: "text", required: true, placeholder: "Pelabuhan Tanjung Priok" },
      { key: "country",  label: "Negara",                     type: "text", placeholder: "Indonesia" },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => port.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => port.update(Number(id), data as any),
    onDelete: (id) => port.remove(Number(id)),
  };

  /* ── Export Document ────────────────────────────────────────── */
  const exportDocumentEntity: EntityConfig = {
    key:       "export-document",
    label:     "Dokumen Ekspor",
    idField:   "documentId",
    codeField: "documentName",
    nameField: "documentName",
    columns: [
      { key: "documentName",     label: "Nama Dokumen" },
      { key: "requiresApproval", label: "Perlu Persetujuan" },
      { key: "isActive",         label: "Status" },
    ],
    data:    exportDocument.data,
    loading: exportDocument.loading,
    isMock:  exportDocument.isMock,
    error:   exportDocument.error,
    filterFields: [
      { key: "documentName",     label: "Nama",              type: "text" },
      { key: "requiresApproval", label: "Perlu Persetujuan", type: "boolean" },
      { key: "isActive",         label: "Status",            type: "boolean" },
    ],
    formFields: [
      { key: "documentName",     label: "Nama Dokumen",      type: "text",    required: true, placeholder: "Certificate of Origin" },
      { key: "requiresApproval", label: "Perlu Persetujuan", type: "boolean" },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => exportDocument.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => exportDocument.update(Number(id), data as any),
    onDelete: (id) => exportDocument.remove(Number(id)),
  };

  /* ── Outbound Channel ───────────────────────────────────────── */
  const channelEntity: EntityConfig = {
    key:       "channel",
    label:     "Channel Outbound",
    idField:   "channelId",
    codeField: "channelCode",
    nameField: "channelName",
    columns: [
      { key: "channelCode",      label: "Kode Channel" },
      { key: "channelName",      label: "Nama Channel" },
      { key: "outboundTypeName", label: "Tipe Outbound" },
      { key: "modeName",         label: "Moda Transportasi" },
      { key: "portName",         label: "Pelabuhan" },
      { key: "isExport",         label: "Ekspor?" },
      { key: "documentNames",    label: "Dokumen" },
      { key: "isActive",         label: "Status" },
    ],
    data:    channelData,
    loading: channel.loading,
    isMock:  channel.isMock,
    error:   channel.error,
    filterFields: [
      { key: "channelCode", label: "Kode", type: "text" },
      { key: "channelName", label: "Nama", type: "text" },
      {
        key: "outboundTypeName", label: "Tipe Outbound", type: "select",
        options: outboundType.data.map((t) => ({
          value: t.outboundTypeName,
          label: t.outboundTypeName,
        })),
      },
      { key: "isExport", label: "Ekspor?", type: "boolean" },
      { key: "isActive", label: "Status",  type: "boolean" },
    ],
    formFields: [
      { key: "channelCode", label: "Kode Channel", type: "text", required: true, placeholder: "EKS-LAUT-JKT" },
      { key: "channelName", label: "Nama Channel", type: "text", required: true, placeholder: "Ekspor Laut via Jakarta" },
      { key: "isExport",    label: "Ekspor ke Luar Negeri?", type: "boolean" },
      {
        key: "outboundTypeId", label: "Tipe Outbound", type: "select", required: true,
        options: outboundType.data.filter((t) => t.isActive).map((t) => ({
          value: t.outboundTypeId,
          label: t.outboundTypeName,
        })),
      },
      {
        key: "transportModeId", label: "Moda Transportasi (opsional)", type: "select",
        options: [
          { value: "", label: "— Tidak ada —" },
          ...transportMode.data.filter((m) => m.isActive).map((m) => ({
            value: m.transportModeId,
            label: m.modeName,
          })),
        ],
      },
      {
        key: "originPortId", label: "Pelabuhan Asal (opsional)", type: "select",
        options: [
          { value: "", label: "— Tidak ada —" },
          ...port.data.filter((p) => p.isActive).map((p) => ({
            value: p.portId,
            label: `${p.portCode} — ${p.portName}`,
          })),
        ],
      },
      {
        key: "requiredDocumentIds", label: "Dokumen yang Diperlukan", type: "multiselect",
        options: exportDocument.data.filter((d) => d.isActive).map((d) => ({
          value: d.documentId,
          label: d.documentName,
        })),
      },
    ],
    getFormData: (row) => ({
      channelCode:         row.channelCode,
      channelName:         row.channelName,
      isExport:            row.isExport,
      outboundTypeId:      row.outboundTypeId,
      transportModeId:     row.transportModeId ?? "",
      originPortId:        row.originPortId ?? "",
      requiredDocumentIds:
        (row.requiredDocuments as DocumentInfo[] | undefined)?.map(
          (d) => d.documentId
        ) ?? [],
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => channel.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => channel.update(Number(id), data as any),
    onDelete: (id) => channel.remove(Number(id)),
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <MasterDataShell
          title="Komponen Outbound"
          subtitle="Kelola master data outbound — tipe, moda transportasi, pelabuhan, dokumen ekspor, dan channel distribusi"
          entities={[
            outboundTypeEntity,
            transportModeEntity,
            portEntity,
            exportDocumentEntity,
            channelEntity,
          ]}
        />
      </AppShell>
    </ProtectedRoute>
  );
}
