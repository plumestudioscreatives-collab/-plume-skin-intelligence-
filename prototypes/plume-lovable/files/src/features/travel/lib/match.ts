import type { Experience, Sensory, SensoryProfile } from "../types";

// Shared 0–2 scales used by experience_sensory and sensory_profiles.
export const SCALES = {
  energy: ["Quiet", "Social", "Lively"],
  fragrance: ["None", "Light", "Strong"],
  group: ["Small", "Medium", "Large"],
  touch: ["None", "Optional", "Part of it"],
} as const;

export const FIELD_LABEL: Record<keyof SensoryProfile, string> = { energy: "Energy", fragrance: "Fragrance", group: "Group size", touch: "Touch" };
export const NOT_PROVIDED = "Not provided";

type Score = 0 | 1 | 2 | null;

/** Host-provided values on the shared scales. null when the host hasn't provided one. */
export function sensoryScores(s: Sensory): Record<keyof SensoryProfile, Score> {
  return {
    energy: s.energy == null ? null : s.energy === "Lively" ? 2 : s.energy === "Social" ? 1 : 0, // Reflective scores like Quiet
    fragrance: s.fragrance == null ? null : s.fragrance === "Strong" ? 2 : s.fragrance === "Light" ? 1 : 0,
    group: s.group == null ? null : s.group === "Large" ? 2 : s.group === "Medium" ? 1 : 0,
    touch: s.touch == null ? null : s.touch === "Part of the experience" ? 2 : s.touch === "Optional" ? 1 : 0, // consultations only = no touch
  };
}

export type MatchDiff = { key: keyof SensoryProfile; diff: number; theirs: string; yours: string; missing: boolean };

/**
 * Sensory Match out of 10: start at 10, subtract 1.25 per step of difference on each scale,
 * minimum 1, rounded. Fields the host hasn't provided aren't scored. One function so
 * SignalFlow data can be folded in later.
 */
export function sensoryMatch(e: Pick<Experience, "sensory">, profile: SensoryProfile) {
  const x = sensoryScores(e.sensory);
  const keys = Object.keys(FIELD_LABEL) as (keyof SensoryProfile)[];
  const diffs: MatchDiff[] = keys.map((k) => {
    const v = x[k];
    return { key: k, diff: v == null ? 0 : Math.abs(v - profile[k]), theirs: v == null ? NOT_PROVIDED : SCALES[k][v], yours: SCALES[k][profile[k]], missing: v == null };
  });
  const score = Math.max(1, Math.round(10 - 1.25 * diffs.reduce((n, d) => n + d.diff, 0)));
  return { score, diffs };
}

/** "Energy: lively. You prefer quiet" */
export function whyLine(d: MatchDiff) {
  const label = FIELD_LABEL[d.key];
  if (d.missing) return `${label}: not provided by the host, so it isn't scored`;
  if (!d.diff) return `${label}: ${d.theirs.toLowerCase()}, as you like it`;
  return `${label}: ${d.theirs.toLowerCase()}. You prefer ${d.yours.toLowerCase()}`;
}
