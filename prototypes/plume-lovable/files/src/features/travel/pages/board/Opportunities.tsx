import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { MY_BUSINESS } from "../../data/seed";
import { TODAY } from "../../config";
import { dateSpan, shortDate } from "../../lib/format";
import { cn } from "../../lib/cn";
import type { BoardPost } from "../../types";
import { useTravel } from "../../state/store";
import { Empty } from "../../components/ui";
import { HostHead } from "../../components/HostLayout";

type Filter = "all" | "draft" | "open" | "closed";
const FILTERS: { value: Filter; label: string }[] = [{ value: "all", label: "All" }, { value: "draft", label: "Drafts" }, { value: "open", label: "Open" }, { value: "closed", label: "Closed and archived" }];
const STATUS: Record<BoardPost["status"], { label: string; cls: string }> = { draft: { label: "Draft", cls: "tv-tag-line" }, open: { label: "Open", cls: "tv-tag-sage" }, closed: { label: "Closed", cls: "tv-tag-rose" } };

export function OpportunitiesPage() {
  const t = useTravel();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [closing, setClosing] = useState<string | null>(null);
  const mine = t.state.boardPosts.filter((p) => p.businessId === MY_BUSINESS);
  const list = mine.filter((p) => filter === "all" || p.status === filter)
    .sort((a, b) => ["draft", "open", "closed"].indexOf(a.status) - ["draft", "open", "closed"].indexOf(b.status) || b.postedAt.localeCompare(a.postedAt));
  const reopen = (p: BoardPost) => {
    if (p.deadline < TODAY || p.startDate < TODAY) { navigate({ to: "/travel/board/brief", search: { edit: p.id, reopen: "1" } }); return; }
    t.setPostStatus(p.id, "open"); t.toast("Reopened. Existing proposals keep their status.");
  };
  return (
    <>
      <HostHead title="My opportunities" sub="The briefs you've posted on the partnership board. Closing stops new proposals; it never deletes a brief or changes a proposal's outcome.">
        <Link to="/travel/board/brief" className="tv-btn">Post an opportunity</Link>
      </HostHead>
      <div className="mb-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Filter opportunities">
        {FILTERS.map((f) => {
          const n = f.value === "all" ? mine.length : mine.filter((p) => p.status === f.value).length;
          return <button key={f.value} type="button" role="radio" aria-checked={filter === f.value} className="tv-chip" onClick={() => setFilter(f.value)}>{f.label} <span className="opacity-70">{n}</span></button>;
        })}
      </div>
      {list.length ? (
        <ul className="grid gap-3">
          {list.map((p) => {
            const props = t.state.proposals.filter((x) => x.postId === p.id);
            const fresh = props.filter((x) => x.status === "new").length;
            const passed = p.deadline < TODAY;
            return (
              <li key={p.id} className="tv-hcard">
                <div className="tv-hcard-body sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn("tv-tag", STATUS[p.status].cls)}>{STATUS[p.status].label}{p.status === "closed" && p.closedAt ? ` ${shortDate(p.closedAt)}` : ""}</span>
                      <span className="tv-tag">{p.kind === "seeking" ? "Seeking" : "Offering"}</span>
                      {p.status === "open" && passed && <span className="tv-tag tv-tag-rose">Deadline passed</span>}
                    </div>
                    <h2 className="mt-1.5 text-[26px] leading-tight">{p.title}</h2>
                    <p className="text-tv-ink-2">{p.city}{p.startDate ? `, ${dateSpan(p.startDate, p.endDate || p.startDate)}` : ", dates not set"}. Apply by {p.deadline ? `${shortDate(p.deadline)}, ${p.deadline.slice(0, 4)}` : "not set"}.</p>
                    <p className="mt-1">{p.status === "draft" ? <span className="text-tv-ink-2">Not posted, so no applications yet.</span>
                      : <>{props.length} {props.length === 1 ? "application" : "applications"}{fresh ? `, ${fresh} new` : ""}. <Link to="/travel/board/applications" search={{ post: p.id }} className="tv-link">View applications</Link></>}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Link to="/travel/board/o/$postId" params={{ postId: p.id }} className="tv-btn tv-btn-alt tv-btn-sm">View</Link>
                    <Link to="/travel/board/brief" search={{ edit: p.id }} className="tv-btn tv-btn-alt tv-btn-sm">Edit</Link>
                    {p.status === "draft" && <Link to="/travel/board/brief" search={{ edit: p.id }} className="tv-btn tv-btn-sm">Review and post</Link>}
                    {p.status === "open" && (closing === p.id ? (
                      <span className="flex flex-wrap items-center gap-2"><span className="text-[17px]">Close applications?</span>
                        <button type="button" className="tv-btn tv-btn-sm" onClick={() => { t.setPostStatus(p.id, "closed"); setClosing(null); t.toast("Applications closed. The brief and its applications stay in your records."); }}>Close</button>
                        <button type="button" className="tv-btn tv-btn-alt tv-btn-sm" onClick={() => setClosing(null)}>Keep open</button></span>
                    ) : <button type="button" className="tv-btn tv-btn-soft tv-btn-sm" onClick={() => setClosing(p.id)}>Close applications</button>)}
                    {p.status === "closed" && <button type="button" className="tv-btn tv-btn-soft tv-btn-sm" onClick={() => reopen(p)}>Reopen</button>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : <Empty title="Nothing here yet" action={<Link to="/travel/board/brief" className="tv-btn">Post an opportunity</Link>}>Briefs you save or post appear here.</Empty>}
    </>
  );
}
