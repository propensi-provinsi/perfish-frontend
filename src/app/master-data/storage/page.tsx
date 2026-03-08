"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import MasterDataShell, {
  type EntityConfig,
} from "@/components/master-data/MasterDataShell";
import {
  mockBranch,
  mockColdStorage,
  mockStorageBlock,
  mockStorageRack,
  mockStoragePosition,
  mockFishSpecies,
} from "@/lib/mock-data";

/* ── Entity configurations ─────────────────────────────────────── */

const branchEntity: EntityConfig = {
  key: "branch",
  label: "Branch",
  codeField: "branchCode",
  nameField: "branchName",
  columns: [
    { key: "branchCode", label: "Kode Branch" },
    { key: "branchName", label: "Nama Branch" },
    { key: "isActive", label: "Status" },
  ],
  data: mockBranch,
  filterFields: [
    { key: "branchCode", label: "Kode", type: "text" },
    { key: "branchName", label: "Nama", type: "text" },
    { key: "isActive", label: "Status", type: "boolean" },
  ],
};

const coldStorageEntity: EntityConfig = {
  key: "cold-storage",
  label: "Cold Storage",
  codeField: "csCode",
  nameField: "csName",
  columns: [
    { key: "csCode", label: "Kode CS" },
    { key: "csName", label: "Nama Cold Storage" },
    { key: "branchName", label: "Branch" },
    { key: "isActive", label: "Status" },
  ],
  data: mockColdStorage,
  filterFields: [
    { key: "csCode", label: "Kode", type: "text" },
    { key: "csName", label: "Nama", type: "text" },
    {
      key: "branchName",
      label: "Branch",
      type: "select",
      options: mockBranch.map((b) => ({
        value: b.branchName,
        label: b.branchName,
      })),
    },
    { key: "isActive", label: "Status", type: "boolean" },
  ],
};

const blockEntity: EntityConfig = {
  key: "block",
  label: "Block",
  codeField: "blockCode",
  nameField: "blockName",
  columns: [
    { key: "blockCode", label: "Kode Block" },
    { key: "blockName", label: "Nama Block" },
    { key: "coldStorageName", label: "Cold Storage" },
    { key: "speciesName", label: "Species" },
    { key: "blockOwner", label: "Owner" },
    { key: "blockCapacity", label: "Kapasitas (rak)" },
    { key: "isActive", label: "Status" },
  ],
  data: mockStorageBlock,
  filterFields: [
    { key: "blockCode", label: "Kode", type: "text" },
    { key: "blockName", label: "Nama", type: "text" },
    {
      key: "coldStorageName",
      label: "Cold Storage",
      type: "select",
      options: mockColdStorage.map((cs) => ({
        value: cs.csName,
        label: cs.csName,
      })),
    },
    {
      key: "speciesName",
      label: "Species",
      type: "select",
      options: mockFishSpecies.map((s) => ({
        value: s.speciesName,
        label: s.speciesName,
      })),
    },
    { key: "blockOwner", label: "Owner", type: "text" },
    { key: "blockCapacity", label: "Kapasitas", type: "number" },
    { key: "isActive", label: "Status", type: "boolean" },
  ],
};

const rackEntity: EntityConfig = {
  key: "rack",
  label: "Rack",
  codeField: "rackCode",
  nameField: "blockName",
  columns: [
    { key: "rackCode", label: "Kode Rack" },
    { key: "blockName", label: "Block" },
    { key: "isActive", label: "Status" },
  ],
  data: mockStorageRack,
  filterFields: [
    { key: "rackCode", label: "Kode", type: "text" },
    {
      key: "blockName",
      label: "Block",
      type: "select",
      options: [...new Set(mockStorageBlock.map((b) => b.blockName))].map(
        (n) => ({ value: n, label: n })
      ),
    },
    { key: "isActive", label: "Status", type: "boolean" },
  ],
};

const positionEntity: EntityConfig = {
  key: "position",
  label: "Position",
  codeField: "positionCode",
  nameField: "rackCode",
  columns: [
    { key: "positionCode", label: "Kode Position" },
    { key: "rackCode", label: "Rack" },
    { key: "status", label: "Status" },
  ],
  data: mockStoragePosition,
  filterFields: [
    { key: "positionCode", label: "Kode", type: "text" },
    {
      key: "rackCode",
      label: "Rack",
      type: "select",
      options: mockStorageRack.map((r) => ({
        value: r.rackCode,
        label: r.rackCode,
      })),
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "available", label: "Available" },
        { value: "occupied", label: "Occupied" },
      ],
    },
  ],
};

/* ── Page ───────────────────────────────────────────────────────── */

export default function StorageMasterDataPage() {
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
