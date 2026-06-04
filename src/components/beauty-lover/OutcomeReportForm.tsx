"use client";
// components/beauty-lover/OutcomeReportForm.tsx
// ----------------------------------------------------------------------------
// The single source of real data. A beauty lover logs:
//   Treatment booked  +  Product used after  ->  Results
//   + the month/season they used it / had the treatment   (Seasonal)
//   + the city/country they live in                        (Regional)
// On submit it inserts one row into outcome_reports. RLS guarantees they can
// only write their own row. That row updates every intelligence model.
//
// Plume design system:
//   purple #7c3aed · pink #ec4899 · lavender surface
//   Cormorant Garamond (display) · Source Sans 3 (body) · IBM Plex Mono (data)
// Assumes Tailwind + the css variables in globals.css (see CURSOR_PROMPT.md).
// ----------------------------------------------------------------------------
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Option = { id: string; name: string };

const RESULT_TAGS = [
  "hydration", "brightness", "firmness", "acne_reduction",
  "even_tone", "reduced_redness", "texture", "glow", "fine_lines",
];

const SEASONS = [
  { key: "spring", label: "Spring", months: [3, 4, 5] },
  { key: "summer", label: "Summer", months: [6, 7, 8] },
  { key: "autumn", label: "Autumn", months: [9, 10, 11] },
  { key: "winter", label: "Winter", months: [12, 1, 2] },
] as const;

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
];

export default function OutcomeReportForm({
  treatments,
  products,
}: {
  treatments: (Option & { clinic_id: string })[];
  products:   (Option & { brand_id: string })[];
}) {
  const supabase = createClientComponentClient();

  const [treatmentId, setTreatmentId] = useState("");
  const [productId,   setProductId]   = useState("");
  const [rating,      setRating]      = useState(0);
  const [tags,        setTags]        = useState<string[]>([]);
  const [summary,     setSummary]     = useState("");
  const [season,      setSeason]      = useState<string>("");
  const [usedMonth,   setUsedMonth]   = useState<number | null>(null);
  const [city,        setCity]        = useState("");
  const [country,     setCountry]     = useState("");
  const [status,      setStatus]      = useState<"idle" | "saving" | "done" | "error">("idle");

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const pickMonth = (m: number) => {
    setUsedMonth(m);
    const s = SEASONS.find((s) => (s.months as readonly number[]).includes(m));
    if (s) setSeason(s.key);
  };

  async function submit() {
    if (!rating || (!treatmentId && !productId)) return;
    setStatus("saving");

    const t = treatments.find((x) => x.id === treatmentId);
    const p = products.find((x) => x.id === productId);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setStatus("error");

    const { error } = await supabase.from("outcome_reports").insert({
      beauty_lover_id:  user.id,
      treatment_id:     treatmentId || null,
      clinic_id:        t?.clinic_id ?? null,
      product_id:       productId || null,
      brand_id:         p?.brand_id ?? null,
      result_rating:    rating,
      result_tags:      tags,
      result_summary:   summary || null,
      used_month:       usedMonth,
      treatment_month:  usedMonth,
      used_season:      season || null,
      city:             city || null,
      country:          country || null,
    });

    setStatus(error ? "error" : "done");
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl bg-[var(--plume-lavender,#f4f1fb)] p-8 text-center">
        <h3 className="font-[Cormorant_Garamond] text-2xl text-[#7c3aed]">Signal received</h3>
        <p className="mt-2 font-[Source_Sans_3] text-sm text-neutral-600">
          Your outcome is now part of Plume&rsquo;s intelligence. Thank you for sharing.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl bg-[var(--plume-lavender,#f4f1fb)] p-6 sm:p-8">
      <h2 className="font-[Cormorant_Garamond] text-3xl text-[#7c3aed]">Share your outcome</h2>
      <p className="mt-1 font-[Source_Sans_3] text-sm text-neutral-600">
        Tell us what you booked, what you used, and how it went. Your input trains Plume&rsquo;s
        Outcome Intelligence.
      </p>

      {/* Treatment + Product */}
      <Field label="Treatment you booked">
        <Select value={treatmentId} onChange={setTreatmentId} options={treatments} placeholder="Select a treatment" />
      </Field>
      <Field label="Product you used after">
        <Select value={productId} onChange={setProductId} options={products} placeholder="Select a product" />
      </Field>

      {/* Result rating */}
      <Field label="Your result">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`h-10 w-10 rounded-full font-[IBM_Plex_Mono] text-sm transition
                ${rating >= n ? "bg-[#ec4899] text-white" : "bg-white text-neutral-400"}`}
            >
              {n}
            </button>
          ))}
        </div>
      </Field>

      {/* Result tags */}
      <Field label="What improved">
        <div className="flex flex-wrap gap-2">
          {RESULT_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className={`rounded-full px-3 py-1 text-xs font-[Source_Sans_3] capitalize transition
                ${tags.includes(t) ? "bg-[#7c3aed] text-white" : "bg-white text-neutral-600"}`}
            >
              {t.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </Field>

      {/* Optional summary */}
      <Field label="Anything to add (optional)">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-purple-100 bg-white p-3 font-[Source_Sans_3] text-sm outline-none focus:border-[#7c3aed]"
          placeholder="My skin looked noticeably brighter after three weeks…"
        />
      </Field>

      {/* Seasonal — month picker grouped by season */}
      <Field label="When did you use it / have the treatment?">
        <div className="space-y-2">
          {SEASONS.map((s) => (
            <div key={s.key}>
              <span className="font-[IBM_Plex_Mono] text-[10px] uppercase tracking-wider text-[#7c3aed]">
                {s.label}
              </span>
              <div className="mt-1 flex gap-1">
                {s.months.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => pickMonth(m)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-[Source_Sans_3] transition
                      ${usedMonth === m ? "bg-[#ec4899] text-white" : "bg-white text-neutral-500"}`}
                  >
                    {MONTH_NAMES[m - 1]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Field>

      {/* Regional */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="City you live in">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-purple-100 bg-white p-3 font-[Source_Sans_3] text-sm outline-none focus:border-[#7c3aed]"
            placeholder="Lisbon"
          />
        </Field>
        <Field label="Country">
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-xl border border-purple-100 bg-white p-3 font-[Source_Sans_3] text-sm outline-none focus:border-[#7c3aed]"
            placeholder="Portugal"
          />
        </Field>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={status === "saving" || !rating || (!treatmentId && !productId)}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#ec4899] py-3 font-[Source_Sans_3] font-semibold text-white disabled:opacity-40"
      >
        {status === "saving" ? "Sending signal…" : "Submit outcome"}
      </button>

      {status === "error" && (
        <p className="mt-2 text-center text-xs text-red-500">
          Something went wrong — please try again.
        </p>
      )}
    </div>
  );
}

/* ── Presentational helpers ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <label className="mb-1.5 block font-[Source_Sans_3] text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({
  value, onChange, options, placeholder,
}: {
  value:       string;
  onChange:    (v: string) => void;
  options:     Option[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-purple-100 bg-white p-3 font-[Source_Sans_3] text-sm outline-none focus:border-[#7c3aed]"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </select>
  );
}
