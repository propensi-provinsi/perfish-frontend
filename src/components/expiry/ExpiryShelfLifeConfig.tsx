"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { deleteShelfLifeConfigGroup, getShelfLifeConfigs } from "@/lib/expiry";
import type { ShelfLifeConfigData } from "@/types";

type ConfigGroup = {
  id: string;
  shelfLifeMonths: number;
  warningThresholdMonths: number;
  speciesIds: number[];
  speciesNames: string[];
  isActive: boolean;
};

function toMonths(days: number) {
  return Math.max(1, Math.round(days / 30));
}

function toGroupConfigs(configs: ShelfLifeConfigData[]): ConfigGroup[] {
  const map = new Map<string, ConfigGroup>();

  for (const item of configs) {
    const shelfLifeMonths = toMonths(item.defaultShelfLifeDays);
    const warningThresholdMonths = Math.max(1, Math.round(item.warningThresholdDays / 30));
    const speciesName = item.speciesName;
    const key = `${shelfLifeMonths}-${warningThresholdMonths}-${item.isActive}`;

    if (!map.has(key)) {
      map.set(key, {
        id: key,
        shelfLifeMonths,
        warningThresholdMonths,
        speciesIds: [item.speciesId],
        speciesNames: [speciesName],
        isActive: item.isActive,
      });
    } else {
      const existing = map.get(key)!;
      existing.speciesIds.push(item.speciesId);
      existing.speciesNames.push(speciesName);
    }
  }

  return Array.from(map.values()).map((g, index) => ({
    ...g,
    id: `${g.shelfLifeMonths}-${g.warningThresholdMonths}-${g.isActive}-${index}`,
    speciesIds: Array.from(new Set(g.speciesIds)).sort((a, b) => a - b),
    speciesNames: Array.from(new Set(g.speciesNames)).sort((a, b) => a.localeCompare(b)),
  }));
}

export default function ExpiryShelfLifeConfig() {
  const [loading, setLoading] = useState(true);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<ConfigGroup[]>([]);

  async function loadConfigData() {
    setLoading(true);
    setError(null);
    try {
      const configData = await getShelfLifeConfigs();
      setGroups(toGroupConfigs(configData));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat konfigurasi shelf life";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfigData();
  }, []);

  async function handleDeleteGroup(group: ConfigGroup) {
    setDeletingGroupId(group.id);
    setError(null);
    try {
      await deleteShelfLifeConfigGroup(group.speciesIds);
      await loadConfigData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus konfigurasi shelf life";
      setError(message);
    } finally {
      setDeletingGroupId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Konfigurasi Shelf Life Parameter</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Halaman ini menampilkan konfigurasi shelf life aktif. Untuk menambah atau mengubah group, klik tombol Tambah Group Baru.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Existing Shelf Life Configurations</h2>
          <Link href="/expired-alert/config/new">
            <Button size="sm" variant="outline">Tambah Group Baru</Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Memuat konfigurasi...</p>
        ) : groups.length ? (
          <div className="space-y-4">
            {groups.map((group, index) => (
              <div key={group.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Group {index + 1}</p>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${group.isActive ? "bg-green/10 text-green" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
                      {group.isActive ? "Active" : "Inactive"}
                    </span>
                    <Link
                      href={`/expired-alert/config/new?mode=edit&shelfLifeMonths=${group.shelfLifeMonths}&warningThresholdMonths=${group.warningThresholdMonths}&speciesIds=${group.speciesIds.join(",")}&isActive=${group.isActive}`}
                    >
                      <Button size="sm" variant="outline">Edit</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleDeleteGroup(group)}
                      disabled={deletingGroupId === group.id}
                    >
                      {deletingGroupId === group.id ? "Menghapus..." : "Hapus"}
                    </Button>
                  </div>
                </div>

                <div className="mb-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-dark-section">
                    <p className="text-xs text-gray-500">Shelf Life</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{group.shelfLifeMonths} bulan</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-dark-section">
                    <p className="text-xs text-gray-500">Warning Threshold</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{group.warningThresholdMonths} bulan</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500">Species</p>
                  <div className="flex flex-wrap gap-2">
                    {group.speciesNames.map((label) => (
                      <span
                        key={`${group.id}-${label}`}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Belum ada konfigurasi shelf life.</p>
        )}
      </section>
    </div>
  );
}
