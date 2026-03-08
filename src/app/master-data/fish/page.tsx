"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import MasterDataShell, {
  type EntityConfig,
} from "@/components/master-data/MasterDataShell";
import {
  mockFishSku,
  mockFishSpecies,
  mockFishForm,
  mockFishGrade,
  mockPackagingType,
} from "@/lib/mock-data";

/* ── Entity configurations ─────────────────────────────────────── */

const fishSkuEntity: EntityConfig = {
  key: "fish-sku",
  label: "Fish SKU",
  codeField: "skuCode",
  nameField: "speciesName",
  columns: [
    { key: "skuCode", label: "Kode SKU" },
    { key: "speciesName", label: "Species" },
    { key: "formName", label: "Bentuk" },
    { key: "gradeName", label: "Grade" },
    { key: "packagingName", label: "Packaging" },
    { key: "minWeightKg", label: "Min Berat (kg)" },
    { key: "maxWeightKg", label: "Max Berat (kg)" },
    { key: "defaultShelfLifeDays", label: "Shelf Life (hari)" },
    { key: "defaultStorageTempC", label: "Suhu (°C)" },
    { key: "isActive", label: "Status" },
  ],
  data: mockFishSku,
  filterFields: [
    {
      key: "speciesName",
      label: "Species",
      type: "select",
      options: mockFishSpecies.map((s) => ({
        value: s.speciesName,
        label: s.speciesName,
      })),
    },
    {
      key: "formName",
      label: "Bentuk",
      type: "select",
      options: mockFishForm.map((f) => ({
        value: f.formName,
        label: f.formName,
      })),
    },
    {
      key: "gradeName",
      label: "Grade",
      type: "select",
      options: mockFishGrade.map((g) => ({
        value: g.gradeName,
        label: g.gradeName,
      })),
    },
    {
      key: "packagingName",
      label: "Packaging",
      type: "select",
      options: mockPackagingType.map((p) => ({
        value: p.packagingName,
        label: p.packagingName,
      })),
    },
    { key: "minWeightKg", label: "Min Berat (kg)", type: "number" },
    { key: "maxWeightKg", label: "Max Berat (kg)", type: "number" },
    { key: "defaultShelfLifeDays", label: "Shelf Life (hari)", type: "number" },
    { key: "defaultStorageTempC", label: "Suhu (°C)", type: "number" },
    { key: "isActive", label: "Status", type: "boolean" },
  ],
};

const speciesEntity: EntityConfig = {
  key: "species",
  label: "Species",
  codeField: "speciesCode",
  nameField: "speciesName",
  columns: [
    { key: "speciesCode", label: "Kode Species" },
    { key: "speciesName", label: "Nama Species" },
    { key: "isActive", label: "Status" },
  ],
  data: mockFishSpecies,
  filterFields: [
    { key: "speciesCode", label: "Kode", type: "text" },
    { key: "speciesName", label: "Nama", type: "text" },
    { key: "isActive", label: "Status", type: "boolean" },
  ],
};

const formEntity: EntityConfig = {
  key: "form",
  label: "Form",
  codeField: "formCode",
  nameField: "formName",
  columns: [
    { key: "formCode", label: "Kode Form" },
    { key: "formName", label: "Nama Form" },
    { key: "isActive", label: "Status" },
  ],
  data: mockFishForm,
  filterFields: [
    { key: "formCode", label: "Kode", type: "text" },
    { key: "formName", label: "Nama", type: "text" },
    { key: "isActive", label: "Status", type: "boolean" },
  ],
};

const gradeEntity: EntityConfig = {
  key: "grade",
  label: "Grade",
  codeField: "gradeCode",
  nameField: "gradeName",
  columns: [
    { key: "gradeCode", label: "Kode Grade" },
    { key: "gradeName", label: "Nama Grade" },
    { key: "isActive", label: "Status" },
  ],
  data: mockFishGrade,
  filterFields: [
    { key: "gradeCode", label: "Kode", type: "text" },
    { key: "gradeName", label: "Nama", type: "text" },
    { key: "isActive", label: "Status", type: "boolean" },
  ],
};

const packagingEntity: EntityConfig = {
  key: "packaging",
  label: "Packaging",
  codeField: "packagingCode",
  nameField: "packagingName",
  columns: [
    { key: "packagingCode", label: "Kode Packaging" },
    { key: "packagingName", label: "Nama Packaging" },
    { key: "isActive", label: "Status" },
  ],
  data: mockPackagingType,
  filterFields: [
    { key: "packagingCode", label: "Kode", type: "text" },
    { key: "packagingName", label: "Nama", type: "text" },
    { key: "isActive", label: "Status", type: "boolean" },
  ],
};

/* ── Page ───────────────────────────────────────────────────────── */

export default function FishMasterDataPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <MasterDataShell
          title="Data Ikan"
          subtitle="Kelola master data ikan — SKU, species, bentuk, grade, dan packaging"
          entities={[
            fishSkuEntity,
            speciesEntity,
            formEntity,
            gradeEntity,
            packagingEntity,
          ]}
        />
      </AppShell>
    </ProtectedRoute>
  );
}
