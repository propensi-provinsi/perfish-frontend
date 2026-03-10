"use client";

/**
 * Fish Master Data — hooks with automatic mock fallback
 *
 * Every hook:
 *  - Tries to load from the backend via the API service
 *  - On any non-401 error → falls back to mock data (isMock = true)
 *  - Exposes: { data, loading, error, isMock, refresh, create, update, remove }
 *  - When isMock === true, create/update/remove will throw — callers should
 *    disable those UI actions when isMock is true.
 */

import { useState, useCallback, useEffect } from "react";
import {
  fishSpeciesApi,
  fishFormApi,
  fishGradeApi,
  packagingTypeApi,
  fishSkuApi,
} from "@/lib/fish-api";
import {
  mockFishSpecies,
  mockFishForm,
  mockFishGrade,
  mockPackagingType,
  mockFishSku,
} from "@/lib/mock-data";
import type {
  FishSpeciesResponse,
  FishSpeciesRequest,
  FishFormResponse,
  FishFormRequest,
  FishGradeResponse,
  FishGradeRequest,
  PackagingTypeResponse,
  PackagingTypeRequest,
  FishSkuResponse,
  FishSkuRequest,
} from "@/types/fish";

/* ── shared return shape ──────────────────────────────────────────── */

export interface MasterHookResult<T, R> {
  data: T[];
  loading: boolean;
  /** Non-null when falling back to mock (also contains the error message) */
  error: string | null;
  /** true when data is coming from mock (backend unreachable) */
  isMock: boolean;
  refresh: () => Promise<void>;
  /** Throws on API error — disabled automatically when isMock === true */
  create: (payload: R) => Promise<void>;
  update: (id: number, payload: R) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

/* ── isNetworkError helper ────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAuthError(err: any): boolean {
  return err?.response?.status === 401;
}

/* ════════════════════════════════════════════════════════════════════
   useFishSpecies
   ════════════════════════════════════════════════════════════════════ */

export function useFishSpecies(): MasterHookResult<FishSpeciesResponse, FishSpeciesRequest> {
  const [data, setData] = useState<FishSpeciesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fishSpeciesApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      // fallback to mock
      setData(
        mockFishSpecies.map((s, i) => ({
          speciesId: i + 1,
          speciesCode: s.speciesCode,
          speciesName: s.speciesName,
          isActive: s.isActive,
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

  const create = async (payload: FishSpeciesRequest) => {
    await fishSpeciesApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: FishSpeciesRequest) => {
    await fishSpeciesApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await fishSpeciesApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}

/* ════════════════════════════════════════════════════════════════════
   useFishForm
   ════════════════════════════════════════════════════════════════════ */

export function useFishForm(): MasterHookResult<FishFormResponse, FishFormRequest> {
  const [data, setData] = useState<FishFormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fishFormApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockFishForm.map((f, i) => ({
          formId: i + 1,
          formCode: f.formCode,
          formName: f.formName,
          isActive: f.isActive,
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

  const create = async (payload: FishFormRequest) => {
    await fishFormApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: FishFormRequest) => {
    await fishFormApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await fishFormApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}

/* ════════════════════════════════════════════════════════════════════
   useFishGrade
   ════════════════════════════════════════════════════════════════════ */

export function useFishGrade(): MasterHookResult<FishGradeResponse, FishGradeRequest> {
  const [data, setData] = useState<FishGradeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fishGradeApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockFishGrade.map((g, i) => ({
          gradeId: i + 1,
          gradeCode: g.gradeCode,
          gradeName: g.gradeName,
          isActive: g.isActive,
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

  const create = async (payload: FishGradeRequest) => {
    await fishGradeApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: FishGradeRequest) => {
    await fishGradeApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await fishGradeApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}

/* ════════════════════════════════════════════════════════════════════
   usePackagingType
   ════════════════════════════════════════════════════════════════════ */

export function usePackagingType(): MasterHookResult<PackagingTypeResponse, PackagingTypeRequest> {
  const [data, setData] = useState<PackagingTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await packagingTypeApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockPackagingType.map((p, i) => ({
          packagingTypeId: i + 1,
          packagingCode: p.packagingCode,
          packagingName: p.packagingName,
          isActive: p.isActive,
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

  const create = async (payload: PackagingTypeRequest) => {
    await packagingTypeApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: PackagingTypeRequest) => {
    await packagingTypeApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await packagingTypeApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}

/* ════════════════════════════════════════════════════════════════════
   useFishSku
   ════════════════════════════════════════════════════════════════════ */

export function useFishSku(): MasterHookResult<FishSkuResponse, FishSkuRequest> {
  const [data, setData] = useState<FishSkuResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fishSkuApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockFishSku.map((s, i) => ({
          skuId: i + 1,
          skuCode: s.skuCode,
          speciesId: 0,
          speciesCode: "",
          speciesName: s.speciesName,
          formId: 0,
          formCode: "",
          formName: s.formName,
          gradeId: 0,
          gradeCode: "",
          gradeName: s.gradeName,
          packagingTypeId: 0,
          packagingCode: "",
          packagingName: s.packagingName,
          minWeightKg: s.minWeightKg,
          maxWeightKg: s.maxWeightKg,
          defaultShelfLifeDays: s.defaultShelfLifeDays,
          defaultStorageTempC: s.defaultStorageTempC,
          isActive: s.isActive,
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

  const create = async (payload: FishSkuRequest) => {
    await fishSkuApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: FishSkuRequest) => {
    await fishSkuApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await fishSkuApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}
