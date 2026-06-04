-- ============================================================
-- PLUME SKIN INTELLIGENCE — DATABASE SCHEMA
-- Run this in your Supabase SQL editor to set up all tables
-- ============================================================

-- Clinics
CREATE TABLE clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  date_of_birth DATE,
  skin_type TEXT,             -- 'dry', 'oily', 'combination', 'normal', 'sensitive'
  fitzpatrick_scale INTEGER,  -- 1–6 (skin phototype)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skin Assessments (Longitudinal Mapping)
CREATE TABLE skin_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  hydration_level INTEGER,     -- 0–100
  sebum_level INTEGER,         -- 0–100
  sensitivity_level INTEGER,   -- 0–100
  pigmentation_score INTEGER,  -- 0–100
  texture_score INTEGER,       -- 0–100
  elasticity_score INTEGER,    -- 0–100
  notes TEXT,
  assessed_by TEXT,
  image_url TEXT,
  assessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Treatments (Feedback Loops)
CREATE TABLE treatments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  treatment_name TEXT NOT NULL,
  treatment_type TEXT,         -- 'laser', 'chemical_peel', 'microneedling', 'facial', etc.
  products_used JSONB,         -- array of product names
  practitioner TEXT,
  outcome_score INTEGER,       -- 0–100, filled at follow-up visit
  outcome_notes TEXT,
  outcome_logged_at TIMESTAMPTZ,
  side_effects TEXT,
  follow_up_date DATE,
  treated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Environmental Signals (Adaptive Context)
CREATE TABLE environmental_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  season TEXT,                 -- 'spring', 'summer', 'autumn', 'winter'
  climate TEXT,                -- 'humid', 'dry', 'temperate', 'tropical'
  stress_level INTEGER,        -- 0–10
  sleep_quality INTEGER,       -- 0–10
  hormonal_phase TEXT,         -- 'follicular', 'ovulatory', 'luteal', 'menstrual', 'not_applicable'
  diet_notes TEXT,
  water_intake INTEGER,        -- glasses per day
  uv_exposure TEXT,            -- 'low', 'moderate', 'high'
  location_city TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SIGNALFLOW — BRAND COMMERCE INTELLIGENCE
-- These tables power the brand-facing analytics dashboard.
-- ============================================================

