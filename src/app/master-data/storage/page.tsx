"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import MasterDataShell, {
  type EntityConfig,
} from "@/components/master-data/MasterDataShell";
import {
  useBranch,
  useColdStorage,
  useStorageBlock,
  useStorageRack,
  useStoragePosition,
} from "@/hooks/useColdStorageMaster";
import { useFishSpecies } from "@/hooks/useFishMaster";

/* ── Page ───────────────────────────────────────────────────────── */

export default function StorageMasterDataPage() {
  const branch      = useBranch();
  const storage     = useColdStorage();
  const block       = useStorageBlock();
  const rack        = useStorageRack();
  const position    = useStoragePosition();
  const fishSpecies = useFishSpecies(); // for block form species multiselect

  /* ── Branch ─────────────────────────────────────────────────── */
  const branchEntity: EntityConfig = {
    key:       "branch",
    label:     "Branch",
    idField:   "branchId",
    codeField: "branchCode",
    nameField: "branchName",
    columns: [
      { key: "branchCode", label: "Kode Branch" },
      { key: "branchName", label: "Nama Branch" },
      { key: "isActive",   label: "Status" },
    ],
    data:    branch.data,
    loading: branch.loading,
    isMock:  branch.isMock,
    error:   branch.error,
    filterFields: [
      { key: "branchCode", label: "Kode",   type: "text" },
      { key: "branchName", label: "Nama",   type: "text" },
      { key: "isActive",   label: "Status", type: "boolean" },
    ],
    formFields: [
      { key: "branchCode", label: "Kode Branch", type: "text", required: true, placeholder: "BR-001" },
      { key: "branchName", label: "Nama Branch", type: "text", required: true, placeholder: "Cabang Muara Baru" },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => branch.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => branch.update(Number(id), data as any),
    onDelete: (id) => branch.remove(Number(id)),
  };

  /* ── Cold Storage ───────────────────────────────────────────── */
  const coldStorageEntity: EntityConfig = {
    key:       "cold-storage",
    label:     "Cold Storage",
    idField:   "coldStorageId",
    codeField: "csCode",
    nameField: "csName",
    columns: [
      { key: "csCode",      label: "Kode CS" },
      { key: "csName",      label: "Nama Cold Storage" },
      { key: "branchName",  label: "Branch" },
      { key: "isActive",    label: "Status" },
    ],
    data:    storage.data,
    loading: storage.loading,
    isMock:  storage.isMock,
    error:   storage.error,
    filterFields: [
      { key: "csCode",   label: "Kode",   type: "text" },
      { key: "csName",   label: "Nama",   type: "text" },
      {
        key: "branchName", label: "Branch", type: "select",
        options: branch.data.map((b) => ({ value: b.branchName, label: b.branchName })),
      },
      { key: "isActive", label: "Status", type: "boolean" },
    ],
    formFields: [
      {
        key: "branchId", label: "Branch", type: "select", required: true,
        options: branch.data.filter((b) => b.isActive).map((b) => ({ value: b.branchId, label: b.branchName })),
      },
      { key: "csCode", label: "Kode Cold Storage", type: "text", required: true, placeholder: "CS-001" },
      { key: "csName", label: "Nama Cold Storage", type: "text", required: true, placeholder: "Cold Storage Utama" },
    ],
    getFormData: (row) => ({
      branchId: row.branchId,
      csCode:   row.csCode,
      csName:   row.csName,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => storage.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => storage.update(Number(id), data as any),
    onDelete: (id) => storage.remove(Number(id)),
  };

  /* ── Storage Block ──────────────────────────────────────────── */
  const blockEntity: EntityConfig = {
    key:       "block",
    label:     "Block",
    idField:   "blockId",
    codeField: "blockCode",
    nameField: "blockName",
    columns: [
      { key: "blockCode",    label: "Kode Block" },
      { key: "blockName",    label: "Nama Block" },
      { key: "csName",       label: "Cold Storage" },
      { key: "species",      label: "Species" },   // renders as tag cloud
      { key: "blockOwner",   label: "Owner" },
      { key: "blockCapacity",label: "Kapasitas (rak)" },
      { key: "isActive",     label: "Status" },
    ],
    data:    block.data,
    loading: block.loading,
    isMock:  block.isMock,
    error:   block.error,
    filterFields: [
      { key: "blockCode",  label: "Kode",         type: "text" },
      { key: "blockName",  label: "Nama",         type: "text" },
      {
        key: "csName", label: "Cold Storage", type: "select",
        options: storage.data.map((cs) => ({ value: cs.csName, label: cs.csName })),
      },
      { key: "blockOwner",    label: "Owner",      type: "text" },
      { key: "blockCapacity", label: "Kapasitas",  type: "number" },
      { key: "isActive",      label: "Status",     type: "boolean" },
    ],
    formFields: [
      {
        key: "coldStorageId", label: "Cold Storage", type: "select", required: true,
        options: storage.data.filter((cs) => cs.isActive).map((cs) => ({ value: cs.coldStorageId, label: cs.csName })),
      },
      {
        key: "speciesIds", label: "Species", type: "multiselect", required: true,
        options: fishSpecies.data.filter((s) => s.isActive).map((s) => ({ value: s.speciesId, label: s.speciesName })),
      },
      { key: "blockCode",     label: "Kode Block",       type: "text",   required: true, placeholder: "BL-001" },
      { key: "blockName",     label: "Nama Block",       type: "text",   required: true, placeholder: "Block A" },
      { key: "blockOwner",    label: "Owner / Penyewa",  type: "text",   placeholder: "PT Contoh" },
      { key: "blockCapacity", label: "Kapasitas (rak)",  type: "number", required: true, min: 1 },
    ],
    getFormData: (row) => ({
      coldStorageId: row.coldStorageId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      speciesIds:    (row.species as any[])?.map((s: { speciesId: number }) => s.speciesId) ?? [],
      blockCode:     row.blockCode,
      blockName:     row.blockName,
      blockOwner:    row.blockOwner,
      blockCapacity: row.blockCapacity,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => block.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => block.update(Number(id), data as any),
    onDelete: (id) => block.remove(Number(id)),
  };

  /* ── Storage Rack ───────────────────────────────────────────── */
  const rackEntity: EntityConfig = {
    key:       "rack",
    label:     "Rack",
    idField:   "rackId",
    codeField: "rackCode",
    nameField: "blockName",
    columns: [
      { key: "rackCode",  label: "Kode Rack" },
      { key: "blockName", label: "Block" },
      { key: "isActive",  label: "Status" },
    ],
    data:    rack.data,
    loading: rack.loading,
    isMock:  rack.isMock,
    error:   rack.error,
    filterFields: [
      { key: "rackCode", label: "Kode", type: "text" },
      {
        key: "blockName", label: "Block", type: "select",
        options: [...new Set(block.data.map((b) => b.blockName))].map(
          (n) => ({ value: n, label: n })
        ),
      },
      { key: "isActive", label: "Status", type: "boolean" },
    ],
    formFields: [
      {
        key: "blockId", label: "Block", type: "select", required: true,
        options: block.data.filter((b) => b.isActive).map((b) => ({ value: b.blockId, label: `${b.blockCode} — ${b.blockName}` })),
      },
      { key: "rackCode", label: "Kode Rack", type: "text", required: true, placeholder: "RK-001" },
    ],
    getFormData: (row) => ({
      blockId:  row.blockId,
      rackCode: row.rackCode,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => rack.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => rack.update(Number(id), data as any),
    onDelete: (id) => rack.remove(Number(id)),
  };

  /* ── Storage Position ───────────────────────────────────────── */
  const positionEntity: EntityConfig = {
    key:       "position",
    label:     "Position",
    idField:   "positionId",
    codeField: "positionCode",
    nameField: "rackCode",
    columns: [
      { key: "positionCode", label: "Kode Position" },
      { key: "rackCode",     label: "Rack" },
      { key: "status",       label: "Status" },
    ],
    data:    position.data,
    loading: position.loading,
    isMock:  position.isMock,
    error:   position.error,
    filterFields: [
      { key: "positionCode", label: "Kode", type: "text" },
      {
        key: "rackCode", label: "Rack", type: "select",
        options: rack.data.map((r) => ({ value: r.rackCode, label: r.rackCode })),
      },
      {
        key: "status", label: "Status Posisi", type: "select",
        options: [
          { value: "AVAILABLE",   label: "Available" },
          { value: "OCCUPIED",    label: "Occupied" },
          { value: "RESERVED",    label: "Reserved" },
          { value: "MAINTENANCE", label: "Maintenance" },
        ],
      },
    ],
    formFields: [
      {
        key: "rackId", label: "Rack", type: "select", required: true,
        options: rack.data.filter((r) => r.isActive).map((r) => ({ value: r.rackId, label: r.rackCode })),
      },
      { key: "positionCode", label: "Kode Posisi", type: "text", required: true, placeholder: "P-001" },
      {
        key: "status", label: "Status Posisi", type: "select", required: true,
        options: [
          { value: "AVAILABLE",   label: "Available" },
          { value: "OCCUPIED",    label: "Occupied" },
          { value: "RESERVED",    label: "Reserved" },
          { value: "MAINTENANCE", label: "Maintenance" },
        ],
      },
    ],
    getFormData: (row) => ({
      rackId:       row.rackId,
      positionCode: row.positionCode,
      status:       row.status,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreate: (data) => position.create(data as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (id, data) => position.update(Number(id), data as any),
    onDelete: (id) => position.remove(Number(id)),
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <MasterDataShell
          title="Cold Storage"
          subtitle="Kelola master data cold storage — branch, gudang, block, rack, dan position"
          entities={[
            branchEntity,
            coldStorageEntity,
            blockEntity,
            rackEntity,
            positionEntity,
          ]}
        />
      </AppShell>
    </ProtectedRoute>
  );
}
