"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import MasterDataShell, {
  type EntityConfig,
} from "@/components/master-data/MasterDataShell";
import {
  useFishSpecies,
  useFishForm,
  useFishGrade,
  usePackagingType,
  useFishSku,
} from "@/hooks/useFishMaster";

/* ── Page ───────────────────────────────────────────────────────── */

export default function FishMasterDataPage() {
  const species   = useFishSpecies();
  const form      = useFishForm();
  const grade     = useFishGrade();
  const packaging = usePackagingType();
  const sku       = useFishSku();

  /* ── Species ────────────────────────────────────────────────── */
  const speciesEntity: EntityConfig = {
    key:       "species",
    label:     "Species",
    idField:   "speciesId",
    codeField: "speciesCode",
    nameField: "speciesName",
    columns: [
      { key: "speciesCode", label: "Kode Species" },
      { key: "speciesName", label: "Nama Species" },
      { key: "isActive",    label: "Status" },
    ],
    data:    species.data,
    loading: species.loading,
    isMock:  species.isMock,
    error:   species.error,
    filterFields: [
      { key: "speciesCode", label: "Kode",   type: "text" },
      { key: "speciesName", label: "Nama",   type: "text" },
      { key: "isActive",    label: "Status", type: "boolean" },
    ],
    formFields: [
      { key: "speciesCode", label: "Kode Species", type: "text", required: true, placeholder: "SP-001" },
      { key: "speciesName", label: "Nama Species", type: "text", required: true, placeholder: "Cakalang" },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate:  (data) => species.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate:  (id, data) => species.update(Number(id), data as any),
    onDelete:  (id) => species.remove(Number(id)),
  };

  /* ── Form ───────────────────────────────────────────────────── */
  const formEntity: EntityConfig = {
    key:       "form",
    label:     "Form",
    idField:   "formId",
    codeField: "formCode",
    nameField: "formName",
    columns: [
      { key: "formCode", label: "Kode Form" },
      { key: "formName", label: "Nama Form" },
      { key: "isActive", label: "Status" },
    ],
    data:    form.data,
    loading: form.loading,
    isMock:  form.isMock,
    error:   form.error,
    filterFields: [
      { key: "formCode", label: "Kode",   type: "text" },
      { key: "formName", label: "Nama",   type: "text" },
      { key: "isActive", label: "Status", type: "boolean" },
    ],
    formFields: [
      { key: "formCode", label: "Kode Form",  type: "text", required: true, placeholder: "FM-001" },
      { key: "formName", label: "Nama Form",  type: "text", required: true, placeholder: "Fillet" },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => form.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => form.update(Number(id), data as any),
    onDelete: (id) => form.remove(Number(id)),
  };

  /* ── Grade ──────────────────────────────────────────────────── */
  const gradeEntity: EntityConfig = {
    key:       "grade",
    label:     "Grade",
    idField:   "gradeId",
    codeField: "gradeCode",
    nameField: "gradeName",
    columns: [
      { key: "gradeCode", label: "Kode Grade" },
      { key: "gradeName", label: "Nama Grade" },
      { key: "isActive",  label: "Status" },
    ],
    data:    grade.data,
    loading: grade.loading,
    isMock:  grade.isMock,
    error:   grade.error,
    filterFields: [
      { key: "gradeCode", label: "Kode",   type: "text" },
      { key: "gradeName", label: "Nama",   type: "text" },
      { key: "isActive",  label: "Status", type: "boolean" },
    ],
    formFields: [
      { key: "gradeCode", label: "Kode Grade", type: "text", required: true, placeholder: "GR-001" },
      { key: "gradeName", label: "Nama Grade", type: "text", required: true, placeholder: "Premium" },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => grade.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => grade.update(Number(id), data as any),
    onDelete: (id) => grade.remove(Number(id)),
  };

  /* ── Packaging ──────────────────────────────────────────────── */
  const packagingEntity: EntityConfig = {
    key:       "packaging",
    label:     "Packaging",
    idField:   "packagingTypeId",
    codeField: "packagingCode",
    nameField: "packagingName",
    columns: [
      { key: "packagingCode", label: "Kode Packaging" },
      { key: "packagingName", label: "Nama Packaging" },
      { key: "isActive",      label: "Status" },
    ],
    data:    packaging.data,
    loading: packaging.loading,
    isMock:  packaging.isMock,
    error:   packaging.error,
    filterFields: [
      { key: "packagingCode", label: "Kode",   type: "text" },
      { key: "packagingName", label: "Nama",   type: "text" },
      { key: "isActive",      label: "Status", type: "boolean" },
    ],
    formFields: [
      { key: "packagingCode", label: "Kode Packaging", type: "text", required: true, placeholder: "PK-001" },
      { key: "packagingName", label: "Nama Packaging", type: "text", required: true, placeholder: "Box 5kg" },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => packaging.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => packaging.update(Number(id), data as any),
    onDelete: (id) => packaging.remove(Number(id)),
  };

  /* ── Fish SKU ───────────────────────────────────────────────── */
  const skuEntity: EntityConfig = {
    key:       "fish-sku",
    label:     "Fish SKU",
    idField:   "skuId",
    codeField: "skuCode",
    nameField: "speciesName",
    columns: [
      { key: "skuCode",              label: "Kode SKU" },
      { key: "speciesName",          label: "Species" },
      { key: "formName",             label: "Bentuk" },
      { key: "gradeName",            label: "Grade" },
      { key: "packagingName",        label: "Packaging" },
      { key: "minWeightKg",          label: "Min Berat (kg)" },
      { key: "maxWeightKg",          label: "Max Berat (kg)" },
      { key: "defaultShelfLifeDays", label: "Shelf Life (hari)" },
      { key: "defaultStorageTempC",  label: "Suhu (°C)" },
      { key: "isActive",             label: "Status" },
    ],
    data:    sku.data,
    loading: sku.loading,
    isMock:  sku.isMock,
    error:   sku.error,
    filterFields: [
      {
        key: "speciesName", label: "Species", type: "select",
        options: species.data.map((s) => ({ value: s.speciesName, label: s.speciesName })),
      },
      {
        key: "formName", label: "Bentuk", type: "select",
        options: form.data.map((f) => ({ value: f.formName, label: f.formName })),
      },
      {
        key: "gradeName", label: "Grade", type: "select",
        options: grade.data.map((g) => ({ value: g.gradeName, label: g.gradeName })),
      },
      {
        key: "packagingName", label: "Packaging", type: "select",
        options: packaging.data.map((p) => ({ value: p.packagingName, label: p.packagingName })),
      },
      { key: "minWeightKg",          label: "Min Berat (kg)",     type: "number" },
      { key: "maxWeightKg",          label: "Max Berat (kg)",     type: "number" },
      { key: "defaultShelfLifeDays", label: "Shelf Life (hari)",  type: "number" },
      { key: "defaultStorageTempC",  label: "Suhu Simpan (°C)",   type: "number" },
      { key: "isActive",             label: "Status",             type: "boolean" },
    ],
    formFields: [
      { key: "skuCode", label: "Kode SKU", type: "text", required: true, placeholder: "SKU-001" },
      {
        key: "speciesId", label: "Species", type: "select", required: true,
        options: species.data.filter((s) => s.isActive).map((s) => ({ value: s.speciesId, label: s.speciesName })),
      },
      {
        key: "formId", label: "Bentuk", type: "select", required: true,
        options: form.data.filter((f) => f.isActive).map((f) => ({ value: f.formId, label: f.formName })),
      },
      {
        key: "gradeId", label: "Grade", type: "select", required: true,
        options: grade.data.filter((g) => g.isActive).map((g) => ({ value: g.gradeId, label: g.gradeName })),
      },
      {
        key: "packagingTypeId", label: "Packaging", type: "select", required: true,
        options: packaging.data.filter((p) => p.isActive).map((p) => ({ value: p.packagingTypeId, label: p.packagingName })),
      },
      { key: "minWeightKg",          label: "Min Berat (kg)",         type: "number", required: true, min: 0,    step: 0.01 },
      { key: "maxWeightKg",          label: "Max Berat (kg)",         type: "number", required: true, min: 0,    step: 0.01 },
      { key: "defaultShelfLifeDays", label: "Shelf Life (hari)",      type: "number", required: true, min: 1 },
      { key: "defaultStorageTempC",  label: "Suhu Simpan (°C)",       type: "number", required: true, step: 0.5 },
    ],
    getFormData: (row) => ({
      skuCode:              row.skuCode,
      speciesId:            row.speciesId,
      formId:               row.formId,
      gradeId:              row.gradeId,
      packagingTypeId:      row.packagingTypeId,
      minWeightKg:          row.minWeightKg,
      maxWeightKg:          row.maxWeightKg,
      defaultShelfLifeDays: row.defaultShelfLifeDays,
      defaultStorageTempC:  row.defaultStorageTempC,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => sku.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => sku.update(Number(id), data as any),
    onDelete: (id) => sku.remove(Number(id)),
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <MasterDataShell
          title="Data Ikan"
          subtitle="Kelola master data ikan — SKU, species, bentuk, grade, dan packaging"
          entities={[
            skuEntity,
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