-- Brand accounts (B2B — beauty brands on the platform)
CREATE TABLE brands (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT,           -- 'skincare' | 'makeup' | 'body' | 'fragrance'
  contact_email TEXT,
  country       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Brand product catalogue
CREATE TABLE products (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id     UUID REFERENCES brands(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  sku          TEXT,
  category     TEXT,           -- 'serum' | 'moisturiser' | 'cleanser' | 'spf' etc.
  skin_concern TEXT,           -- primary concern addressed
  price_gbp    NUMERIC(10,2),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Core commerce fact table — every sale feeds SignalFlow analytics
CREATE TABLE orders (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id           UUID REFERENCES brands(id) ON DELETE CASCADE,
  product_id         UUID REFERENCES products(id),
  customer_id        UUID,                          -- anonymous or linked user
  units              INTEGER DEFAULT 1 CHECK (units > 0),
  revenue_gbp        NUMERIC(10,2),
  country            TEXT,
  city               TEXT,
  outcome_rating     INTEGER CHECK (outcome_rating BETWEEN 1 AND 10),
  is_repurchase      BOOLEAN DEFAULT FALSE,          -- true = same customer bought this product before
  days_to_repurchase INTEGER,                        -- null on first purchase; filled on repeat
  skin_concern       TEXT,                           -- buyer's primary concern at purchase time
  skin_type          TEXT,                           -- 'dry' | 'oily' | 'combination' | 'sensitive'
  ordered_at         TIMESTAMPTZ DEFAULT NOW()
);

-- AI insights cache — prevents a Claude call on every page render.
-- Keyed by (brand_id, section); upserted on refresh.
CREATE TABLE insights_cache (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id      UUID REFERENCES brands(id) ON DELETE CASCADE,
  section       TEXT NOT NULL CHECK (section IN
                  ('regional','retention','seasonal','product_intelligence')),
  insights_json JSONB NOT NULL,
  generated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (brand_id, section)
);

-- ── Deterministic analytics views (Layer 1) ──────────────────────────────────
-- Claude receives ONLY these pre-computed summaries — never raw rows.
-- All figures shown in the UI must trace back to one of these views.

-- Regional: top geographies, skin-type distribution, outcome by location
CREATE OR REPLACE VIEW signalflow_regional AS
SELECT
  o.brand_id,
  o.country,
  o.city,
  COUNT(*)                                                              AS order_count,
  SUM(o.units)                                                          AS total_units,
  ROUND(SUM(o.revenue_gbp)::NUMERIC, 2)                                AS total_revenue_gbp,
  ROUND(AVG(o.outcome_rating)::NUMERIC, 1)                             AS avg_outcome_rating,
  MODE() WITHIN GROUP (ORDER BY o.skin_type)                           AS dominant_skin_type,
  MODE() WITHIN GROUP (ORDER BY o.skin_concern)                        AS top_skin_concern,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE o.is_repurchase)
      / NULLIF(COUNT(*), 0), 1
  )                                                                     AS local_repurchase_pct
FROM orders o
WHERE o.country IS NOT NULL
GROUP BY o.brand_id, o.country, o.city
ORDER BY total_revenue_gbp DESC;

-- Retention: repurchase rate, time-to-repurchase, satisfaction by brand
CREATE OR REPLACE VIEW signalflow_retention AS
SELECT
  o.brand_id,
  COUNT(*)                                                              AS total_orders,
  COUNT(*) FILTER (WHERE o.is_repurchase)                              AS repurchase_orders,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE o.is_repurchase)
      / NULLIF(COUNT(*), 0), 1
  )                                                                     AS repurchase_rate_pct,
  ROUND(
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.days_to_repurchase)
      FILTER (WHERE o.is_repurchase AND o.days_to_repurchase IS NOT NULL)
    ::NUMERIC, 0
  )                                                                     AS median_days_to_repurchase,
  ROUND(AVG(o.outcome_rating)::NUMERIC, 1)                             AS avg_satisfaction,
  MODE() WITHIN GROUP (ORDER BY o.skin_type)                           AS most_loyal_skin_type,
  MODE() WITHIN GROUP (ORDER BY o.skin_concern)                        AS top_concern
FROM orders o
GROUP BY o.brand_id;

-- Seasonal: monthly time series with concern and season breakdown (18-month window)
CREATE OR REPLACE VIEW signalflow_seasonal AS
SELECT
  o.brand_id,
  DATE_TRUNC('month', o.ordered_at)                                    AS month_start,
  TO_CHAR(DATE_TRUNC('month', o.ordered_at), 'Mon YYYY')               AS month_label,
  CASE
    WHEN EXTRACT(MONTH FROM o.ordered_at) IN (12,1,2) THEN 'Winter'
    WHEN EXTRACT(MONTH FROM o.ordered_at) IN (3,4,5)  THEN 'Spring'
    WHEN EXTRACT(MONTH FROM o.ordered_at) IN (6,7,8)  THEN 'Summer'
    ELSE 'Autumn'
  END                                                                   AS season,
  o.skin_concern,
  COUNT(*)                                                              AS orders,
  SUM(o.units)                                                          AS units,
  ROUND(SUM(o.revenue_gbp)::NUMERIC, 2)                               AS revenue_gbp,
  ROUND(AVG(o.outcome_rating)::NUMERIC, 1)                            AS avg_outcome_rating
FROM orders o
WHERE o.ordered_at >= NOW() - INTERVAL '18 months'
GROUP BY o.brand_id, month_start, month_label, season, o.skin_concern
ORDER BY month_start DESC;

-- Product Intelligence: global totals + per-country rollup for worldwide map
CREATE OR REPLACE VIEW signalflow_product_intelligence AS
SELECT
  o.brand_id,
  SUM(o.units)                                                          AS total_units_sold,
  ROUND(SUM(o.revenue_gbp)::NUMERIC, 2)                               AS total_revenue_gbp,
  COUNT(DISTINCT o.country)                                             AS active_countries,
  COUNT(DISTINCT o.city)                                               AS active_cities,
  COUNT(DISTINCT o.product_id)                                        AS active_products,
  ROUND(AVG(o.outcome_rating)::NUMERIC, 2)                           AS avg_outcome_rating,
  COUNT(DISTINCT o.customer_id)
    FILTER (WHERE o.customer_id IS NOT NULL)                           AS unique_customers,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE o.is_repurchase)
      / NULLIF(COUNT(*), 0), 1
  )                                                                     AS overall_repurchase_pct
