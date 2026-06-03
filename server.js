// ============================================================
// PLUME SKIN INTELLIGENCE API
// Deploy to Railway or Vercel (serverless via api/index.js)
// ============================================================

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Clients ---
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================
// CLIENTS
// ============================================================

// Create client
app.post('/clients', async (req, res) => {
  const { name, email, clinic_id, date_of_birth, skin_type, fitzpatrick_scale } = req.body;

  const { data, error } = await supabase
    .from('clients')
    .insert([{ name, email, clinic_id, date_of_birth, skin_type, fitzpatrick_scale }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

// Get client
app.get('/clients/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Client not found' });
  res.json(data);
});

// ============================================================
// SKIN ASSESSMENTS — Longitudinal Mapping
// ============================================================

// Log assessment
app.post('/clients/:id/assessments', async (req, res) => {
  const {
    hydration_level,     // 0–100
    sebum_level,         // 0–100
    sensitivity_level,   // 0–100
    pigmentation_score,  // 0–100
    texture_score,       // 0–100
    elasticity_score,    // 0–100
    notes,
    assessed_by,
    image_url
  } = req.body;

  const { data, error } = await supabase
    .from('skin_assessments')
    .insert([{
      client_id: req.params.id,
      hydration_level,
      sebum_level,
      sensitivity_level,
      pigmentation_score,
      texture_score,
      elasticity_score,
      notes,
      assessed_by,
      image_url,
      assessed_at: new Date().toISOString()
    }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

// Get full skin biography
app.get('/clients/:id/assessments', async (req, res) => {
  const { data, error } = await supabase
    .from('skin_assessments')
    .select('*')
    .eq('client_id', req.params.id)
    .order('assessed_at', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ============================================================
// TREATMENTS — Feedback Loops
// ============================================================

// Log treatment
app.post('/clients/:id/treatments', async (req, res) => {
  const {
    treatment_name,
    treatment_type,  // 'laser', 'chemical_peel', 'microneedling', 'facial', etc.
    products_used,   // array
    practitioner,
    outcome_score,   // 0–100, filled at follow-up
    outcome_notes,
    side_effects,
    follow_up_date
  } = req.body;

  const { data, error } = await supabase
    .from('treatments')
    .insert([{
      client_id: req.params.id,
      treatment_name,
      treatment_type,
      products_used,
      practitioner,
      outcome_score,
      outcome_notes,
      side_effects,
      follow_up_date,
      treated_at: new Date().toISOString()
    }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

// Update outcome at follow-up
app.patch('/treatments/:id/outcome', async (req, res) => {
  const { outcome_score, outcome_notes, side_effects } = req.body;

  const { data, error } = await supabase
    .from('treatments')
    .update({
      outcome_score,
      outcome_notes,
      side_effects,
      outcome_logged_at: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

// ============================================================
// ENVIRONMENTAL SIGNALS — Adaptive Context
// ============================================================

app.post('/clients/:id/environment', async (req, res) => {
  const {
    season,           // 'spring', 'summer', 'autumn', 'winter'
    climate,          // 'humid', 'dry', 'temperate', 'tropical'
    stress_level,     // 0–10
    sleep_quality,    // 0–10
    hormonal_phase,   // 'follicular', 'ovulatory', 'luteal', 'menstrual', 'not_applicable'
    diet_notes,
    water_intake,     // glasses/day
    uv_exposure,      // 'low', 'moderate', 'high'
    location_city
  } = req.body;

  const { data, error } = await supabase
    .from('environmental_signals')
    .insert([{
      client_id: req.params.id,
      season,
      climate,
      stress_level,
      sleep_quality,
      hormonal_phase,
      diet_notes,
      water_intake,
      uv_exposure,
      location_city,
      logged_at: new Date().toISOString()
    }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

// ============================================================
// LIVING INTELLIGENCE ENGINE — AI Recommendation
// This is the core. All longitudinal data feeds into Claude.
// ============================================================

app.get('/clients/:id/recommendation', async (req, res) => {
  try {
    // Pull the entire living skin biography
    const [clientRes, assessmentsRes, treatmentsRes, environmentRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', req.params.id).single(),
      supabase.from('skin_assessments').select('*').eq('client_id', req.params.id).order('assessed_at', { ascending: true }),
      supabase.from('treatments').select('*').eq('client_id', req.params.id).order('treated_at', { ascending: true }),
      supabase.from('environmental_signals').select('*').eq('client_id', req.params.id).order('logged_at', { ascending: false }).limit(3)
    ]);

    const client = clientRes.data;
    const assessments = assessmentsRes.data;
    const treatments = treatmentsRes.data;
    const recentEnvironment = environmentRes.data;

    if (!client) return res.status(404).json({ error: 'Client not found' });

    const prompt = `You are Plume's Skin Intelligence engine — a living AI system that learns from longitudinal skin data.

CLIENT PROFILE:
${JSON.stringify(client, null, 2)}

SKIN HISTORY (${assessments.length} assessments):
${JSON.stringify(assessments, null, 2)}

TREATMENT HISTORY (${treatments.length} treatments with outcomes):
${JSON.stringify(treatments, null, 2)}

RECENT ENVIRONMENTAL SIGNALS:
${JSON.stringify(recentEnvironment, null, 2)}

Analyze this client's living skin biography and return a JSON object with exactly these keys:

{
  "trajectory": "How has this client's skin changed over time? Is it improving, declining, stable?",
  "what_working": "Which treatments and products have produced the best outcomes based on the data?",
  "current_state": "Based on recent assessments AND environmental signals, what is this skin experiencing RIGHT NOW?",
  "recommendation": "Specific treatment, product, or protocol for the next clinic visit. Be precise.",
  "watch_points": "Any patterns or warning signs the clinic should monitor.",
  "confidence": "high | medium | low — based on how much data exists"
}

Return ONLY the JSON object. No preamble, no backticks.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const intelligence = JSON.parse(message.content[0].text);

    res.json({
      client_id: req.params.id,
      generated_at: new Date().toISOString(),
      data_points: {
        assessments: assessments.length,
        treatments: treatments.length,
        environmental_signals: recentEnvironment.length
      },
      intelligence
    });

  } catch (error) {
    console.error('Intelligence error:', error);
    res.status(500).json({ error: 'Intelligence engine error', details: error.message });
  }
});

// ============================================================
// CLINIC PROTOCOL INTELLIGENCE
// Which treatments perform best at this clinic?
// ============================================================

app.get('/clinics/:clinic_id/protocol-intelligence', async (req, res) => {
  try {
    const { data: clients } = await supabase
      .from('clients')
      .select('id')
      .eq('clinic_id', req.params.clinic_id);

    const clientIds = clients.map(c => c.id);

    const { data: treatments } = await supabase
      .from('treatments')
      .select('*')
      .in('client_id', clientIds)
      .not('outcome_score', 'is', null);

    // Group by treatment type, calculate average outcomes
    const protocolMap = {};
    treatments.forEach(t => {
      if (!protocolMap[t.treatment_type]) {
        protocolMap[t.treatment_type] = { scores: [], treatments: [] };
      }
      protocolMap[t.treatment_type].scores.push(t.outcome_score);
      protocolMap[t.treatment_type].treatments.push(t.treatment_name);
    });

    const protocolIntelligence = Object.entries(protocolMap).map(([type, data]) => ({
      treatment_type: type,
      average_outcome: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      total_treatments: data.scores.length,
      top_treatments: [...new Set(data.treatments)]
    })).sort((a, b) => b.average_outcome - a.average_outcome);

    res.json({
      clinic_id: req.params.clinic_id,
      protocol_intelligence: protocolIntelligence,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// SIGNALFLOW — BRAND INTELLIGENCE ENGINE
// Four sections: regional | retention | seasonal | product_intelligence
// Architecture:
//   Layer 1 — Supabase views compute all numbers deterministically.
//   Layer 2 — Claude receives pre-computed summaries; never raw rows.
//   Layer 3 — insights_cache prevents a Claude call on every render.
// ============================================================

const SIGNALFLOW_SECTIONS = ['regional', 'retention', 'seasonal', 'product_intelligence'];

// Minimum order volumes for data sufficiency tiers
const SUFFICIENCY_THRESHOLDS = { sufficient: 20, limited: 5 };

// ── Layer 1: fetch pre-computed aggregates from Supabase views ──────────────

async function getSignalFlowAggregates(brandId, section) {
  switch (section) {

    case 'regional': {
      const { data, error } = await supabase
        .from('signalflow_regional')
        .select('country,city,order_count,total_units,total_revenue_gbp,avg_outcome_rating,dominant_skin_type,top_skin_concern,local_repurchase_pct')
        .eq('brand_id', brandId)
        .order('total_revenue_gbp', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    }

    case 'retention': {
      const { data, error } = await supabase
        .from('signalflow_retention')
        .select('*')
        .eq('brand_id', brandId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }

    case 'seasonal': {
      const { data, error } = await supabase
        .from('signalflow_seasonal')
        .select('month_label,season,skin_concern,orders,units,revenue_gbp,avg_outcome_rating')
        .eq('brand_id', brandId)
        .order('month_start', { ascending: false })
        .limit(36);
      if (error) throw error;
      return data;
    }

    case 'product_intelligence': {
      const [globalRes, countryRes] = await Promise.all([
        supabase
          .from('signalflow_product_intelligence')
          .select('*')
          .eq('brand_id', brandId)
          .maybeSingle(),
        supabase
          .from('signalflow_regional')
          .select('country,total_units,total_revenue_gbp,avg_outcome_rating,order_count')
          .eq('brand_id', brandId)
          .order('total_revenue_gbp', { ascending: false })
          .limit(15),
      ]);
      if (globalRes.error) throw globalRes.error;
      if (countryRes.error) throw countryRes.error;
      return { global: globalRes.data, by_country: countryRes.data };
    }

    default:
      throw new Error(`Unknown SignalFlow section: ${section}`);
  }
}

// ── Data sufficiency assessment — computed from real counts, not Claude ──────

function assessDataSufficiency(aggregates, section) {
  let orderCount = 0;

  if (section === 'regional') {
    orderCount = Array.isArray(aggregates)
      ? aggregates.reduce((sum, r) => sum + (r.order_count || 0), 0)
      : 0;
  } else if (section === 'retention') {
    orderCount = aggregates?.total_orders || 0;
  } else if (section === 'seasonal') {
    orderCount = Array.isArray(aggregates)
      ? aggregates.reduce((sum, r) => sum + (r.orders || 0), 0)
      : 0;
  } else if (section === 'product_intelligence') {
    orderCount = aggregates?.global?.total_units_sold || 0;
  }

  if (orderCount >= SUFFICIENCY_THRESHOLDS.sufficient) return 'sufficient';
  if (orderCount >= SUFFICIENCY_THRESHOLDS.limited)    return 'limited';
  return 'insufficient';
}

// ── Build section-specific prompt; Claude only interprets, never invents ─────

function buildSignalFlowPrompt(section, brandName, aggregates, dataSufficiency) {
  const systemPrompt = `You are a precision beauty-commerce analyst for Plume, a B2B2C platform.
You receive pre-computed analytics aggregates and return a JSON intelligence report.

STRICT RULES — follow every one:
1. Use ONLY the numbers supplied. Never invent, estimate, or extrapolate.
2. Every metric_reference must quote an exact number from the supplied data.
3. Return ONLY valid JSON matching the schema below. No prose, no markdown fences.
4. Keep language concise, specific, and actionable.
5. The data_sufficiency field is already set — do not change it.

Required JSON schema (no other keys permitted):
{
  "headline": "one-sentence strategic takeaway based solely on the data",
  "insights": [
    {
      "title": "short descriptive title",
      "detail": "2–3 sentence explanation citing specific supplied figures",
      "metric_reference": "the single most important number from the data, quoted exactly"
    }
  ],
  "recommendations": [
    { "action": "concrete, specific next step", "rationale": "one-sentence justification citing a data point" }
  ],
  "confidence": "high | medium | low",
  "data_sufficiency": "${dataSufficiency}"
}

Produce 2–3 insights and 2 recommendations.
Set confidence: high = clear pattern in data, medium = some signal, low = limited/noisy data.`;

  const userContent = `Brand: ${brandName}
Section: ${section}
Data sufficiency: ${dataSufficiency}

Pre-computed analytics (all figures are exact, from Supabase):
${JSON.stringify(aggregates, null, 2)}`;

  return { systemPrompt, userContent };
}

// ── GET /api/signalflow/data/:brandId/:section
// Returns raw aggregates for debugging and transparency.

app.get('/api/signalflow/data/:brandId/:section', async (req, res) => {
  const { brandId, section } = req.params;
  if (!SIGNALFLOW_SECTIONS.includes(section)) {
    return res.status(400).json({ error: `section must be one of: ${SIGNALFLOW_SECTIONS.join(', ')}` });
  }
  try {
    const aggregates      = await getSignalFlowAggregates(brandId, section);
    const data_sufficiency = assessDataSufficiency(aggregates, section);
    res.json({ brand_id: brandId, section, data_sufficiency, aggregates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/signalflow/insights
// Main endpoint. Returns cached insights (≤24 h) unless force_refresh is true.
// Body: { brand_id: string, section: string, force_refresh?: boolean }

app.post('/api/signalflow/insights', async (req, res) => {
  const { brand_id, section, force_refresh = false } = req.body;

  if (!brand_id || !section) {
    return res.status(400).json({ error: 'brand_id and section are required' });
  }
  if (!SIGNALFLOW_SECTIONS.includes(section)) {
    return res.status(400).json({ error: `section must be one of: ${SIGNALFLOW_SECTIONS.join(', ')}` });
  }

  try {
    // ── 1. Serve from cache if fresh (≤24 h) and not forced
    if (!force_refresh) {
      const { data: cached } = await supabase
        .from('insights_cache')
        .select('insights_json, generated_at')
        .eq('brand_id', brand_id)
        .eq('section', section)
        .maybeSingle();

      if (cached) {
        const ageHours = (Date.now() - new Date(cached.generated_at).getTime()) / 3_600_000;
        if (ageHours < 24) {
          return res.json({ ...cached.insights_json, cached: true, generated_at: cached.generated_at });
        }
      }
    }

    // ── 2. Resolve brand name (validates brand_id exists)
    const { data: brand, error: brandErr } = await supabase
      .from('brands')
      .select('name')
      .eq('id', brand_id)
      .single();
    if (brandErr) return res.status(404).json({ error: 'Brand not found' });

    // ── 3. Fetch Layer-1 aggregates
    const aggregates       = await getSignalFlowAggregates(brand_id, section);
    const data_sufficiency = assessDataSufficiency(aggregates, section);

    // ── 4. Short-circuit for insufficient data — no Claude call
    if (data_sufficiency === 'insufficient') {
      const emptyResult = {
        headline: 'Not enough data yet.',
        insights: [],
        recommendations: [{
          action: 'Sync more sales data to Plume to activate AI insights for this section.',
          rationale: `At least ${SUFFICIENCY_THRESHOLDS.limited} orders are needed to generate insights.`,
        }],
        confidence: 'low',
        data_sufficiency: 'insufficient',
        cached: false,
        generated_at: new Date().toISOString(),
      };
      return res.json(emptyResult);
    }

    // ── 5. Call Claude — model confirmed from docs.anthropic.com June 2026
    const { systemPrompt, userContent } = buildSignalFlowPrompt(
      section, brand.name, aggregates, data_sufficiency
    );

    const message = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1024,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userContent }],
    });

    const insightsJson = JSON.parse(message.content[0].text);

    // Enforce data_sufficiency — never allow Claude to override it
    insightsJson.data_sufficiency = data_sufficiency;

    // ── 6. Upsert into cache
    await supabase
      .from('insights_cache')
      .upsert(
        { brand_id, section, insights_json: insightsJson, generated_at: new Date().toISOString() },
        { onConflict: 'brand_id,section' }
      );

    res.json({ ...insightsJson, cached: false, generated_at: new Date().toISOString() });

  } catch (err) {
    console.error('SignalFlow insights error:', err);
    res.status(500).json({ error: 'Intelligence engine error', details: err.message });
  }
});

// ── POST /api/signalflow/refresh
// Convenience alias: force_refresh=true shortcut.
// Body: { brand_id: string, section: string }

app.post('/api/signalflow/refresh', async (req, res) => {
  req.body.force_refresh = true;
  // Delegate to the insights route handler by re-invoking it
  const { brand_id, section } = req.body;
  if (!brand_id || !section) {
    return res.status(400).json({ error: 'brand_id and section are required' });
  }
  // Delete existing cache entry so /insights will regenerate
  await supabase
    .from('insights_cache')
    .delete()
    .eq('brand_id', brand_id)
    .eq('section', section);

  // Redirect internally
  req.body.force_refresh = true;
  return res.redirect(307, '/api/signalflow/insights');
});

// ============================================================
// START
// ============================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Plume Skin Intelligence API running on port ${PORT}`);
});

module.exports = app;
