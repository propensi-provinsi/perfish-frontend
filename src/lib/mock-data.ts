/* ================================================================
   Mock Data — Fish Domain & Cold Storage Domain
   Akan diganti dengan API call ke backend saat integrasi.
   ================================================================ */

// ── Fish Domain ──────────────────────────────────────────────────

export interface MockFishSpecies {
  speciesCode: string;
  speciesName: string;
  isActive: boolean;
}

export const mockFishSpecies: MockFishSpecies[] = [
  { speciesCode: "SP-001", speciesName: "Cakalang", isActive: true },
  { speciesCode: "SP-002", speciesName: "Tuna Sirip Kuning", isActive: true },
  { speciesCode: "SP-003", speciesName: "Kakap Merah", isActive: true },
  { speciesCode: "SP-004", speciesName: "Tongkol", isActive: true },
  { speciesCode: "SP-005", speciesName: "Bandeng", isActive: true },
  { speciesCode: "SP-006", speciesName: "Tenggiri", isActive: false },
  { speciesCode: "SP-007", speciesName: "Kerapu", isActive: true },
  { speciesCode: "SP-008", speciesName: "Baronang", isActive: true },
];

export interface MockFishForm {
  formCode: string;
  formName: string;
  isActive: boolean;
}

export const mockFishForm: MockFishForm[] = [
  { formCode: "FRM-001", formName: "Whole", isActive: true },
  { formCode: "FRM-002", formName: "Fillet", isActive: true },
  { formCode: "FRM-003", formName: "Headless", isActive: true },
  { formCode: "FRM-004", formName: "Steak", isActive: true },
  { formCode: "FRM-005", formName: "Loin", isActive: true },
];

export interface MockFishGrade {
  gradeCode: string;
  gradeName: string;
  isActive: boolean;
}

export const mockFishGrade: MockFishGrade[] = [
  { gradeCode: "GR-A", gradeName: "Grade A", isActive: true },
  { gradeCode: "GR-B", gradeName: "Grade B", isActive: true },
  { gradeCode: "GR-C", gradeName: "Grade C", isActive: true },
  { gradeCode: "GR-P", gradeName: "Premium", isActive: true },
];

export interface MockPackagingType {
  packagingCode: string;
  packagingName: string;
  isActive: boolean;
}

export const mockPackagingType: MockPackagingType[] = [
  { packagingCode: "PKG-001", packagingName: "Vacuum Pack", isActive: true },
  { packagingCode: "PKG-002", packagingName: "Box", isActive: true },
  { packagingCode: "PKG-003", packagingName: "Styrofoam", isActive: true },
  { packagingCode: "PKG-004", packagingName: "Karung", isActive: false },
];

export interface MockFishSku {
  skuCode: string;
  speciesName: string;
  formName: string;
  gradeName: string;
  packagingName: string;
  minWeightKg: number;
  maxWeightKg: number;
  defaultShelfLifeDays: number;
  defaultStorageTempC: number;
  isActive: boolean;
}

