"use client";
// components/portal/RefreshButton.tsx
// Client component — triggers the intelligence API and reloads when done.
import { useState } from "react";

type Scope = "clinic" | "brand";

export default function RefreshButton({ scope, scopeId }: { scope: Scope; scopeId: string }) {
  const [loading, setLoading]   = useState(false);
  const [lastRun, setLastRun]   = useState<Date | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/intelligence/${scope}/${scopeId}`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setLastRun(new Date());
      // Reload the page so the Server Component re-fetches fresh snapshots.
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={refresh}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition"
        style={{
          background:  loading ? "rgba(124,58,237,.15)" : "#7c3aed",
          color:       loading ? "#7c3aed"              : "#ffffff",
          cursor:      loading ? "not-allowed"          : "pointer",
          fontFamily:  "'IBM Plex Mono', monospace",
          fontSize:    "11px",
          letterSpacing: "0.06em",
        }}
      >
        {loading ? (
          <>
            <span
              style={{
                width: 12, height: 12, border: "2px solid rgba(124,58,237,.4)",
                borderTopColor: "#7c3aed", borderRadius: "50%",
                display: "inline-block", animation: "spin .8s linear infinite",
              }}
            />
            Analyzing…
          </>
        ) : (
          <>↻ Refresh signals</>
        )}
      </button>
      {lastRun && (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#9ca3af" }}>
          refreshed {lastRun.toLocaleTimeString()}
        </span>
      )}
      {error && (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#ef4444" }}>
          {error}
        </span>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
