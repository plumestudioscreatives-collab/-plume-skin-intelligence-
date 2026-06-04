// lib/intelligence/aggregate.ts
// ----------------------------------------------------------------------------
// Reads the Signal Flow aggregate views with the SERVICE ROLE client.
// No individual beauty-lover rows ever leave this layer — only counts & avgs.
// Used by: app/api/intelligence/[scope]/[id]/route.ts  (Next.js)
//          server.js  POST /api/signalflow-intelligence/:scope/:id  (Express)
// ----------------------------------------------------------------------------
import { createClient } from "@supabase/supabase-js";

// Server-only: never import SUPABASE_SERVICE_ROLE_KEY in a client component.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export type Scope = "clinic" | "brand";
const col = (scope: Scope) => (scope === "clinic" ? "clinic_id" : "brand_id");

export interface OutcomeRow {
  treatment_name: string | null;
  product_name:   string | null;
  product_id:     string | null;
  reports:        number;
  avg_result:     number;
  common_tags:    string[] | null;
}

export interface SeasonalRow {
  used_season: string | null;
  used_month:  number | null;
  reports:     number;
  avg_result:  number;
}

export interface RegionalRow {
  country:    string;
  city:       string | null;
  reports:    number;
  avg_result: number;
}

export interface ChurnRow {
  canceled_subscriptions: number;
  unfollowers:            number;
  never_repurchased:      number;
  churn_score:            number;
}

export interface AggregateBundle {
  scope:      Scope;
  scopeId:    string;
  sampleSize: number;
  outcome:    OutcomeRow[];
  seasonal:   SeasonalRow[];
  regional:   RegionalRow[];
  churn:      ChurnRow;
}

export async function buildAggregate(scope: Scope, scopeId: string): Promise<AggregateBundle> {
  const scopeCol = col(scope);

  const [outcome, seasonal, regional, churn] = await Promise.all([
    supabase
      .from("v_outcome_signals")
      .select("treatment_name, product_name, product_id, reports, avg_result, common_tags")
      .eq(scopeCol, scopeId)
      .order("avg_result", { ascending: false })
      .limit(50),
    supabase
      .from("v_seasonal_signals")
      .select("used_season, used_month, reports, avg_result")
      .eq(scopeCol, scopeId),
    supabase
      .from("v_regional_signals")
      .select("country, city, reports, avg_result")
      .eq(scopeCol, scopeId)
      .order("reports", { ascending: false })
      .limit(50),
    supabase
      .from("v_churn_signals")
      .select("canceled_subscriptions, unfollowers, never_repurchased, churn_score")
      .eq("scope_id", scopeId)
      .eq("scope_type", scope)
      .maybeSingle(),
  ]);

  const outcomeRows = (outcome.data ?? []) as OutcomeRow[];
  const sampleSize  = outcomeRows.reduce((n, r) => n + (r.reports ?? 0), 0);

  return {
    scope,
    scopeId,
    sampleSize,
    outcome:  outcomeRows,
    seasonal: (seasonal.data ?? []) as SeasonalRow[],
    regional: (regional.data ?? []) as RegionalRow[],
    churn:
      (churn.data as ChurnRow) ??
      { canceled_subscriptions: 0, unfollowers: 0, never_repurchased: 0, churn_score: 0 },
  };
}

export { supabase as serviceClient };
