"use client";

import { useState, useCallback, useEffect } from "react";
import {
  currencyApi,
  bankAccountApi,
  taxApi,
  paymentTermApi,
} from "@/lib/sales-api";
import {
  mockCurrency,
  mockBankAccount,
  mockTax,
  mockPaymentTerm,
} from "@/lib/mock-data";
import type {
  CurrencyResponse,
  CurrencyRequest,
  BankAccountResponse,
  BankAccountRequest,
  TaxResponse,
  TaxRequest,
  PaymentTermResponse,
  PaymentTermRequest,
} from "@/types/sales";
import type { MasterHookResult } from "./useFishMaster";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAuthError(err: any): boolean {
  return err?.response?.status === 401;
}

/* ════════════════════════════════════════════════════════════════════
   useCurrency
   ════════════════════════════════════════════════════════════════════ */

export function useCurrency(): MasterHookResult<CurrencyResponse, CurrencyRequest> {
  const [data, setData] = useState<CurrencyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await currencyApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockCurrency.map((t, i) => ({
          currencyId:   i + 1,
          currencyCode: t.currencyCode,
          currencyName: t.currencyName,
          isActive:     t.isActive,
          createdAt:    "",
          updatedAt:    "",
          createdBy:    "",
          updatedBy:    "",
        }))
      );
      setIsMock(true);
      setError("Backend tidak tersedia — menampilkan data contoh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: CurrencyRequest) => {
    await currencyApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: CurrencyRequest) => {
    await currencyApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await currencyApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}

/* ════════════════════════════════════════════════════════════════════
   useBankAccount
   ════════════════════════════════════════════════════════════════════ */

export function useBankAccount(): MasterHookResult<BankAccountResponse, BankAccountRequest> {
  const [data, setData] = useState<BankAccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bankAccountApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockBankAccount.map((m, i) => ({
          accountId:     i + 1,
          branchId:      m.branchId,
          bankName:      m.bankName,
          accountNumber: m.accountNumber,
          accountName:   m.accountName,
          isActive:      m.isActive,
          createdAt:     "",
          updatedAt:     "",
          createdBy:     "",
          updatedBy:     "",
        }))
      );
      setIsMock(true);
      setError("Backend tidak tersedia — menampilkan data contoh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: BankAccountRequest) => {
    await bankAccountApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: BankAccountRequest) => {
    await bankAccountApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await bankAccountApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}


/* ════════════════════════════════════════════════════════════════════
   useTax
   ════════════════════════════════════════════════════════════════════ */

export function useTax(): MasterHookResult<TaxResponse, TaxRequest> {
  const [data, setData] = useState<TaxResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await taxApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockTax.map((p, i) => ({
          taxId:         i + 1,
          taxCode:       p.taxCode,
          taxPercentage: p.taxPercentage,
          isActive:      p.isActive,
          createdAt:     "",
          updatedAt:     "",
          createdBy:     "",
          updatedBy:     "",
        }))
      );
      setIsMock(true);
      setError("Backend tidak tersedia — menampilkan data contoh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: TaxRequest) => {
    await taxApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: TaxRequest) => {
    await taxApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await taxApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}

/* ════════════════════════════════════════════════════════════════════
   usePaymentTerm
   ════════════════════════════════════════════════════════════════════ */

export function usePaymentTerm(): MasterHookResult<PaymentTermResponse, PaymentTermRequest> {
  const [data, setData] = useState<PaymentTermResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentTermApi.getAll();
      setData(res.data.data ?? []);
      setIsMock(false);
      setError(null);
    } catch (err) {
      if (isAuthError(err)) { setLoading(false); return; }
      setData(
        mockPaymentTerm.map((d, i) => ({
          paymentTermId: i + 1,
          termCode:      d.termCode,
          termName:      d.termName,
          days:          d.days,
          isActive:      d.isActive,
          createdAt:     "",
          updatedAt:     "",
          createdBy:     "",
          updatedBy:     "",
        }))
      );
      setIsMock(true);
      setError("Backend tidak tersedia — menampilkan data contoh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (payload: PaymentTermRequest) => {
    await paymentTermApi.create(payload);
    await refresh();
  };
  const update = async (id: number, payload: PaymentTermRequest) => {
    await paymentTermApi.update(id, payload);
    await refresh();
  };
  const remove = async (id: number) => {
    await paymentTermApi.delete(id);
    await refresh();
  };

  return { data, loading, error, isMock, refresh, create, update, remove };
}
