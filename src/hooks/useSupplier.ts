"use client";

import { useState, useCallback, useEffect } from "react";
import { supplierApi } from "@/lib/supplier-api";
import { mockSupplier } from "@/lib/mock-data";
import type { SupplierData, CreateSupplierPayload } from "@/types/supplier";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAuthError(err: any): boolean {
  return err?.response?.status === 401;
}

export interface SupplierHookResult {
  data: SupplierData[];
  loading: boolean;
  error: string | null;
  isMock: boolean;
  refresh: () => Promise<void>;
  create: (payload: CreateSupplierPayload) => Promise<void>;
  update: (id: string, payload: CreateSupplierPayload) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useSupplier(): SupplierHookResult {
  const [data, setData] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supplierApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(mockSupplier);
      setIsMock(true);
      setError("Backend tidak tersedia — menampilkan data contoh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: CreateSupplierPayload) => {
    await supplierApi.create(payload);
    await refresh();
  };

  const update = async (id: string, payload: CreateSupplierPayload) => {
    // API Controller currently does not support full updates for Suppliers, only updateStatus via Patch
    // We throw a standardized error or ignore
    console.warn("Update full not supported yet via generic hook");
    throw new Error("API Backend belum mendukung edit data Supplier sepenuhnya. Hubungi tim backend.");
  };

  const remove = async (id: string) => {
    // We map 'remove' to soft delete / disable (updateStatus: false)
    await supplierApi.updateStatus(id, false);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}
