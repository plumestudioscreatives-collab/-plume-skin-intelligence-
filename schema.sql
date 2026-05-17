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
