"use client";

import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import ColdStorageModuleNav from "@/components/cold-storage/ColdStorageModuleNav";
import { getStorageModuleAllowedRoles, isRoleAllowedForStoragePath } from "@/lib/rbac";

type Props = {
  children: React.ReactNode;
};

/** Route guard saja (tanpa AppShell) — untuk halaman yang sudah punya layout sendiri. */
export function ColdStoragePageGuard({ children }: Props) {
  const pathname = usePathname();

  return (
    <ProtectedRoute
      allowedRoles={getStorageModuleAllowedRoles()}
      authorize={(role) => isRoleAllowedForStoragePath(role, pathname)}
    >
      {children}
    </ProtectedRoute>
  );
}

export default function ColdStorageModuleShell({ children }: Props) {
  const pathname = usePathname();

  return (
    <ProtectedRoute
      allowedRoles={getStorageModuleAllowedRoles()}
      authorize={(role) => isRoleAllowedForStoragePath(role, pathname)}
    >
      <AppShell>
        <div className="space-y-6">
          <ColdStorageModuleNav />
          {children}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
