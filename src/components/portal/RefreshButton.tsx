"use client";
// components/portal/RefreshButton.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshButton({ scope, scopeId }: { scope: string; scopeId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function refresh() {
    setLoading(true);
    await fetch(`/api/intelligence/${scope}/${scopeId}`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={refresh}
      disabled={loading}
      className="rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-4 py-2 font-[Source_Sans_3] text-sm font-semibold text-white disabled:opacity-40"
    >
      {loading ? "Analyzing signals…" : "Refresh signals"}
    </button>
  );
}
