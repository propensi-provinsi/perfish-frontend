/**
 * Outbound Master Data — TypeScript interfaces
 * Mirrors backend DTOs exactly.
 */

import type { AuditFields } from "./fish";

/* ── Outbound Type ──────────────────────────────────────────────── */

export interface OutboundTypeResponse extends AuditFields {
  outboundTypeId: number;
  outboundTypeCode: string;
  outboundTypeName: string;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
}

export interface OutboundTypeRequest {
  outboundTypeCode: string;
  outboundTypeName: string;
}

/* ── Transport Mode ─────────────────────────────────────────────── */

export interface TransportModeResponse extends AuditFields {
  transportModeId: number;
  modeCode: string;
  modeName: string;
  tempControlRequired: boolean;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
}

export interface TransportModeRequest {
  modeCode: string;
  modeName: string;
  tempControlRequired?: boolean;
}

/* ── Port ───────────────────────────────────────────────────────── */

export interface PortResponse extends AuditFields {
  portId: number;
  portCode: string;
  portName: string;
  country: string | null;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
}

export interface PortRequest {
  portCode: string;
  portName: string;
  country?: string;
}

/* ── Export Document ────────────────────────────────────────────── */

export interface ExportDocumentResponse extends AuditFields {
  documentId: number;
  documentName: string;
  requiresApproval: boolean;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
}

export interface ExportDocumentRequest {
  documentName: string;
  requiresApproval?: boolean;
}

/* ── Outbound Channel ───────────────────────────────────────────── */

export interface DocumentInfo {
  documentId: number;
  documentName: string;
  requiresApproval: boolean;
}

export interface OutboundChannelResponse extends AuditFields {
  channelId: number;
  channelCode: string;
  channelName: string;
  isExport: boolean;
  isActive: boolean;
  // Outbound Type (denormalized)
  outboundTypeId: number;
  outboundTypeCode: string;
  outboundTypeName: string;
  // Transport Mode (nullable)
  transportModeId: number | null;
  modeCode: string | null;
  modeName: string | null;
  // Origin Port (nullable)
  originPortId: number | null;
  portCode: string | null;
  portName: string | null;
  // M2M export documents
  requiredDocuments: DocumentInfo[];
  createdBy: string;
  updatedBy: string;
}

export interface OutboundChannelRequest {
  channelCode: string;
  channelName: string;
  isExport?: boolean;
  outboundTypeId: number;
  transportModeId?: number | null;
  originPortId?: number | null;
  requiredDocumentIds?: number[];
}
