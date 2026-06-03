// src/lib/SignalFlowUnified.tsx
//
// UPGRADE LOG (edit 1 of 6):
//   - Modules regional | retention | seasonal | product now call the real
//     /api/signalflow/insights endpoint (Claude Sonnet 4.6 via Express backend).
//   - All other modules retain their existing static predictions unchanged.
//   - Added: useSignalFlowInsights hook, AISignalSection component,
//     Refresh button with 30s cooldown, loading skeleton, empty state.
//   - UI, layout, fonts, colour tokens, and all existing components are
//     100% unchanged — only the data source for the four AI sections changed.

import { useState, useEffect, useCallback } from "react";

// ── Existing types (unchanged) ────────────────────────────────────────────────

type BadgeType = "primary" | "secondary" | "success" | "alert";

type Prediction = {
  icon: string;
  title: string;
  badge: string;
  badgeType: BadgeType;
  confidence: number;
  body: string;
  action: string;
  basedOn: string[];
};

// ── NEW: JSON contract types (mirrors backend schema) ─────────────────────────

type InsightItem = {
  title: string;
  detail: string;
  metric_reference: string;
};

type AIRecommendation = {
  action: string;
  rationale: string;
};

type SignalFlowInsight = {
  headline: string;
  insights: InsightItem[];
  recommendations: AIRecommendation[];
  confidence: "high" | "medium" | "low";
  data_sufficiency: "sufficient" | "limited" | "insufficient";
  cached?: boolean;
  generated_at?: string;
};

// ── Existing constants (unchanged) ───────────────────────────────────────────

const MODULES = [
  { id: "outcome",    icon: "🧬", name: "Outcome Intelligence",   sub: "Treatment + Product → Result" },
  { id: "treatment",  icon: "💉", name: "Treatment Intelligence",  sub: "Retention · Satisfaction" },
  { id: "product",    icon: "🧴", name: "Product Intelligence",    sub: "Repurchase · Compatibility" },
  { id: "trend",      icon: "📊", name: "Trend Intelligence",      sub: "Rising · Stable · Declining" },
  { id: "consumer",   icon: "✦",  name: "Consumer Intelligence",   sub: "Your skin journey" },
  { id: "predictive", icon: "🔮", name: "Predictive Intelligence", sub: "AI from your data" },
  { id: "skin",       icon: "🪞", name: "Skin Intelligence",       sub: "Profile · Concerns · Progress" },
  { id: "regional",   icon: "📍", name: "Regional Performance",    sub: "Location · Market signals" },
  { id: "retention",  icon: "🔁", name: "Retention Intelligence",  sub: "Churn · Loyalty · LTV" },
  { id: "seasonal",   icon: "🍂", name: "Seasonal Intelligence",   sub: "Cycles · Demand · Timing" },
];

const PREDICTIONS: Record<string, Prediction[]> = {
  outcome: [
    { icon: "🧴", title: "Barrier support may improve your outcomes", badge: "WORTH CONSIDERING", badgeType: "primary", confidence: 72, body: "3 people with similar skin profiles to yours saw improved recovery when adding a barrier repair serum post-treatment.", action: "Ask your clinic about a post-treatment barrier protocol", basedOn: ["Treatment recovery patterns", "Similar skin profiles", "Product review data"] },
    { icon: "🎭", title: "RF Microneedling shows strong results for your concern", badge: "FOR YOUR NEXT REVIEW", badgeType: "success", confidence: 85, body: "Clients using RF Microneedling + Barrier Restore Complex saw an average +31 point skin improvement.", action: "Discuss RF Microneedling at your next clinic visit", basedOn: ["Treatment logs", "Outcome data", "Skin profile match"] },
  ],
  treatment: [{ icon: "💉", title: "Treatment spacing may affect your retention", badge: "PATTERN DETECTED", badgeType: "secondary", confidence: 68, body: "Clients who space treatments 4–6 weeks apart show 2.3× higher retention than those on 8+ week intervals.", action: "Review your rebooking cadence with your provider", basedOn: ["Retention curves", "Treatment frequency logs", "Satisfaction scores"] }],
  trend:    [{ icon: "📈", title: "Peptide serums trending up in your region", badge: "RISING", badgeType: "primary", confidence: 78, body: "Peptide-based products saw +44% search volume and +29% clinic inquiries in the last 30 days.", action: "Evaluate peptide SKU additions for your retail shelf", basedOn: ["Search trends", "Clinic inquiry data", "Regional demand"] }],
  consumer: [{ icon: "✦",  title: "Your skin journey suggests a shift in priorities", badge: "INSIGHT", badgeType: "secondary", confidence: 65, body: "Based on your logged concerns and review history, your focus has moved from acne to anti-aging over the past 6 months.", action: "Update your skin profile to reflect current goals", basedOn: ["Concern history", "Review sentiment", "Product selections"] }],
  predictive:[{ icon: "🔮", title: "Predicted improvement with current protocol", badge: "AI FORECAST", badgeType: "primary", confidence: 74, body: "Based on 11 data points, your current treatment + product combination is projected to yield a +22 point improvement in 8 weeks.", action: "Stay consistent with your current protocol", basedOn: ["Treatment recovery patterns", "Similar skin profiles", "Product review data"] }],
  skin:     [{ icon: "🪞", title: "Skin barrier score declining — action recommended", badge: "ATTENTION", badgeType: "alert", confidence: 80, body: "Your barrier health index dropped 18% since last assessment. Linked to recent exfoliation frequency.", action: "Reduce active exfoliation and add ceramide support", basedOn: ["Skin profile logs", "Product usage data", "Assessment history"] }],
};

