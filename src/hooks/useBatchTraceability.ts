"use client";

import { useState, useCallback } from "react";
import { masterBatchApi } from "@/lib/batch-api";
import type { BatchTraceabilityResponse, ReceivingGroupSummary } from "@/types/batch";

export function useBatchTraceability() {
  const [data, setData] = useState<BatchTraceabilityResponse | null>(null);
  const [receivingGroups, setReceivingGroups] = useState<ReceivingGroupSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTraceability = useCallback(async (batchId: number) => {
    if (!batchId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await masterBatchApi.getTraceability(batchId);
      setData(res.data.data);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (err as any).response?.data?.message || "Gagal memuat data histori / traceability";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReceivingGroups = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await masterBatchApi.getReceivingGroups(search);
      setReceivingGroups(res.data.data ?? []);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (err as any).response?.data?.message || "Gagal memuat kelompok penerimaan";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReceivingGroupTraceability = useCallback(async (receiptId: string) => {
    if (!receiptId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await masterBatchApi.getReceivingGroupTraceability(receiptId);
      setData(res.data.data);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (err as any).response?.data?.message || "Gagal memuat traceability kelompok penerimaan";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = () => {
    setData(null);
    setError(null);
  };

  return {
    data,
    receivingGroups,
    loading,
    error,
    fetchTraceability,
    fetchReceivingGroups,
    fetchReceivingGroupTraceability,
    reset,
  };
}
