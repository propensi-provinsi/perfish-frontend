"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  getFishSpecies,
  upsertShelfLifeConfigs,
} from "@/lib/expiry";
import type { FishSpeciesData } from "@/types";

type ConfigGroup = {
  id: string;
  shelfLifeMonths: number;
  warningThresholdMonths: number;
  speciesIds: number[];
  isActive: boolean;
};

export default function ExpiryShelfLifeConfigEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [species, setSpecies] = useState<FishSpeciesData[]>([]);
  const [groups, setGroups] = useState<ConfigGroup[]>([]);

  const isEditMode = searchParams.get("mode") === "edit";

  const loadEditorData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const speciesData = await getFishSpecies();

      const speciesIds = (searchParams.get("speciesIds") ?? "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0);

      const shelfLifeMonths = Number(searchParams.get("shelfLifeMonths") ?? "12");
      const warningThresholdMonths = Number(
        searchParams.get("warningThresholdMonths") ?? String(Math.max(1, Math.floor(shelfLifeMonths / 2)))
      );
      const isActive = searchParams.get("isActive") !== "false";

      setSpecies(speciesData);
      setGroups([
        {
          id: isEditMode ? `edit-${speciesIds.join("-") || "group"}` : `new-${Date.now()}`,
          shelfLifeMonths: Number.isFinite(shelfLifeMonths) && shelfLifeMonths > 0 ? shelfLifeMonths : 12,
          warningThresholdMonths:
            Number.isFinite(warningThresholdMonths) && warningThresholdMonths > 0
              ? warningThresholdMonths
              : Math.max(1, Math.floor((Number.isFinite(shelfLifeMonths) && shelfLifeMonths > 0 ? shelfLifeMonths : 12) / 2)),
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
        shelfLifeMonths: 12,
        warningThresholdMonths: 6,
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
    const payloadGroups = groups
      .map((g) => ({
        speciesIds: Array.from(new Set(g.speciesIds)).sort((a, b) => a - b),
        defaultShelfLifeDays: Number(g.shelfLifeMonths) * 30,
        warningThresholdDays: Number(g.warningThresholdMonths) * 30,
        isActive: g.isActive,
      }))
      .filter((g) => g.speciesIds.length > 0);

    if (payloadGroups.length === 0) {
      setError("Minimal satu group konfigurasi dengan species terpilih diperlukan.");
      return;
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
          Shelf life diatur dalam bulan. Warning threshold dihitung otomatis sebesar setengah dari shelf life.
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
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Group {index + 1}</p>
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
                      value={group.shelfLifeMonths}
                      onChange={(e) => updateGroup(group.id, { shelfLifeMonths: Number(e.target.value) || 1 })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Warning Threshold (bulan)</label>
                    <input
                      type="number"
                      min={1}
                      value={group.warningThresholdMonths}
                      onChange={(e) => updateGroup(group.id, { warningThresholdMonths: Number(e.target.value) || 1 })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-dark-section"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Default disarankan: {Math.max(1, Math.floor(group.shelfLifeMonths / 2))} bulan.
                    </p>
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
            {savingConfig ? "Menyimpan..." : "Save"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/expired-alert/config")}>
            Batal
          </Button>
        </div>
      </section>
    </div>
  );
}
