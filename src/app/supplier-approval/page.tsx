"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirect ke Ringkasan Supplier di Inbound Ikan. */
export default function SupplierApprovalPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/inbound-ikan/ringkasan-supplier");
  }, [router]);
  return (
    <div className="flex items-center justify-center min-h-[200px] text-gray-500 dark:text-gray-400">
      Mengalihkan ke Ringkasan Supplier…
    </div>
  );
}