const BADGE_STYLES: Record<BadgeType, { bg: string; color: string; border: string }> = {
  primary:   { bg: "rgba(124, 77, 196, 0.12)",  color: "#6a3ab5", border: "rgba(124, 77, 196, 0.28)" },
  secondary: { bg: "rgba(168, 122, 214, 0.14)", color: "#7c4dc4", border: "rgba(168, 122, 214, 0.28)" },
  success:   { bg: "rgba(95, 181, 148, 0.14)",  color: "#3f8a6d", border: "rgba(95, 181, 148, 0.3)" },
  alert:     { bg: "rgba(232, 90, 107, 0.12)",  color: "#c4374c", border: "rgba(232, 90, 107, 0.3)" },
};

const T = {
  bg:           "#d9cef0",
  surface:      "#efe9f9",
  surfaceHover: "#e6def5",
  elevated:     "#f6f1fc",
  border:       "#c4b5e2",
  borderLight:  "#b39fd6",
  accent:       "#7c4dc4",
  accentLight:  "#a87ad6",
  accentMuted:  "#9b7fd0",
  coral:        "#e85a6b",
  mint:         "#5fb594",
  amber:        "#f0b85a",
  textPrimary:  "#2a1f4a",
  textSecondary:"#5b4f7a",
  textMuted:    "#7d7298",
};

// ── NEW: API configuration ────────────────────────────────────────────────────

// In Lovable/Vite, set VITE_API_URL=http://localhost:3000 (or your production URL).
// Falls back to same-origin relative path when frontend is served by the Express server.
const API_BASE: string = (() => {
  try {
    return (import.meta as any)?.env?.VITE_API_URL ?? "";
  } catch {
    return "";
  }
})();

// Which module IDs are AI-powered (brand analytics from backend)
const AI_POWERED_MODULES = new Set(["regional", "retention", "seasonal", "product"]);

// Map frontend module ID → backend section name
const SECTION_MAP: Record<string, string> = {
  regional:  "regional",
  retention: "retention",
  seasonal:  "seasonal",
  product:   "product_intelligence",
};