export const mockFishSku: MockFishSku[] = [
  {
    skuCode: "SKU-001",
    speciesName: "Cakalang",
    formName: "Whole",
    gradeName: "Grade A",
    packagingName: "Vacuum Pack",
    minWeightKg: 1.0,
    maxWeightKg: 3.0,
    defaultShelfLifeDays: 180,
    defaultStorageTempC: -20,
    isActive: true,
  },
  {
    skuCode: "SKU-002",
    speciesName: "Tuna Sirip Kuning",
    formName: "Fillet",
    gradeName: "Premium",
    packagingName: "Vacuum Pack",
    minWeightKg: 0.5,
    maxWeightKg: 2.0,
    defaultShelfLifeDays: 120,
    defaultStorageTempC: -25,
    isActive: true,
  },
  {
    skuCode: "SKU-003",
    speciesName: "Kakap Merah",
    formName: "Fillet",
    gradeName: "Grade A",
    packagingName: "Box",
    minWeightKg: 0.3,
    maxWeightKg: 1.5,
    defaultShelfLifeDays: 150,
    defaultStorageTempC: -22,
    isActive: true,
  },
  {
    skuCode: "SKU-004",
    speciesName: "Tongkol",
    formName: "Whole",
    gradeName: "Grade B",
    packagingName: "Styrofoam",
    minWeightKg: 0.5,
    maxWeightKg: 2.5,
    defaultShelfLifeDays: 90,
    defaultStorageTempC: -18,
    isActive: true,
  },
  {
    skuCode: "SKU-005",
    speciesName: "Bandeng",
    formName: "Whole",
    gradeName: "Grade A",
    packagingName: "Vacuum Pack",
    minWeightKg: 0.3,
    maxWeightKg: 0.8,
    defaultShelfLifeDays: 120,
    defaultStorageTempC: -20,
    isActive: true,
  },
  {
    skuCode: "SKU-006",
    speciesName: "Cakalang",
    formName: "Loin",
    gradeName: "Premium",
    packagingName: "Vacuum Pack",
    minWeightKg: 0.5,
    maxWeightKg: 2.0,
    defaultShelfLifeDays: 150,
    defaultStorageTempC: -22,
    isActive: true,
  },
  {
    skuCode: "SKU-007",
    speciesName: "Kerapu",
    formName: "Whole",
    gradeName: "Grade A",
    packagingName: "Box",
    minWeightKg: 1.0,
    maxWeightKg: 5.0,
    defaultShelfLifeDays: 180,
    defaultStorageTempC: -20,
    isActive: true,
  },
  {
    skuCode: "SKU-008",
    speciesName: "Tuna Sirip Kuning",
    formName: "Steak",
    gradeName: "Grade A",
    packagingName: "Vacuum Pack",
    minWeightKg: 0.2,
    maxWeightKg: 0.5,
    defaultShelfLifeDays: 90,
    defaultStorageTempC: -25,
    isActive: true,
  },
  {
    skuCode: "SKU-009",
    speciesName: "Tenggiri",
    formName: "Fillet",
    gradeName: "Grade B",
    packagingName: "Styrofoam",
    minWeightKg: 0.5,
    maxWeightKg: 1.5,
    defaultShelfLifeDays: 90,
    defaultStorageTempC: -18,
    isActive: false,
  },
  {
    skuCode: "SKU-010",
    speciesName: "Baronang",
    formName: "Whole",
    gradeName: "Grade C",
    packagingName: "Karung",
    minWeightKg: 0.3,
    maxWeightKg: 1.0,
    defaultShelfLifeDays: 60,
    defaultStorageTempC: -18,
    isActive: true,
  },
];

// ── Cold Storage Domain ──────────────────────────────────────────

export interface MockBranch {
  branchCode: string;
  branchName: string;
  isActive: boolean;
}

export const mockBranch: MockBranch[] = [
  { branchCode: "BR-JKT", branchName: "Jakarta", isActive: true },
  { branchCode: "BR-SBY", branchName: "Surabaya", isActive: true },
  { branchCode: "BR-MKS", branchName: "Makassar", isActive: true },
  { branchCode: "BR-MDN", branchName: "Medan", isActive: true },
  { branchCode: "BR-SMG", branchName: "Semarang", isActive: true },
  { branchCode: "BR-BPN", branchName: "Balikpapan", isActive: false },
];

export interface MockColdStorage {
  csCode: string;
  csName: string;
  branchName: string;
  isActive: boolean;
}

export const mockColdStorage: MockColdStorage[] = [
  { csCode: "CS-JKT-01", csName: "CS Besar Jakarta", branchName: "Jakarta", isActive: true },
  { csCode: "CS-JKT-02", csName: "CS Kecil Jakarta", branchName: "Jakarta", isActive: true },
  { csCode: "CS-SBY-01", csName: "CS Besar Surabaya", branchName: "Surabaya", isActive: true },
  { csCode: "CS-SBY-02", csName: "CS Kecil Surabaya", branchName: "Surabaya", isActive: true },
  { csCode: "CS-MKS-01", csName: "CS Makassar", branchName: "Makassar", isActive: true },
  { csCode: "CS-MDN-01", csName: "CS Medan", branchName: "Medan", isActive: true },
  { csCode: "CS-SMG-01", csName: "CS Semarang", branchName: "Semarang", isActive: true },
];

export interface MockStorageBlock {
  blockCode: string;
  blockName: string;
  coldStorageName: string;
  speciesName: string;
  blockOwner: string;
  blockCapacity: number;
  isActive: boolean;
}

