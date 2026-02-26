/** Roles matching the backend enum */
export type UserRole =
  | "SUPERADMIN"
  | "WAREHOUSE_ADMIN"
  | "BOARD_DIRECTORS"
  | "QC_SPECIALIST"
  | "GUEST"
  | "MARKETING_STAFF"
  | "WAREHOUSE_STAFF";

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: "SUPERADMIN", label: "Superadmin" },
  { value: "WAREHOUSE_ADMIN", label: "Warehouse Admin" },
  { value: "BOARD_DIRECTORS", label: "Board Directors" },
  { value: "QC_SPECIALIST", label: "QC Specialist" },
  { value: "GUEST", label: "Guest" },
  { value: "MARKETING_STAFF", label: "Marketing Staff" },
  { value: "WAREHOUSE_STAFF", label: "Warehouse Staff" },
];

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UpdateRolePayload {
  role: string;
}
