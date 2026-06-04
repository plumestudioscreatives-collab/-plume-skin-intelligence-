// app/api/intelligence/[scope]/[id]/route.ts
// ----------------------------------------------------------------------------
// POST /api/intelligence/clinic/<clinicId>   (or .../brand/<brandId>)
//
// 1. Builds the anonymized aggregate bundle from the views.
// 2. Asks Claude for four intelligence payloads:
//      Outcome · Seasonal (Cycles/Demand/Timing) · Regional · Churn
// 3. Caches each as a row in intelligence_snapshots.
//
// Trigger from a nightly Vercel Cron and/or the portal "Refresh signals" button.
// Protect the cron path with a CRON_SECRET header check.
// ----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildAggregate, serviceClient, type Scope } from "@/lib/intelligence/aggregate";

export const runtime    = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL     = "claude-sonnet-4-6";

const SCHEMA = `{
  "outcome": {
    "headline": string,
    "top_combinations": [{ "label": string, "avg_result": number, "reports": number, "why": string }],
    "underperformers":  [{ "label": string, "note": string }]
  },
  "seasonal": {
    "headline": string,
    "peak_window": string,
    "by_season": [{ "season": string, "demand_index": number, "avg_result": number }],
    "campaign_calendar": [{ "month": string, "action": string, "rationale": string }]
  },
  "regional": {
    "headline": string,
    "priority_markets": [{ "rank": number, "market": string, "reports": number, "avg_result": number, "why": string }],
    "emerging_markets": [{ "market": string, "note": string }]
  },
  "churn": {
    "headline": string,
    "risk_level": "low" | "moderate" | "elevated" | "high",
    "drivers": [{ "signal": string, "count": number }],
    "retention_actions": [string]
  }
}`;

function buildPrompt(bundle: Awaited<ReturnType<typeof buildAggregate>>) {
  return `You are Plume's Signal Flow Intelligence engine. Plume connects aesthetic clinics, beauty brands, and beauty lovers. Below is ANONYMIZED, aggregated signal data submitted by beauty lovers for one ${bundle.scope}. Convert it into actionable intelligence.

Rules:
- Base every claim only on the numbers given. Never invent data.
- Sample size is ${bundle.sampleSize}. If fewer than 10 reports, say so and keep recommendations cautious.
- "demand_index" = relative demand 0–100 inferred from report counts across seasons.
- Be concrete and commercial: name months, markets, and the order to act in.

DATA
Outcome  : ${JSON.stringify(bundle.outcome)}
Seasonal : ${JSON.stringify(bundle.seasonal)}
Regional : ${JSON.stringify(bundle.regional)}
Churn    : ${JSON.stringify(bundle.churn)}

Respond with ONLY valid JSON in exactly this shape — no markdown, no preamble:
${SCHEMA}`;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { scope: string; id: string } }
) {
  const scope = params.scope as Scope;
  if (scope !== "clinic" && scope !== "brand") {
    return NextResponse.json({ error: "scope must be 'clinic' or 'brand'" }, { status: 400 });
  }

  const bundle = await buildAggregate(scope, params.id);

  const msg = await anthropic.messages.create({
    model:      MODEL,
    max_tokens: 2000,
    messages:   [{ role: "user", content: buildPrompt(bundle) }],
  });

  const text = msg.content
    .map(b => (b.type === "text" ? b.text : ""))
    .join("")
    .replace(/```json|```/g, "")
    .trim();

  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(text); }
  catch { return NextResponse.json({ error: "AI returned non-JSON", raw: text }, { status: 502 }); }

  const kinds = ["outcome", "seasonal", "regional", "churn"] as const;
  const rows  = kinds.map(kind => ({
    scope_type:  scope,
    scope_id:    params.id,
    kind,
    payload:     parsed[kind] ?? {},
    model:       MODEL,
    sample_size: bundle.sampleSize,
  }));

  const { error } = await serviceClient.from("intelligence_snapshots").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, sample_size: bundle.sampleSize, intelligence: parsed });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { scope: string; id: string } }
) {
  const scope = params.scope as Scope;
  const kinds = ["outcome", "seasonal", "regional", "churn"] as const;

  const results = await Promise.all(
    kinds.map(kind =>
      serviceClient
        .from("intelligence_snapshots")
        .select("kind, payload, sample_size, generated_at")
        .eq("scope_type", scope)
        .eq("scope_id", params.id)
        .eq("kind", kind)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => ({ kind, ...(data ?? { payload: null, sample_size: 0, generated_at: null }) }))
    )
  );

  return NextResponse.json({
    scope,
    scope_id:  params.id,
    snapshots: Object.fromEntries(results.map(r => [r.kind, r])),
  });
}