export const mockStorageBlock: MockStorageBlock[] = [
  { blockCode: "BLK-JKT01-A", blockName: "Block A — Cakalang", coldStorageName: "CS Besar Jakarta", speciesName: "Cakalang", blockOwner: "Tim Gudang A", blockCapacity: 20, isActive: true },
  { blockCode: "BLK-JKT01-B", blockName: "Block B — Tuna", coldStorageName: "CS Besar Jakarta", speciesName: "Tuna Sirip Kuning", blockOwner: "Tim Gudang A", blockCapacity: 15, isActive: true },
  { blockCode: "BLK-JKT02-A", blockName: "Block A — Kakap", coldStorageName: "CS Kecil Jakarta", speciesName: "Kakap Merah", blockOwner: "Tim Gudang B", blockCapacity: 10, isActive: true },
  { blockCode: "BLK-SBY01-A", blockName: "Block A — Cakalang", coldStorageName: "CS Besar Surabaya", speciesName: "Cakalang", blockOwner: "Tim Gudang C", blockCapacity: 25, isActive: true },
  { blockCode: "BLK-SBY01-B", blockName: "Block B — Tongkol", coldStorageName: "CS Besar Surabaya", speciesName: "Tongkol", blockOwner: "Tim Gudang C", blockCapacity: 18, isActive: true },
  { blockCode: "BLK-MKS01-A", blockName: "Block A — Bandeng", coldStorageName: "CS Makassar", speciesName: "Bandeng", blockOwner: "Tim Gudang D", blockCapacity: 12, isActive: true },
  { blockCode: "BLK-MDN01-A", blockName: "Block A — Kerapu", coldStorageName: "CS Medan", speciesName: "Kerapu", blockOwner: "Tim Gudang E", blockCapacity: 8, isActive: false },
];

export interface MockStorageRack {
  rackCode: string;
  blockName: string;
  isActive: boolean;
}

export const mockStorageRack: MockStorageRack[] = [
  { rackCode: "RCK-JKT01-A-001", blockName: "Block A — Cakalang", isActive: true },
  { rackCode: "RCK-JKT01-A-002", blockName: "Block A — Cakalang", isActive: true },
  { rackCode: "RCK-JKT01-A-003", blockName: "Block A — Cakalang", isActive: false },
  { rackCode: "RCK-JKT01-B-001", blockName: "Block B — Tuna", isActive: true },
  { rackCode: "RCK-JKT01-B-002", blockName: "Block B — Tuna", isActive: true },
  { rackCode: "RCK-SBY01-A-001", blockName: "Block A — Cakalang", isActive: true },
  { rackCode: "RCK-SBY01-A-002", blockName: "Block A — Cakalang", isActive: true },
  { rackCode: "RCK-SBY01-B-001", blockName: "Block B — Tongkol", isActive: true },
  { rackCode: "RCK-MKS01-A-001", blockName: "Block A — Bandeng", isActive: true },
  { rackCode: "RCK-MDN01-A-001", blockName: "Block A — Kerapu", isActive: true },
];

export interface MockStoragePosition {
  positionCode: string;
  rackCode: string;
  status: string;
}

export const mockStoragePosition: MockStoragePosition[] = [
  { positionCode: "POS-JKT01-A-001-01", rackCode: "RCK-JKT01-A-001", status: "available" },
  { positionCode: "POS-JKT01-A-001-02", rackCode: "RCK-JKT01-A-001", status: "occupied" },
  { positionCode: "POS-JKT01-A-001-03", rackCode: "RCK-JKT01-A-001", status: "occupied" },
  { positionCode: "POS-JKT01-A-002-01", rackCode: "RCK-JKT01-A-002", status: "available" },
  { positionCode: "POS-JKT01-A-002-02", rackCode: "RCK-JKT01-A-002", status: "available" },
  { positionCode: "POS-JKT01-B-001-01", rackCode: "RCK-JKT01-B-001", status: "occupied" },
  { positionCode: "POS-JKT01-B-001-02", rackCode: "RCK-JKT01-B-001", status: "occupied" },
  { positionCode: "POS-SBY01-A-001-01", rackCode: "RCK-SBY01-A-001", status: "available" },
  { positionCode: "POS-SBY01-A-001-02", rackCode: "RCK-SBY01-A-001", status: "occupied" },
  { positionCode: "POS-SBY01-B-001-01", rackCode: "RCK-SBY01-B-001", status: "available" },
];

// ── Outbound Domain ──────────────────────────────────────────────

export interface MockOutboundType {
  outboundTypeCode: string;
  outboundTypeName: string;
  isActive: boolean;
}

export const mockOutboundType: MockOutboundType[] = [
  { outboundTypeCode: "LOKAL",    outboundTypeName: "Distribusi Lokal",      isActive: true },
  { outboundTypeCode: "EKSPOR",   outboundTypeName: "Ekspor Luar Negeri",    isActive: true },
  { outboundTypeCode: "INTERNAL", outboundTypeName: "Transfer Antar Gudang", isActive: true },
];

