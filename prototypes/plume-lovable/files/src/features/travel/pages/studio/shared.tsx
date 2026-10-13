import { useMemo } from "react";
import { HOSTS, MY_BUSINESS } from "../../data/seed";
import { isLive, isPast } from "../../lib/format";
import type { Experience } from "../../types";
import { useTravel } from "../../state/store";

/** Experiences this business hosts or co-hosts. RLS limits hosts to these in production. */
export function useMine() {
  const t = useTravel();
  return useMemo(() => t.state.experiences.filter((e) => e.hostId === MY_BUSINESS || e.coHostId === MY_BUSINESS), [t.state.experiences]);
}

export type EventStatus = "live" | "published" | "draft" | "pending_verification" | "awaiting_partner" | "ended";

export function eventStatus(e: Experience, awaitingPartner: boolean): EventStatus {
  if (e.status === "ended" || (e.status === "published" && isPast(e))) return "ended";
  if (isLive(e)) return "live";
  if (e.status === "draft" && awaitingPartner) return "awaiting_partner";
  if (e.status === "draft") return "draft";
  if (e.status === "pending_verification") return "pending_verification";
  return "published";
}

export const STATUS_LABEL: Record<EventStatus, { label: string; cls: string }> = {
  live: { label: "Happening now", cls: "tv-live-badge" },
  published: { label: "Published", cls: "tv-pill tv-pill-ok" },
  draft: { label: "Draft", cls: "tv-pill tv-pill-soft" },
  pending_verification: { label: "Waiting for license check", cls: "tv-pill tv-pill-warn" },
  awaiting_partner: { label: "Waiting for both approvals", cls: "tv-pill tv-pill-blue" },
  ended: { label: "Ended", cls: "tv-pill tv-pill-soft" },
};

export const coHostName = (e: Experience) => (e.coHostId ? HOSTS[e.coHostId === MY_BUSINESS ? e.hostId : e.coHostId].name : null);
