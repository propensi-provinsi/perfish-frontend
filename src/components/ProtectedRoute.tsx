"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { UserRole } from "@/types";

interface Props {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
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

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-6xl font-bold text-red-500">403</h1>
        <p className="text-xl text-gray-600">Access Denied</p>
        <p className="text-gray-400">
          You don&apos;t have permission to view this page.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
