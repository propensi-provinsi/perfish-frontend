"use client";

/**
 * Cold Storage Master Data — hooks with automatic mock fallback
 *
 * Same contract as useFishMaster: each hook returns
 * { data, loading, error, isMock, refresh, create, update, remove }
 */

import { useState, useCallback, useEffect } from "react";
import {
  branchApi,
  coldStorageApi,
  storageBlockApi,
  storageRackApi,
  storagePositionApi,
} from "@/lib/cold-storage-api";
import {
  mockBranch,
  mockColdStorage,
  mockStorageBlock,
  mockStorageRack,
  mockStoragePosition,
} from "@/lib/mock-data";
import type {
  BranchResponse,
  BranchRequest,
  ColdStorageResponse,
  ColdStorageRequest,
  StorageBlockResponse,
  StorageBlockRequest,
  StorageRackResponse,
  StorageRackRequest,
  StoragePositionResponse,
  StoragePositionRequest,
  PositionStatus,
} from "@/types/cold-storage";
import type { MasterHookResult } from "./useFishMaster";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAuthError(err: any): boolean {
  return err?.response?.status === 401;
}

/* ════════════════════════════════════════════════════════════════════
   useBranch
   ════════════════════════════════════════════════════════════════════ */

export function useBranch(): MasterHookResult<BranchResponse, BranchRequest> {
  const [data, setData] = useState<BranchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await branchApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockBranch.map((b, i) => ({
          branchId: i + 1,
          branchCode: b.branchCode,
          branchName: b.branchName,
          isActive: b.isActive,
          createdAt: "",
          updatedAt: "",
        }))
      );
      setIsMock(true);
      setError("Backend tidak tersedia — menampilkan data contoh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: BranchRequest) => {
    await branchApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: BranchRequest) => {
    await branchApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await branchApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}

/* ════════════════════════════════════════════════════════════════════
   useColdStorage
   ════════════════════════════════════════════════════════════════════ */

export function useColdStorage(): MasterHookResult<ColdStorageResponse, ColdStorageRequest> {
  const [data, setData] = useState<ColdStorageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await coldStorageApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockColdStorage.map((cs, i) => ({
          coldStorageId: i + 1,
          branchId: 0,
          branchCode: "",
          branchName: cs.branchName,
          csCode: cs.csCode,
          csName: cs.csName,
          isActive: cs.isActive,
          createdAt: "",
          updatedAt: "",
        }))
      );
      setIsMock(true);
      setError("Backend tidak tersedia — menampilkan data contoh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: ColdStorageRequest) => {
    await coldStorageApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: ColdStorageRequest) => {
    await coldStorageApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await coldStorageApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}

/* ════════════════════════════════════════════════════════════════════
   useStorageBlock
   ════════════════════════════════════════════════════════════════════ */

export function useStorageBlock(): MasterHookResult<StorageBlockResponse, StorageBlockRequest> {
  const [data, setData] = useState<StorageBlockResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await storageBlockApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockStorageBlock.map((b, i) => ({
          blockId: i + 1,
          coldStorageId: 0,
          csCode: "",
          csName: b.coldStorageName,
          blockCode: b.blockCode,
          blockName: b.blockName,
          blockOwner: b.blockOwner,
          blockCapacity: b.blockCapacity,
          // M2M — map single mock species to array
          species: [
            { speciesId: 0, speciesCode: "", speciesName: b.speciesName },
          ],
          isActive: b.isActive,
          createdAt: "",
          updatedAt: "",
        }))
      );
      setIsMock(true);
      setError("Backend tidak tersedia — menampilkan data contoh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: StorageBlockRequest) => {
    await storageBlockApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: StorageBlockRequest) => {
    await storageBlockApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await storageBlockApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}

/* ════════════════════════════════════════════════════════════════════
   useStorageRack
   ════════════════════════════════════════════════════════════════════ */

export function useStorageRack(): MasterHookResult<StorageRackResponse, StorageRackRequest> {
  const [data, setData] = useState<StorageRackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await storageRackApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockStorageRack.map((r, i) => ({
          rackId: i + 1,
          blockId: 0,
          blockCode: "",
          blockName: r.blockName,
          rackCode: r.rackCode,
          isActive: r.isActive,
          createdAt: "",
          updatedAt: "",
        }))
      );
      setIsMock(true);
      setError("Backend tidak tersedia — menampilkan data contoh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: StorageRackRequest) => {
    await storageRackApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: StorageRackRequest) => {
    await storageRackApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await storageRackApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}

/* ════════════════════════════════════════════════════════════════════
   useStoragePosition
   ════════════════════════════════════════════════════════════════════ */

export function useStoragePosition(): MasterHookResult<StoragePositionResponse, StoragePositionRequest> {
  const [data, setData] = useState<StoragePositionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await storagePositionApi.getAll();
      const rows = (res.data.data ?? []).map((p) => ({
        ...p,
        status: (p.status ?? "AVAILABLE").toString().trim().toUpperCase() as PositionStatus,
      }));
      setData(rows);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockStoragePosition.map((p, i) => ({
          positionId: i + 1,
          rackId: 0,
          rackCode: p.rackCode,
          positionCode: p.positionCode,
          // normalize mock lowercase → UPPERCASE enum
          status: p.status.toUpperCase() as PositionStatus,
          isActive: true,
          createdAt: "",
          updatedAt: "",
        }))
      );
      setIsMock(true);
      setError("Backend tidak tersedia — menampilkan data contoh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: StoragePositionRequest) => {
    await storagePositionApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: StoragePositionRequest) => {
    await storagePositionApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await storagePositionApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}
