// components/portal/SignalFlowDashboard.tsx
// ----------------------------------------------------------------------------
// Server component — reads the latest intelligence_snapshots for this scope
// and renders four panels: Outcome · Seasonal · Regional · Churn.
// Brands/clinics only ever see AI-shaped aggregates — never raw rows.
//
// Usage (Next.js App Router):
//   import SignalFlowDashboard from "@/components/portal/SignalFlowDashboard";
//   <SignalFlowDashboard scope="brand" scopeId={brandId} />
//
// Usage (TanStack Start / Lovable):
//   Convert to a client component and call GET /api/intelligence/:scope/:id
//   then render the same panels using the `snapshots` payload.
// ----------------------------------------------------------------------------
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import RefreshButton from "./RefreshButton";

type Scope = "clinic" | "brand";

async function latest(scope: Scope, id: string, kind: string) {
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase
    .from("intelligence_snapshots")
    .select("payload, sample_size, generated_at")
    .eq("scope_type", scope)
    .eq("scope_id", id)
    .eq("kind", kind)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export default async function SignalFlowDashboard({
  scope,
  scopeId,
}: {
  scope: Scope;
  scopeId: string;
}) {
  const [outcome, seasonal, regional, churn] = await Promise.all([
    latest(scope, scopeId, "outcome"),
    latest(scope, scopeId, "seasonal"),
    latest(scope, scopeId, "regional"),
    latest(scope, scopeId, "churn"),
  ]);

  const sample = outcome?.sample_size ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1
            className="text-4xl"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: "#7c3aed" }}
          >
            Signal Flow
          </h1>
          <p
            className="text-xs text-neutral-500"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {sample} outcomes analyzed · updated{" "}
            {outcome?.generated_at
              ? new Date(outcome.generated_at).toLocaleDateString()
              : "—"}
          </p>
          {sample < 10 && sample > 0 && (
            <p
              className="mt-1 text-xs text-amber-600"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              ⚠ Directional only — fewer than 10 outcomes recorded
            </p>
          )}
        </div>
        <RefreshButton scope={scope} scopeId={scopeId} />
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── OUTCOME INTELLIGENCE ── */}
        <Panel title="Outcome Intelligence" subtitle="Treatment → Product → Result">
          <Headline text={outcome?.payload?.headline} />
          <ul className="mt-3 space-y-2">
            {(outcome?.payload?.top_combinations ?? []).map((c: any, i: number) => (
              <li key={i} className="rounded-xl bg-white p-3">
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-semibold"
                    style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                  >
                    {c.label}
                  </span>
                  <span
                    className="text-sm"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#ec4899" }}
                  >
                    {c.avg_result}/5 · {c.reports} reports
                  </span>
                </div>
                <p
                  className="mt-1 text-xs text-neutral-500"
                  style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                >
                  {c.why}
                </p>
              </li>
            ))}
          </ul>
          {(outcome?.payload?.underperformers ?? []).length > 0 && (
            <details className="mt-3">
              <summary
                className="cursor-pointer text-xs text-neutral-400"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                UNDERPERFORMERS
              </summary>
              <ul className="mt-2 space-y-1">
                {(outcome.payload.underperformers ?? []).map((u: any, i: number) => (
                  <li key={i} className="text-xs text-neutral-500">{u.label} — {u.note}</li>
                ))}
              </ul>
            </details>
          )}
        </Panel>

        {/* ── SEASONAL INTELLIGENCE ── */}
        <Panel title="Seasonal Intelligence" subtitle="Cycles · Demand · Timing">
          <Headline text={seasonal?.payload?.headline} />
          {seasonal?.payload?.peak_window && (
            <p className="mt-1 text-sm" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
              Peak window:{" "}
              <span className="font-semibold" style={{ color: "#7c3aed" }}>
                {seasonal.payload.peak_window}
              </span>
            </p>
          )}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {(seasonal?.payload?.by_season ?? []).map((s: any, i: number) => (
              <div key={i} className="rounded-xl bg-white p-2 text-center">
                <div
                  className="text-lg"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#ec4899" }}
                >
                  {s.demand_index}
                </div>
                <div
                  className="text-[10px] uppercase text-neutral-400"
                  style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                >
                  {s.season}
                </div>
                <div className="text-[9px] text-neutral-300">{s.avg_result}/5</div>
              </div>
            ))}
          </div>
          <h4
            className="mt-4 text-xs font-semibold uppercase text-neutral-500"
            style={{ fontFamily: "'Source Sans 3', sans-serif" }}
          >
            Campaign calendar
          </h4>
          <ul className="mt-1 space-y-1">
            {(seasonal?.payload?.campaign_calendar ?? []).map((c: any, i: number) => (
              <li key={i} className="text-xs text-neutral-600">
                <span className="font-semibold" style={{ color: "#7c3aed" }}>{c.month}</span> —{" "}
                {c.action}
              </li>
            ))}
          </ul>
        </Panel>

        {/* ── REGIONAL PERFORMANCE ── */}
        <Panel title="Regional Performance" subtitle="Location · Market signals">
          <Headline text={regional?.payload?.headline} />
          <ol className="mt-3 space-y-2">
            {(regional?.payload?.priority_markets ?? []).map((m: any) => (
              <li
                key={m.rank}
                className="flex items-center gap-3 rounded-xl bg-white p-3"
              >
                <span
                  className="text-2xl"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: "#7c3aed" }}
                >
                  {m.rank}
                </span>
                <div className="flex-1">
                  <div
                    className="text-sm font-semibold"
                    style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                  >
                    {m.market}
                  </div>
                  <div
                    className="text-xs text-neutral-500"
                    style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                  >
                    {m.why}
                  </div>
                </div>
                <span
                  className="text-xs"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#ec4899" }}
                >
                  {m.reports}
                </span>
              </li>
            ))}
          </ol>
          {(regional?.payload?.emerging_markets ?? []).length > 0 && (
            <div className="mt-3">
              <p
                className="text-[10px] uppercase text-neutral-400"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Emerging markets
              </p>
              {(regional.payload.emerging_markets ?? []).map((m: any, i: number) => (
                <p key={i} className="text-xs text-neutral-500">
                  {m.market} — {m.note}
                </p>
              ))}
            </div>
          )}
        </Panel>

        {/* ── CHURN ── */}
        <Panel title="Churn Risk" subtitle="Cancellations · Unfollows · No-repurchase">
          <div className="flex items-center gap-3">
            <RiskBadge level={churn?.payload?.risk_level} />
            <Headline text={churn?.payload?.headline} inline />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(churn?.payload?.drivers ?? []).map((d: any, i: number) => (
              <div key={i} className="rounded-xl bg-white p-3 text-center">
                <div
                  className="text-xl"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#ec4899" }}
                >
                  {d.count}
                </div>
                <div
                  className="text-[10px] text-neutral-400"
                  style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                >
                  {d.signal}
                </div>
              </div>
            ))}
          </div>
          <ul className="mt-3 list-disc pl-4">
            {(churn?.payload?.retention_actions ?? []).map((a: string, i: number) => (
              <li
                key={i}
                className="text-xs text-neutral-600"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
              >
                {a}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

/* ── Presentational helpers ───────────────────────────────────────────────── */

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl p-5" style={{ background: "var(--plume-lavender, #f4f1fb)" }}>
      <h3
        className="text-2xl"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: "#7c3aed" }}
      >
        {title}
      </h3>
      <p
        className="text-[10px] uppercase tracking-widest text-neutral-400"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {subtitle}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Headline({ text, inline }: { text?: string; inline?: boolean }) {
  if (!text)
    return (
      <p
        className="text-sm text-neutral-400"
        style={{ fontFamily: "'Source Sans 3', sans-serif" }}
      >
        Awaiting more signals…
      </p>
    );
  return (
    <p
      className={`text-sm text-neutral-700 ${inline ? "" : "mt-1"}`}
      style={{ fontFamily: "'Source Sans 3', sans-serif" }}
    >
      {text}
    </p>
  );
}

function RiskBadge({ level }: { level?: string }) {
  const map: Record<string, string> = {
    low:      "background:rgba(187,247,208,.6);color:#166534",
    moderate: "background:rgba(254,240,138,.6);color:#854d0e",
    elevated: "background:rgba(254,215,170,.6);color:#9a3412",
    high:     "background:rgba(254,202,202,.6);color:#991b1b",
  };
  const style = map[level ?? ""] ?? "background:rgba(229,231,235,.6);color:#4b5563";
  return (
    <span
      className="rounded-full px-3 py-1 text-xs"
      style={{
        ...Object.fromEntries(style.split(";").map(s => s.split(":") as [string, string])),
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {level ?? "—"}
    </span>
  );
}
