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

