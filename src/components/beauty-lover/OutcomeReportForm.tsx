"use client";
// components/beauty-lover/OutcomeReportForm.tsx
// ----------------------------------------------------------------------------
// Beauty lover input form — one submission = one outcome_reports row.
// Wires to: POST /api/outcome-reports   (Express backend)
//           or:  POST /api/outcome-report  (if you create a Next.js route)
//
// Props: treatments (from your DB), products (from your DB)
// The form derives used_season from used_month automatically (northern hemisphere).
// ----------------------------------------------------------------------------
import { useState } from "react";

interface Treatment { id: string; name: string; }
interface Product   { id: string; name: string; brand_name?: string; }

interface Props {
  treatments:  Treatment[];
  products:    Product[];
  clinicId?:   string;
  brandId?:    string;
  apiBase?:    string;   // defaults to "" (same origin)
  authToken?:  string;   // Supabase session token for auth header
  onSuccess?:  () => void;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const SEASON_FROM_MONTH: Record<number, string> = {
  1:"winter", 2:"winter", 3:"spring", 4:"spring", 5:"spring",
  6:"summer", 7:"summer", 8:"summer", 9:"autumn",10:"autumn",
  11:"autumn",12:"winter",
};

const COMMON_TAGS = [
  "barrier repair","post-treatment","sensitive skin","anti-aging","brightening",
  "hydration","acne","pigmentation","texture","redness","pore minimising","SPF",
];

const C = {
  bg:       "#f4f1fb",
  surface:  "#ffffff",
  border:   "#d9cce8",
  purple:   "#7c3aed",
  pink:     "#ec4899",
  ink:      "#2a1f4a",
  muted:    "#7d6fa0",
  font:     "'Source Sans 3', system-ui, sans-serif",
  display:  "'Cormorant Garamond', Georgia, serif",
  mono:     "'IBM Plex Mono', monospace",
};

const inputStyle: React.CSSProperties = {
  width:"100%", padding:"10px 14px", borderRadius:10,
  border:`1px solid ${C.border}`, fontFamily:C.font, fontSize:14,
  color:C.ink, background:C.surface, outline:"none",
};

const labelStyle: React.CSSProperties = {
  display:"block", fontSize:11, letterSpacing:"0.1em",
  textTransform:"uppercase", color:C.muted,
  fontFamily:C.mono, marginBottom:6,
};

export default function OutcomeReportForm({
  treatments, products, clinicId, brandId,
  apiBase = "", authToken, onSuccess,
}: Props) {
  const [form, setForm] = useState({
    treatment_name: "",
    product_id:     "",
    product_name:   "",
    result_score:   "" as string | number,
    used_month:     "" as string | number,
    country:        "",
    city:           "",
    notes:          "",
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const set = (field: string, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const toggleTag = (tag: string) =>
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.result_score || !form.used_month) {
      setError("Please fill in result score and month used.");
      return;
    }

    const month = Number(form.used_month);
    setSaving(true);
    setError(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

      const res = await fetch(`${apiBase}/api/outcome-reports`, {
        method:  "POST",
        headers,
        body: JSON.stringify({
          clinic_id:      clinicId      || null,
          brand_id:       brandId       || null,
          treatment_name: form.treatment_name || null,
          product_id:     form.product_id     || null,
          product_name:   form.product_name   || null,
          result_score:   Number(form.result_score),
          used_month:     month,
          used_season:    SEASON_FROM_MONTH[month] ?? null,
          country:        form.country || null,
          city:           form.city    || null,
          tags:           selectedTags,
          notes:          form.notes   || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div style={{ background:C.bg, borderRadius:16, padding:32, textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>✓</div>
        <p style={{ fontFamily:C.display, fontSize:22, color:C.purple, marginBottom:8 }}>
          Report submitted
        </p>
        <p style={{ fontFamily:C.font, fontSize:14, color:C.muted }}>
          Thank you — your outcome has been logged and will inform Signal Flow intelligence.
        </p>
        <button
          onClick={() => { setSuccess(false); setForm({ treatment_name:"", product_id:"", product_name:"", result_score:"", used_month:"", country:"", city:"", notes:"" }); setSelectedTags([]); }}
          style={{ marginTop:20, padding:"10px 24px", borderRadius:100, background:C.purple, color:"#fff", border:"none", cursor:"pointer", fontFamily:C.font, fontSize:14 }}
        >
          Log another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ background:C.bg, borderRadius:20, padding:32, maxWidth:600 }}>
      <div style={{ marginBottom:28 }}>
        <p style={{ fontFamily:C.mono, fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase", color:C.purple, marginBottom:6 }}>
          Signal Flow · Beauty Lover Input
        </p>
        <h2 style={{ fontFamily:C.display, fontSize:28, fontWeight:400, color:C.ink, marginBottom:8 }}>
          Log a treatment outcome
        </h2>
        <p style={{ fontFamily:C.font, fontSize:14, color:C.muted, lineHeight:1.6 }}>
          Your real-world results — completely anonymous — help clinics and brands
          understand what actually works for people like you.
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        {/* Treatment */}
        <div>
          <label style={labelStyle}>Treatment used</label>
          {treatments.length > 0 ? (
            <select
              value={form.treatment_name}
              onChange={e => set("treatment_name", e.target.value)}
              style={{ ...inputStyle, appearance:"none" }}
            >
              <option value="">Select…</option>
              {treatments.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          ) : (
            <input
              value={form.treatment_name}
              onChange={e => set("treatment_name", e.target.value)}
              placeholder="e.g. RF Microneedling"
              style={inputStyle}
            />
          )}
        </div>

        {/* Product */}
        <div>
          <label style={labelStyle}>Product used after</label>
          {products.length > 0 ? (
            <select
              value={form.product_id}
              onChange={e => {
                const p = products.find(x => x.id === e.target.value);
                set("product_id", e.target.value);
                set("product_name", p?.name ?? "");
              }}
              style={{ ...inputStyle, appearance:"none" }}
            >
              <option value="">Select…</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.brand_name ? `${p.brand_name} — ` : ""}{p.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={form.product_name}
              onChange={e => set("product_name", e.target.value)}
              placeholder="e.g. Barrier Restore Complex"
              style={inputStyle}
            />
          )}
        </div>
      </div>

      {/* Result score */}
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Result score (1 = poor · 5 = excellent)</label>
        <div style={{ display:"flex", gap:8 }}>
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => set("result_score", n)}
              style={{
                flex:1, padding:"12px 0", borderRadius:10,
                border:`1px solid ${Number(form.result_score)===n ? C.purple : C.border}`,
                background: Number(form.result_score)===n ? `${C.purple}12` : C.surface,
                color: Number(form.result_score)===n ? C.purple : C.muted,
                fontFamily:C.mono, fontSize:16, fontWeight:600, cursor:"pointer",
                transition:"all .15s",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        {/* Month */}
        <div>
          <label style={labelStyle}>Month used</label>
          <select
            value={form.used_month}
            onChange={e => set("used_month", e.target.value)}
            required
            style={{ ...inputStyle, appearance:"none" }}
          >
            <option value="">Select month…</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          {form.used_month && (
            <p style={{ fontFamily:C.mono, fontSize:10, color:C.muted, marginTop:4 }}>
              → {SEASON_FROM_MONTH[Number(form.used_month)]}
            </p>
          )}
        </div>

        {/* Country */}
        <div>
          <label style={labelStyle}>Your country</label>
          <input
            value={form.country}
            onChange={e => set("country", e.target.value)}
            placeholder="e.g. United Kingdom"
            style={inputStyle}
          />
        </div>
      </div>

      {/* City */}
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>City (optional)</label>
        <input
          value={form.city}
          onChange={e => set("city", e.target.value)}
          placeholder="e.g. London"
          style={inputStyle}
        />
      </div>

      {/* Tags */}
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Skin concerns addressed</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:4 }}>
          {COMMON_TAGS.map(tag => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                style={{
                  padding:"5px 12px", borderRadius:100, fontSize:12,
                  border:`1px solid ${active ? C.purple : C.border}`,
                  background: active ? `${C.purple}12` : C.surface,
                  color: active ? C.purple : C.muted,
                  fontFamily:C.font, cursor:"pointer", transition:"all .15s",
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom:24 }}>
        <label style={labelStyle}>Notes (optional)</label>
        <textarea
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          placeholder="What worked? What didn't? Anything notable about the result."
          rows={3}
          style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 }}
        />
      </div>

      {error && (
        <p style={{ fontFamily:C.font, fontSize:13, color:"#ef4444", marginBottom:12 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        style={{
          width:"100%", padding:"14px 0", borderRadius:100,
          background: saving ? `${C.purple}55` : C.purple,
          color:"#fff", border:"none",
          fontFamily:C.font, fontSize:15, fontWeight:500,
          cursor: saving ? "not-allowed" : "pointer",
          transition:"opacity .2s",
        }}
      >
        {saving ? "Submitting…" : "Submit outcome →"}
      </button>

      <p style={{ fontFamily:C.mono, fontSize:10, color:C.muted, textAlign:"center", marginTop:12 }}>
        Your identity is never shared. Only aggregated signals reach clinics and brands.
      </p>
    </form>
  );
}
