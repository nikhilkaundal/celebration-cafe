"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/orders");
  }, [router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center text-charcoal/60">
      <p className="text-sm font-medium">Redirecting to Live Orders Dashboard…</p>
    </div>
  );
}
