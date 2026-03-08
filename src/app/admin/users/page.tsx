"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirect old /admin/users → /master-data/users */
export default function AdminUsersRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/master-data/users");
  }, [router]);
  return null;
}
