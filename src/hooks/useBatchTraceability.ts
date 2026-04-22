"use client";

import { useState, useCallback } from "react";
import { masterBatchApi } from "@/lib/batch-api";
import type { BatchTraceabilityResponse } from "@/types/batch";

export function useBatchTraceability() {
  const [data, setData] = useState<BatchTraceabilityResponse | null>(null);
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

  const reset = () => {
    setData(null);
    setError(null);
  };

  return { data, loading, error, fetchTraceability, reset };
}
