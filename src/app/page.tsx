"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/home" : "/login");
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-400 text-sm">Mengarahkan…</p>
    </div>
  );
}