export interface MockTransportMode {
  modeCode: string;
  modeName: string;
  tempControlRequired: boolean;
  isActive: boolean;
}

export const mockTransportMode: MockTransportMode[] = [
  { modeCode: "SEA",    modeName: "Angkutan Laut",      tempControlRequired: false, isActive: true },
  { modeCode: "AIR",    modeName: "Angkutan Udara",     tempControlRequired: false, isActive: true },
  { modeCode: "ROAD",   modeName: "Angkutan Darat",     tempControlRequired: false, isActive: true },
  { modeCode: "REFSEA", modeName: "Reefer Ship",         tempControlRequired: true,  isActive: true },
  { modeCode: "REFAIR", modeName: "Cargo Berpendingin",  tempControlRequired: true,  isActive: true },
];

export interface MockPort {
  portCode: string;
  portName: string;
  country: string;
  isActive: boolean;
}

export const mockPort: MockPort[] = [
  { portCode: "IDJKT", portName: "Pelabuhan Tanjung Priok", country: "Indonesia", isActive: true },
  { portCode: "IDSBY", portName: "Pelabuhan Tanjung Perak", country: "Indonesia", isActive: true },
  { portCode: "IDMAK", portName: "Pelabuhan Makassar",      country: "Indonesia", isActive: true },
  { portCode: "IDBPN", portName: "Pelabuhan Balikpapan",    country: "Indonesia", isActive: true },
  { portCode: "SGSIN", portName: "Port of Singapore",       country: "Singapore", isActive: true },
  { portCode: "JPOSA", portName: "Port of Osaka",           country: "Japan",     isActive: true },
];

export interface MockExportDocument {
  documentName: string;
  requiresApproval: boolean;
  isActive: boolean;
}

export const mockExportDocument: MockExportDocument[] = [
  { documentName: "Certificate of Origin",     requiresApproval: true,  isActive: true },
  { documentName: "Health Certificate",         requiresApproval: true,  isActive: true },
  { documentName: "Phytosanitary Certificate", requiresApproval: true,  isActive: true },
  { documentName: "Bill of Lading",             requiresApproval: false, isActive: true },
  { documentName: "Packing List",               requiresApproval: false, isActive: true },
  { documentName: "Commercial Invoice",         requiresApproval: false, isActive: true },
  { documentName: "Export Declaration (PEB)",   requiresApproval: true,  isActive: true },
];

export interface MockOutboundChannel {
  channelCode: string;
  channelName: string;
  isExport: boolean;
  outboundTypeCode: string;
  outboundTypeName: string;
  modeCode: string | null;
  modeName: string | null;
  portCode: string | null;
  portName: string | null;
  requiredDocumentNames: string[];
  isActive: boolean;
}

export const mockOutboundChannel: MockOutboundChannel[] = [
  {
    channelCode: "EKS-LAUT-JKT",
    channelName: "Ekspor Laut via Jakarta",
    isExport: true,
    outboundTypeCode: "EKSPOR",
    outboundTypeName: "Ekspor Luar Negeri",
    modeCode: "SEA",
    modeName: "Angkutan Laut",
    portCode: "IDJKT",
    portName: "Pelabuhan Tanjung Priok",
    requiredDocumentNames: ["Certificate of Origin", "Health Certificate", "Bill of Lading"],
    isActive: true,
  },
  {
    channelCode: "EKS-UDARA-JKT",
    channelName: "Ekspor Udara via Jakarta",
    isExport: true,
    outboundTypeCode: "EKSPOR",
    outboundTypeName: "Ekspor Luar Negeri",
    modeCode: "AIR",
    modeName: "Angkutan Udara",
    portCode: "IDJKT",
    portName: "Pelabuhan Tanjung Priok",
    requiredDocumentNames: ["Certificate of Origin", "Packing List"],
    isActive: true,
  },
  {
    channelCode: "LOKAL-DARAT",
    channelName: "Distribusi Lokal Darat",
    isExport: false,
    outboundTypeCode: "LOKAL",
    outboundTypeName: "Distribusi Lokal",
    modeCode: "ROAD",
    modeName: "Angkutan Darat",
    portCode: null,
    portName: null,
    requiredDocumentNames: [],
    isActive: true,
  },
  {
    channelCode: "INTERNAL-JKT",
    channelName: "Transfer Internal Jakarta",
    isExport: false,
    outboundTypeCode: "INTERNAL",
    outboundTypeName: "Transfer Antar Gudang",
    modeCode: null,
    modeName: null,
    portCode: null,
    portName: null,
    requiredDocumentNames: [],
    isActive: true,
  },
];