// ── Existing presentational components (100% unchanged) ──────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(value), 100); return () => clearTimeout(t); }, [value]);
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>AI confidence</span>
        <span style={{ fontSize: 11, color: T.accentLight, fontWeight: 600 }}>{value}%</span>
      </div>
      <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${width}%`, height: "100%", background: `linear-gradient(90deg, ${T.accent}, ${T.accentLight})`, transition: "width 0.9s ease" }} />
      </div>
    </div>
  );
}

function PredictionCard({ prediction, index }: { prediction: Prediction; index: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80 * index); return () => clearTimeout(t); }, [index]);
  const badge = BADGE_STYLES[prediction.badgeType];

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
      padding: 22, marginBottom: 14,
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)",
      transition: "all 0.5s ease",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 24 }}>{prediction.icon}</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 500, color: T.textPrimary, marginBottom: 8, lineHeight: 1.35 }}>{prediction.title}</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, padding: "4px 9px", borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, letterSpacing: "0.08em", fontWeight: 600 }}>{prediction.badge}</span>
          </div>
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 500, color: T.accentLight, lineHeight: 1 }}>{prediction.confidence}<span style={{ fontSize: 14, color: T.textMuted }}>%</span></div>
      </div>

      <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.6, marginBottom: 16 }}>{prediction.body}</p>

      <div style={{ background: T.elevated, borderLeft: `2px solid ${T.accent}`, padding: "12px 14px", borderRadius: 6, marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: T.accentLight, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4, fontWeight: 600 }}>What to do</div>
        <div style={{ fontSize: 13, color: T.textPrimary, lineHeight: 1.5 }}>{prediction.action}</div>
      </div>

      <div>
        <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Based on</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {prediction.basedOn.map((tag) => (
            <span key={tag} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: T.elevated, color: T.textSecondary, border: `1px solid ${T.border}` }}>{tag}</span>
          ))}
        </div>
      </div>

      <ConfidenceBar value={prediction.confidence} />
    </div>
  );
}

function SignalCoverageBox() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginTop: 18 }}>
      <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: T.textPrimary, marginBottom: 14, fontWeight: 500 }}>Signal Coverage</h4>
      {[
        { label: "Product reviews",  count: 5, pct: 50, color: T.accent },
        { label: "Treatment logs",   count: 6, pct: 60, color: T.coral },
      ].map((item) => (
        <div key={item.label} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: T.textSecondary }}>{item.label}</span>
            <span style={{ fontSize: 12, color: T.textMuted }}>{item.count}</span>
          </div>
          <div style={{ height: 3, background: T.border, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${item.pct}%`, height: "100%", background: item.color }} />
          </div>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.mint, display: "inline-block" }} />
          <span style={{ fontSize: 11, color: T.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Signal active</span>
        </div>
        <span style={{ fontSize: 11, color: T.textSecondary }}>11 data points</span>
      </div>
    </div>
  );
}

function TipBox({ type }: { type: "clinic" | "brand" }) {
  const isClinic = type === "clinic";
  const tips = isClinic
    ? "Log treatment outcomes in your clinic portal to feed Signal Flow with real-world data."
    : "Sync product catalog with Plume to activate commerce intelligence.";
  const color = isClinic ? T.accent : T.coral;

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `2px solid ${color}`, borderRadius: 8, padding: 14, marginTop: 10 }}>
      <div style={{ fontSize: 10, color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>{isClinic ? "Clinic Tip" : "Brand Tip"}</div>
      <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>{tips}</p>
    </div>
  );
}

// ── NEW: hook for fetching AI insights from the backend ───────────────────────

