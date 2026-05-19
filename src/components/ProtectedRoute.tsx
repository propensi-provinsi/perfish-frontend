"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { UserRole } from "@/types";

interface Props {
  children: ReactNode;
  allowedRoles?: UserRole[];
  /** Jika diisi, role harus lolos pengecekan ini (setelah autentikasi). Superadmin selalu lolos. */
  authorize?: (role: UserRole) => boolean;
}

export default function ProtectedRoute({ children, allowedRoles, authorize }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  const role = user.role;
  const superAdmin = role === "SUPERADMIN";
  const deniedByList = allowedRoles && !allowedRoles.includes(role) && !superAdmin;
  const deniedByAuthz = authorize && !authorize(role) && !superAdmin;

  if (deniedByList || deniedByAuthz) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-6xl font-bold text-red">403</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">Akses Ditolak</p>
        <p className="text-gray-400 dark:text-gray-500">
          Anda tidak memiliki izin untuk melihat halaman ini.
        </p>
        <button
          onClick={() => router.push("/home")}
          className="mt-4 rounded-lg bg-cyan px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-hover transition-colors"
        >
          Kembali ke Home
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
