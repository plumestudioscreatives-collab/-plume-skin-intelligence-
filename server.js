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
// START
// ============================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Plume Skin Intelligence API running on port ${PORT}`);
});

module.exports = app;