function useSignalFlowInsights(brandId: string, moduleId: string) {
  const [insight, setInsight]       = useState<SignalFlowInsight | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const fetchInsights = useCallback(async (forceRefresh = false) => {
    if (!AI_POWERED_MODULES.has(moduleId)) return;
    const section = SECTION_MAP[moduleId];
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/signalflow/insights`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ brand_id: brandId, section, force_refresh: forceRefresh }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? `HTTP ${res.status}`);
      }
      const data: SignalFlowInsight = await res.json();
      setInsight(data);
      setLastRefresh(data.generated_at ?? new Date().toISOString());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [brandId, moduleId]);

  // Auto-fetch on mount and whenever the active module changes
  useEffect(() => { fetchInsights(false); }, [fetchInsights]);

  const refresh = useCallback(() => fetchInsights(true), [fetchInsights]);
  return { insight, loading, error, refresh, lastRefresh };
}

// ── NEW: map JSON contract → Prediction[] for existing PredictionCard ─────────

function mapInsightToPredictions(insight: SignalFlowInsight, moduleId: string): Prediction[] {
  if (insight.data_sufficiency === "insufficient" || insight.insights.length === 0) return [];

  const icon         = MODULES.find((m) => m.id === moduleId)?.icon ?? "✦";
  const confidenceNum: number =
    insight.confidence === "high"   ? 88 :
    insight.confidence === "medium" ? 64 : 43;
  const topBadge: string =
    insight.confidence === "high"   ? "STRONG SIGNAL" :
    insight.confidence === "medium" ? "MODERATE SIGNAL" : "EARLY SIGNAL";
  const topBadgeType: BadgeType =
    insight.confidence === "high"   ? "success" :
    insight.confidence === "medium" ? "primary"  : "secondary";

  return insight.insights.map((item, i) => ({
    icon,
    title:     item.title,
    badge:     i === 0 ? topBadge : "AI INSIGHT",
    badgeType: i === 0 ? topBadgeType : "secondary",
    confidence: confidenceNum,
    body:      item.detail,
    action:    insight.recommendations[i % insight.recommendations.length]?.action ?? "",
    basedOn: [
      item.metric_reference,
      insight.recommendations[i % insight.recommendations.length]?.rationale,
    ].filter(Boolean) as string[],
  }));
}

// ── NEW: loading skeleton (matches card proportions) ─────────────────────────

function InsightSkeleton() {
  return (
    <>
      <style>{`@keyframes sf-pulse { 0%,100%{opacity:.45} 50%{opacity:.9} }`}</style>
      {[0, 1].map((i) => (
        <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22, marginBottom: 14 }}>
          {[72, 100, 55, 38, 65].map((w, j) => (
            <div key={j} style={{
              height: j === 0 ? 18 : 12,
              width: `${w}%`,
              background: T.border,
              borderRadius: 4,
              marginBottom: 12,
              animation: `sf-pulse 1.6s ease-in-out ${j * 0.1}s infinite`,
            }} />
          ))}
        </div>
      ))}
    </>
  );
}

// ── NEW: empty / insufficient-data state ─────────────────────────────────────

function InsufficientDataState({ recommendation }: { recommendation?: string }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: "40px 32px", textAlign: "center",
    }}>
      <div style={{ fontSize: 36, marginBottom: 14 }}>📊</div>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 500, color: T.textPrimary, marginBottom: 10 }}>
        Not enough data yet
      </h3>
      <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.65, maxWidth: 360, margin: "0 auto 20px" }}>
        {recommendation ?? "Sync more sales data to Plume to activate AI insights for this section."}
      </p>
      <div style={{ display: "inline-block", fontSize: 11, color: T.textMuted, background: T.elevated, borderRadius: 20, padding: "5px 14px", border: `1px solid ${T.border}` }}>
        Minimum 5 orders required
      </div>
    </div>
  );
}

// ── NEW: Refresh control bar ──────────────────────────────────────────────────

function RefreshBar({
  headline, onRefresh, refreshing, cooldown, lastRefresh, cached,
}: {
  headline?: string;
  onRefresh: () => void;
  refreshing: boolean;
  cooldown: boolean;
  lastRefresh: string | null;
  cached?: boolean;
}) {
  const btnLabel = refreshing ? "Refreshing…" : cooldown ? "Refreshed ✓" : "↻ Refresh Insights";

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <div style={{ flex: 1 }}>
        {headline && (
          <p style={{ fontSize: 13, color: T.textMuted, fontStyle: "italic", lineHeight: 1.5 }}>{headline}</p>
        )}
        {lastRefresh && (
          <p style={{ fontSize: 10, color: T.textMuted, marginTop: headline ? 4 : 0 }}>
            {cached ? "Cached" : "Generated"} · {new Date(lastRefresh).toLocaleString()}
          </p>
        )}
      </div>
      <button
        onClick={onRefresh}
        disabled={cooldown || refreshing}
        style={{
          fontSize: 11,
          color:      cooldown ? T.textMuted : T.accent,
          background: "none",
          border:     `1px solid ${cooldown ? T.border : T.borderLight}`,
          borderRadius: 20,
          padding:    "6px 16px",
          cursor:     cooldown || refreshing ? "not-allowed" : "pointer",
          letterSpacing: "0.06em",
          textTransform: "uppercase" as const,
          transition: "all 0.2s",
          flexShrink: 0,
          marginLeft: 16,
          opacity:    cooldown ? 0.6 : 1,
        }}
      >
        {btnLabel}
      </button>
    </div>
  );
}

// ── NEW: AI-powered section wrapper ──────────────────────────────────────────

function AISignalSection({ brandId, moduleId }: { brandId: string; moduleId: string }) {
  const { insight, loading, error, refresh, lastRefresh } = useSignalFlowInsights(brandId, moduleId);
  const [refreshing, setRefreshing] = useState(false);
  const [cooldown,   setCooldown]   = useState(false);

  const handleRefresh = async () => {
    if (cooldown || refreshing) return;
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 30_000);
  };

  if (loading && !insight) return <InsightSkeleton />;

  if (error) {
    return (
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
        <p style={{ fontSize: 13, color: T.coral, marginBottom: 14 }}>
          Failed to load insights: {error}
        </p>
        <button
          onClick={handleRefresh}
          style={{ fontSize: 12, color: T.accent, background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "7px 16px", cursor: "pointer" }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!insight || insight.data_sufficiency === "insufficient") {
    return (
      <InsufficientDataState recommendation={insight?.recommendations?.[0]?.action} />
    );
  }

  const predictions = mapInsightToPredictions(insight, moduleId);

  return (
    <>
      <RefreshBar
        headline={insight.headline}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        cooldown={cooldown}
        lastRefresh={lastRefresh}
        cached={insight.cached}
      />

      {predictions.map((pred, i) => (
        <PredictionCard key={`${moduleId}-ai-${i}`} prediction={pred} index={i} />
      ))}

      {/* Recommendations panel — shows all recs with rationale */}
      {insight.recommendations.length > 0 && (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "18px 20px", marginTop: 4,
        }}>
          <div style={{ fontSize: 10, color: T.accentLight, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>
            Recommended Actions
          </div>
          {insight.recommendations.map((rec, i) => (
            <div
              key={i}
              style={{
                display: "flex", gap: 14,
                paddingBottom: i < insight.recommendations.length - 1 ? 16 : 0,
                marginBottom:  i < insight.recommendations.length - 1 ? 16 : 0,
                borderBottom:  i < insight.recommendations.length - 1 ? `1px solid ${T.border}` : "none",
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: "white", fontWeight: 600, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 13, color: T.textPrimary, fontWeight: 500, marginBottom: 4 }}>{rec.action}</div>
                <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>{rec.rationale}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Updated main export — brandId prop added; sidebar gets "AI" badge ─────────

export function SignalFlowUnified({ brandId = "demo" }: { brandId?: string }) {
  const [activeModule, setActiveModule] = useState("outcome");
  const activeModuleData = MODULES.find((m) => m.id === activeModule)!;
  const isAIPowered      = AI_POWERED_MODULES.has(activeModule);
  const staticPredictions = !isAIPowered
    ? (PREDICTIONS[activeModule] ?? PREDICTIONS.predictive)
    : [];

  return (
    <div style={{
      background: T.bg, minHeight: "100vh",
      fontFamily: "'DM Sans', system-ui, sans-serif", color: T.textPrimary,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${T.borderLight}; }
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "100vh" }}>

        {/* ── Sidebar (unchanged layout; "AI" badge added for AI-powered modules) */}
        <aside style={{
          background: T.surface, borderRight: `1px solid ${T.border}`,
          padding: "20px 18px", position: "sticky", top: 0,
          alignSelf: "start", height: "100vh", overflowY: "auto",
        }}>
          <div style={{ padding: "4px 14px 18px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.mint, display: "inline-block" }} />
            <span style={{ fontSize: 11, color: T.accentLight, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600 }}>Signal Flow™</span>
          </div>

          <div>
            {MODULES.map((mod) => {
              const isActive = activeModule === mod.id;
              const hasAI    = AI_POWERED_MODULES.has(mod.id);
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModule(mod.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                    background:  isActive ? T.elevated : "transparent",
                    borderLeft:  isActive ? `3px solid ${T.accent}` : "3px solid transparent",
                    marginBottom: 2, width: "100%", border: "none",
                    textAlign: "left", outline: "none", transition: "all 0.2s ease",
                    color: T.textPrimary,
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = T.surfaceHover; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 18 }}>{mod.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: isActive ? T.textPrimary : T.textSecondary, fontWeight: isActive ? 500 : 400 }}>
                      {mod.name}
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{mod.sub}</div>
                  </div>
                  {/* Subtle AI badge — only visual addition to the sidebar */}
                  {hasAI && (
                    <span style={{
                      fontSize: 9, color: T.accentLight, letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      background: "rgba(124,77,196,0.10)", borderRadius: 3, padding: "2px 6px",
                      flexShrink: 0,
                    }}>
                      AI
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <SignalCoverageBox />
          <TipBox type="clinic" />
          <TipBox type="brand" />
        </aside>

        {/* ── Main content */}
        <main style={{ padding: "40px 48px", maxWidth: 780, width: "100%" }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 38,
            fontWeight: 500, color: T.textPrimary, marginBottom: 12,
          }}>
            {activeModuleData.name}
          </h1>
          <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.6, maxWidth: 720, marginBottom: 24 }}>
            {activeModuleData.sub}
          </p>

          {isAIPowered ? (
            <AISignalSection brandId={brandId} moduleId={activeModule} />
          ) : (
            staticPredictions.map((pred, i) => (
              <PredictionCard key={`${activeModule}-${i}`} prediction={pred} index={i} />
            ))
          )}
        </main>

      </div>
    </div>
  );
}

export default SignalFlowUnified;