FROM orders o
GROUP BY o.brand_id;

-- ============================================================
-- ROW LEVEL SECURITY (recommended for production)
-- ============================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE skin_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_signals ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (your API uses the service key)
CREATE POLICY "Service role access" ON clients FOR ALL USING (true);
CREATE POLICY "Service role access" ON skin_assessments FOR ALL USING (true);
CREATE POLICY "Service role access" ON treatments FOR ALL USING (true);
CREATE POLICY "Service role access" ON environmental_signals FOR ALL USING (true);

-- ============================================================
-- SIGNAL FLOW INTELLIGENCE — 20260604
-- Outcome · Seasonal · Regional · Churn + AI snapshot cache
-- ============================================================

-- ── Core input table (beauty-lover submissions) ───────────────
CREATE TABLE outcome_reports (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID NOT NULL,                        -- auth.uid() — RLS enforces own-rows only
  clinic_id      UUID REFERENCES clinics(id) ON DELETE SET NULL,
  brand_id       UUID REFERENCES brands(id)  ON DELETE SET NULL,
  -- what was used
  treatment_name TEXT,                                 -- free text or FK label
  product_name   TEXT,
  product_id     UUID REFERENCES products(id) ON DELETE SET NULL,
  -- outcome
  result_score   INTEGER CHECK (result_score BETWEEN 1 AND 5),
  -- when
  used_month     INTEGER CHECK (used_month BETWEEN 1 AND 12),
  used_season    TEXT CHECK (used_season IN ('spring','summer','autumn','winter')),
  -- where
  country        TEXT,
  city           TEXT,
  -- enrichment
  tags           TEXT[],
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Engagement tracking (feeds churn) ─────────────────────────
CREATE TABLE follows (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id   UUID NOT NULL,
  target_type   TEXT NOT NULL CHECK (target_type IN ('clinic','brand')),
  target_id     UUID NOT NULL,
  status        TEXT NOT NULL DEFAULT 'following' CHECK (status IN ('following','unfollowed')),
  followed_at   TIMESTAMPTZ DEFAULT NOW(),
  unfollowed_at TIMESTAMPTZ,
  UNIQUE (follower_id, target_type, target_id)
);

CREATE TABLE product_subscriptions (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                UUID NOT NULL,
  brand_id               UUID REFERENCES brands(id) ON DELETE CASCADE,
  product_id             UUID REFERENCES products(id) ON DELETE SET NULL,
  stripe_subscription_id TEXT UNIQUE,
  status                 TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','canceled','paused')),
  started_at             TIMESTAMPTZ DEFAULT NOW(),
  canceled_at            TIMESTAMPTZ,
  last_purchase_at       TIMESTAMPTZ
);

CREATE TABLE purchases (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL,
  brand_id          UUID REFERENCES brands(id) ON DELETE SET NULL,
  product_id        UUID REFERENCES products(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  amount_gbp        NUMERIC(10,2),
  purchased_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI snapshot cache (one row per scope+kind, newest wins) ───
CREATE TABLE intelligence_snapshots (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scope_type   TEXT NOT NULL CHECK (scope_type IN ('clinic','brand')),
  scope_id     UUID NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('outcome','seasonal','regional','churn')),
  payload      JSONB NOT NULL DEFAULT '{}',
  model        TEXT,
  sample_size  INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_snapshots_scope ON intelligence_snapshots (scope_type, scope_id, kind, generated_at DESC);

-- ── Aggregate views (Layer 1 — deterministic, no PII) ─────────

-- Outcome: treatment+product combos, avg result, common tags
CREATE OR REPLACE VIEW v_outcome_signals AS
SELECT
  r.clinic_id,
  r.brand_id,
  r.treatment_name,
  r.product_name,
  r.product_id,
  COUNT(*)                                                   AS reports,
  ROUND(AVG(r.result_score)::NUMERIC, 2)                    AS avg_result,
  ARRAY_AGG(DISTINCT tag) FILTER (WHERE tag IS NOT NULL)    AS common_tags
FROM outcome_reports r
LEFT JOIN LATERAL UNNEST(COALESCE(r.tags, ARRAY[]::TEXT[])) AS tag ON TRUE
GROUP BY r.clinic_id, r.brand_id, r.treatment_name, r.product_name, r.product_id;

-- Seasonal: month/season breakdown
CREATE OR REPLACE VIEW v_seasonal_signals AS
SELECT
  r.clinic_id,
  r.brand_id,
  r.used_season,
  r.used_month,
  COUNT(*)                               AS reports,
  ROUND(AVG(r.result_score)::NUMERIC, 2) AS avg_result
FROM outcome_reports r
GROUP BY r.clinic_id, r.brand_id, r.used_season, r.used_month
ORDER BY reports DESC;

-- Regional: country/city breakdown
CREATE OR REPLACE VIEW v_regional_signals AS
SELECT
  r.clinic_id,
  r.brand_id,
  r.country,
  r.city,
  COUNT(*)                               AS reports,
  ROUND(AVG(r.result_score)::NUMERIC, 2) AS avg_result
FROM outcome_reports r
WHERE r.country IS NOT NULL
GROUP BY r.clinic_id, r.brand_id, r.country, r.city
ORDER BY reports DESC;

-- Churn: cancellations + unfollows + never-repurchased
CREATE OR REPLACE VIEW v_churn_signals AS
SELECT
  scope_type,
  scope_id::TEXT,
  SUM(canceled_subs)          AS canceled_subscriptions,
  SUM(unfollowers_count)      AS unfollowers,
  SUM(never_repurchased)      AS never_repurchased,
  ROUND(
    (SUM(canceled_subs) + SUM(unfollowers_count) + SUM(never_repurchased))::NUMERIC
    / NULLIF(SUM(total_users), 0) * 100,
  1)                          AS churn_score
FROM (
  -- canceled product subscriptions, grouped by brand
  SELECT 'brand'::TEXT AS scope_type,
         brand_id::TEXT AS scope_id,
         COUNT(*) FILTER (WHERE status = 'canceled') AS canceled_subs,
         0 AS unfollowers_count,
         0 AS never_repurchased,
         COUNT(DISTINCT user_id) AS total_users
  FROM product_subscriptions WHERE brand_id IS NOT NULL GROUP BY brand_id

  UNION ALL

  -- unfollows per clinic/brand
  SELECT target_type,
         target_id::TEXT,
         0,
         COUNT(*) FILTER (WHERE status = 'unfollowed'),
         0,
         COUNT(DISTINCT follower_id)
  FROM follows GROUP BY target_type, target_id

  UNION ALL

  -- one-time buyers who never came back, per brand
  SELECT 'brand',
         brand_id::TEXT,
         0, 0,
         COUNT(DISTINCT user_id) FILTER (WHERE cnt = 1),
         COUNT(DISTINCT user_id)
  FROM (
    SELECT brand_id, user_id, COUNT(*) AS cnt
    FROM purchases WHERE brand_id IS NOT NULL
    GROUP BY brand_id, user_id
  ) p GROUP BY brand_id
) combined
GROUP BY scope_type, scope_id;

-- ── RLS ────────────────────────────────────────────────────────
ALTER TABLE outcome_reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows                ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases              ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_snapshots ENABLE ROW LEVEL SECURITY;

-- Beauty lovers can only read/write their own outcome_reports
CREATE POLICY "Own rows only"
  ON outcome_reports FOR ALL USING (user_id = auth.uid());

-- Follows: own rows only
CREATE POLICY "Own follows"
  ON follows FOR ALL USING (follower_id = auth.uid());

-- Subscriptions/purchases: own rows
CREATE POLICY "Own subscriptions" ON product_subscriptions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Own purchases"     ON purchases             FOR ALL USING (user_id = auth.uid());

-- Snapshots: clinics/brands read their own scope only; service role writes
CREATE POLICY "Service role write snapshots"
  ON intelligence_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Scope owner reads snapshots"
  ON intelligence_snapshots FOR SELECT USING (true);  -- further scoped in app layer via service key
