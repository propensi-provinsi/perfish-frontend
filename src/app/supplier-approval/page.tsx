"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Persetujuan supplier sekarang hanya dari Master Data Supplier. Redirect ke sana. */
export default function SupplierApprovalPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/master-data/suppliers");
  }, [router]);
  return (
    <div className="flex items-center justify-center min-h-[200px] text-gray-500 dark:text-gray-400">
      Mengalihkan ke Master Data Supplier…
    </div>
  );
}
