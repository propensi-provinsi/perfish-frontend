"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  getFishSpecies,
  getShelfLifeConfigs,
  upsertShelfLifeConfigs,
} from "@/lib/expiry";
import type { FishSpeciesData } from "@/types";

type ConfigGroup = {
  id: string;
  shelfLifeMonths: string;
  warningThresholdMonths: string;
  speciesIds: number[];
  isActive: boolean;
};

function isPositiveInteger(value: string) {
  return /^[1-9]\d*$/.test(value.trim());
}

function countExistingGroups(configs: { defaultShelfLifeDays: number; warningThresholdDays: number; isActive: boolean }[]) {
  const keys = new Set<string>();
  for (const item of configs) {
    const shelfLifeMonths = Math.max(1, Math.round(item.defaultShelfLifeDays / 30));
    const warningThresholdMonths = Math.max(1, Math.round(item.warningThresholdDays / 30));
    keys.add(`${shelfLifeMonths}-${warningThresholdMonths}-${item.isActive}`);
  }
  return keys.size;
}

export default function ExpiryShelfLifeConfigEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [species, setSpecies] = useState<FishSpeciesData[]>([]);
  const [groups, setGroups] = useState<ConfigGroup[]>([]);
  const [groupNumberOffset, setGroupNumberOffset] = useState(1);

  const isEditMode = searchParams.get("mode") === "edit";

  const loadEditorData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [speciesData, existingConfigs] = await Promise.all([
        getFishSpecies(),
        getShelfLifeConfigs(),
      ]);

      const speciesIds = (searchParams.get("speciesIds") ?? "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0);

      const shelfLifeMonthsParam = searchParams.get("shelfLifeMonths");
      const warningThresholdMonthsParam = searchParams.get("warningThresholdMonths");
      const isActive = searchParams.get("isActive") !== "false";

      const shelfLifeMonths =
        isEditMode && shelfLifeMonthsParam && isPositiveInteger(shelfLifeMonthsParam)
          ? shelfLifeMonthsParam
          : "";

      const warningThresholdMonths =
        isEditMode && warningThresholdMonthsParam && isPositiveInteger(warningThresholdMonthsParam)
          ? warningThresholdMonthsParam
          : "";

      setSpecies(speciesData);
      setGroupNumberOffset(isEditMode ? 1 : countExistingGroups(existingConfigs) + 1);
      setGroups([
        {
          id: isEditMode ? `edit-${speciesIds.join("-") || "group"}` : `new-${Date.now()}`,
          shelfLifeMonths,
          warningThresholdMonths,
          speciesIds,
          isActive,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat konfigurasi shelf life";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isEditMode, searchParams]);

  useEffect(() => {
    loadEditorData();
  }, [loadEditorData]);

  function addGroup() {
    setGroups((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        shelfLifeMonths: "",
        warningThresholdMonths: "",
        speciesIds: [],
        isActive: true,
      },
    ]);
  }

  function updateGroup(id: string, patch: Partial<ConfigGroup>) {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function toggleSpecies(groupId: string, speciesId: number) {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        const exists = group.speciesIds.includes(speciesId);
        return {
          ...group,
          speciesIds: exists
            ? group.speciesIds.filter((id) => id !== speciesId)
            : [...group.speciesIds, speciesId],
        };
      })
    );
  }

  async function handleSaveConfig() {
    const payloadGroups = [];

    for (let i = 0; i < groups.length; i += 1) {
      const group = groups[i];
      const label = `Group ${groupNumberOffset + i}`;
      const speciesIds = Array.from(new Set(group.speciesIds)).sort((a, b) => a - b);

      if (!group.shelfLifeMonths.trim() || !group.warningThresholdMonths.trim()) {
        setError(`${label}: Shelf life dan warning threshold wajib diisi.`);
        return;
      }

      if (!isPositiveInteger(group.shelfLifeMonths) || !isPositiveInteger(group.warningThresholdMonths)) {
        setError(`${label}: Shelf life dan warning threshold harus angka bulat positif.`);
        return;
      }

      const shelfLifeValue = Number(group.shelfLifeMonths);
      const warningValue = Number(group.warningThresholdMonths);
      if (warningValue >= shelfLifeValue) {
        setError(`${label}: Warning threshold harus lebih kecil dari shelf life.`);
        return;
      }

      if (speciesIds.length === 0) {
        setError(`${label}: Minimal pilih satu species.`);
        return;
      }

      payloadGroups.push({
        speciesIds,
        defaultShelfLifeDays: shelfLifeValue * 30,
        warningThresholdDays: warningValue * 30,
        isActive: group.isActive,
      });
    }

    setSavingConfig(true);
    setError(null);
    try {
      await upsertShelfLifeConfigs({ items: payloadGroups });
      router.push("/expired-alert/config");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan konfigurasi";
      setError(message);
    } finally {
      setSavingConfig(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">
          {isEditMode ? "Edit Konfigurasi Group Shelf Life" : "Tambah Konfigurasi Group Shelf Life"}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Shelf life dan warning threshold diisi manual dalam bulan. Semua field wajib terisi sebelum disimpan.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-dark-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Group Parameter Shelf Life</h2>
          {!isEditMode && <Button size="sm" variant="outline" onClick={addGroup}>Tambah Group</Button>}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Memuat konfigurasi...</p>
        ) : (
          <div className="space-y-4">
            {groups.map((group, index) => (
              <div key={group.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Group {groupNumberOffset + index}</p>
                  <label className="flex items-center gap-2 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={group.isActive}
                      onChange={(e) => updateGroup(group.id, { isActive: e.target.checked })}
                    />
                    Active
                  </label>
                </div>

                <div className="mb-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Shelf Life (bulan)</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={group.shelfLifeMonths}
                      onChange={(e) => updateGroup(group.id, { shelfLifeMonths: e.target.value })}
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm dark:bg-dark-section ${
                        group.shelfLifeMonths !== "" && !isPositiveInteger(group.shelfLifeMonths)
                          ? "border-red-300"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    />
                    {group.shelfLifeMonths !== "" && !isPositiveInteger(group.shelfLifeMonths) && (
                      <p className="mt-1 text-xs text-red-600">Harus angka bulat positif.</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Warning Threshold (bulan)</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={group.warningThresholdMonths}
                      onChange={(e) => updateGroup(group.id, { warningThresholdMonths: e.target.value })}
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm dark:bg-dark-section ${
                        (group.warningThresholdMonths !== "" && !isPositiveInteger(group.warningThresholdMonths)) ||
                        (isPositiveInteger(group.warningThresholdMonths) &&
                          isPositiveInteger(group.shelfLifeMonths) &&
                          Number(group.warningThresholdMonths) >= Number(group.shelfLifeMonths))
                          ? "border-red-300"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    />
                    {group.warningThresholdMonths !== "" && !isPositiveInteger(group.warningThresholdMonths) && (
                      <p className="mt-1 text-xs text-red-600">Harus angka bulat positif.</p>
                    )}
                    {isPositiveInteger(group.warningThresholdMonths) &&
                      isPositiveInteger(group.shelfLifeMonths) &&
                      Number(group.warningThresholdMonths) >= Number(group.shelfLifeMonths) && (
                        <p className="mt-1 text-xs text-red-600">Harus lebih kecil dari shelf life.</p>
                      )}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500">Species (checkbox)</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {species.map((s) => {
                      const checked = group.speciesIds.includes(s.speciesId);
                      return (
                        <label key={`${group.id}-${s.speciesId}`} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSpecies(group.id, s.speciesId)}
                          />
                          <span className="text-gray-800 dark:text-gray-200">
                            {s.speciesCode} - {s.speciesName}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button onClick={handleSaveConfig} disabled={savingConfig || loading}>
            {savingConfig ? "Menyimpan..." : "Simpan"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/expired-alert/config")}>
            Batal
          </Button>
        </div>
      </section>
    </div>
  );
}
