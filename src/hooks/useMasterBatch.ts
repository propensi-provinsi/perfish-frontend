"use client";

import { useState, useCallback, useEffect } from "react";
import { masterBatchApi } from "@/lib/batch-api";
import { mockMasterBatch } from "@/lib/mock-data";
import type { MasterBatchResponse, MasterBatchRequest } from "@/types/batch";

export interface MasterHookResult<T, R> {
  data: T[];
  loading: boolean;
  error: string | null;
  isMock: boolean;
  refresh: () => Promise<void>;
  create: (payload: R) => Promise<void>;
  update: (id: number, payload: R) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isNetworkError = (err: any) => !err.response || err.code === "ERR_NETWORK";

export function useMasterBatch(): MasterHookResult<MasterBatchResponse, MasterBatchRequest> {
  const [data, setData] = useState<MasterBatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const fetchBackendData = useCallback(async () => {
    try {
      const res = await masterBatchApi.getAll();
      setData(res.data.data);
      setIsMock(false);
      setError(null);
    } catch (err: unknown) {
      if (isNetworkError(err)) {
        console.warn("Backend unreachable. Falling back to mock data for Master Batch.");
        setData(mockMasterBatch as unknown as MasterBatchResponse[]);
        setIsMock(true);
        setError("Backend tidak dapat dihubungi. Menampilkan data lokal (mock).");
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (err as any).response?.data?.message || "Gagal memuat data master batch";
        setError(errorMessage);
        setIsMock(false);
        throw err;
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchBackendData().finally(() => setLoading(false));
  }, [fetchBackendData]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  const create = async (payload: MasterBatchRequest) => {
    if (isMock) {
      throw new Error("Tidak dapat menyimpan data saat menggunakan mode Offline / Mock.");
    }
    await masterBatchApi.create(payload);
    await refresh();
  };

  const update = async (id: number, payload: MasterBatchRequest) => {
    if (isMock) {
      throw new Error("Tidak dapat menyimpan perubahan saat menggunakan mode Offline / Mock.");
    }
    await masterBatchApi.update(id, payload);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update };
}
