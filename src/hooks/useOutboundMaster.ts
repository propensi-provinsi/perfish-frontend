"use client";

/**
 * Outbound Master Data — hooks with automatic mock fallback
 *
 * Same contract as useFishMaster / useColdStorageMaster:
 * each hook returns { data, loading, error, isMock, refresh, create, update, remove }
 */

import { useState, useCallback, useEffect } from "react";
import {
  outboundTypeApi,
  transportModeApi,
  portApi,
  exportDocumentApi,
  outboundChannelApi,
} from "@/lib/outbound-api";
import {
  mockOutboundType,
  mockTransportMode,
  mockPort,
  mockExportDocument,
  mockOutboundChannel,
} from "@/lib/mock-data";
import type {
  OutboundTypeResponse,
  OutboundTypeRequest,
  TransportModeResponse,
  TransportModeRequest,
  PortResponse,
  PortRequest,
  ExportDocumentResponse,
  ExportDocumentRequest,
  OutboundChannelResponse,
  OutboundChannelRequest,
} from "@/types/outbound";
import type { MasterHookResult } from "./useFishMaster";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAuthError(err: any): boolean {
  return err?.response?.status === 401;
}

/* ════════════════════════════════════════════════════════════════════
   useOutboundType
   ════════════════════════════════════════════════════════════════════ */

export function useOutboundType(): MasterHookResult<OutboundTypeResponse, OutboundTypeRequest> {
  const [data, setData] = useState<OutboundTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await outboundTypeApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockOutboundType.map((t, i) => ({
          outboundTypeId:   i + 1,
          outboundTypeCode: t.outboundTypeCode,
          outboundTypeName: t.outboundTypeName,
          isActive:         t.isActive,
          createdAt:        "",
          updatedAt:        "",
          createdBy:        "",
          updatedBy:        "",
        }))
      );
      setIsMock(true);
      setError("Backend tidak tersedia — menampilkan data contoh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: OutboundTypeRequest) => {
    await outboundTypeApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: OutboundTypeRequest) => {
    await outboundTypeApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await outboundTypeApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}

/* ════════════════════════════════════════════════════════════════════
   useTransportMode
   ════════════════════════════════════════════════════════════════════ */

export function useTransportMode(): MasterHookResult<TransportModeResponse, TransportModeRequest> {
  const [data, setData] = useState<TransportModeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transportModeApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockTransportMode.map((m, i) => ({
          transportModeId:     i + 1,
          modeCode:            m.modeCode,
          modeName:            m.modeName,
          tempControlRequired: m.tempControlRequired,
          isActive:            m.isActive,
          createdAt:           "",
          updatedAt:           "",
          createdBy:           "",
          updatedBy:           "",
        }))
      );
      setIsMock(true);
      setError("Backend tidak tersedia — menampilkan data contoh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: TransportModeRequest) => {
    await transportModeApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: TransportModeRequest) => {
    await transportModeApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await transportModeApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}

/* ════════════════════════════════════════════════════════════════════
   usePort
   ════════════════════════════════════════════════════════════════════ */

export function usePort(): MasterHookResult<PortResponse, PortRequest> {
  const [data, setData] = useState<PortResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await portApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockPort.map((p, i) => ({
          portId:    i + 1,
          portCode:  p.portCode,
          portName:  p.portName,
          country:   p.country,
          isActive:  p.isActive,
          createdAt: "",
          updatedAt: "",
          createdBy: "",
          updatedBy: "",
        }))
      );
      setIsMock(true);
      setError("Backend tidak tersedia — menampilkan data contoh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: PortRequest) => {
    await portApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: PortRequest) => {
    await portApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await portApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}

/* ════════════════════════════════════════════════════════════════════
   useExportDocument
   ════════════════════════════════════════════════════════════════════ */

export function useExportDocument(): MasterHookResult<ExportDocumentResponse, ExportDocumentRequest> {
  const [data, setData] = useState<ExportDocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await exportDocumentApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockExportDocument.map((d, i) => ({
          documentId:       i + 1,
          documentName:     d.documentName,
          requiresApproval: d.requiresApproval,
          isActive:         d.isActive,
          createdAt:        "",
          updatedAt:        "",
          createdBy:        "",
          updatedBy:        "",
        }))
      );
      setIsMock(true);
      setError("Backend tidak tersedia — menampilkan data contoh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: ExportDocumentRequest) => {
    await exportDocumentApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: ExportDocumentRequest) => {
    await exportDocumentApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await exportDocumentApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}

/* ════════════════════════════════════════════════════════════════════
   useOutboundChannel
   ════════════════════════════════════════════════════════════════════ */

export function useOutboundChannel(): MasterHookResult<OutboundChannelResponse, OutboundChannelRequest> {
  const [data, setData] = useState<OutboundChannelResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await outboundChannelApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockOutboundChannel.map((ch, i) => ({
          channelId:        i + 1,
          channelCode:      ch.channelCode,
          channelName:      ch.channelName,
          isExport:         ch.isExport,
          isActive:         ch.isActive,
          outboundTypeId:   i + 1,
          outboundTypeCode: ch.outboundTypeCode,
          outboundTypeName: ch.outboundTypeName,
          transportModeId:  ch.modeCode ? i + 1 : null,
          modeCode:         ch.modeCode,
          modeName:         ch.modeName,
          originPortId:     ch.portCode ? i + 1 : null,
          portCode:         ch.portCode,
          portName:         ch.portName,
          requiredDocuments: ch.requiredDocumentNames.map((name, j) => ({
            documentId:       j + 1,
            documentName:     name,
            requiresApproval: false,
          })),
          createdAt: "",
          updatedAt: "",
          createdBy: "",
          updatedBy: "",
        }))
      );
      setIsMock(true);
      setError("Backend tidak tersedia — menampilkan data contoh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: OutboundChannelRequest) => {
    await outboundChannelApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: OutboundChannelRequest) => {
    await outboundChannelApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await outboundChannelApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}
