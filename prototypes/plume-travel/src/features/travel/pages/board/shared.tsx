import type { ReactNode } from "react";
import { BadgeCheck } from "lucide-react";
import { HOSTS, MY_BUSINESS } from "../../data/seed";
import { TODAY } from "../../config";
import type { BoardPost, BoardProposal } from "../../types";
import { Modal, SampleTag } from "../../components/ui";

export const initials = (name: string) => name.replace(/^(Les |The )/, "").split(/\s+/).filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join("");

/** Host name, organization type and an honestly labeled profile-check status. */
export function HostLine({ id, small }: { id: string; small?: boolean }) {
  const h = HOSTS[id];
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="tv-hmark" aria-hidden="true" style={small ? { width: 34, minWidth: 34, height: 34, fontSize: 18 } : undefined}>{initials(h.name)}</span>
      <span className="min-w-0 leading-tight">
        <b className="block truncate">{h.name}{id === MY_BUSINESS ? " (you)" : ""}</b>
        <span className="text-[16px] text-tv-ink-2">{h.hostType}, {h.city} · {h.verified
          ? <span className="inline-flex items-center gap-1"><BadgeCheck size={15} className="text-tv-accent" aria-hidden="true" />Profile checked <SampleTag>sample</SampleTag></span>
          : "Profile not yet checked"}</span>
      </span>
    </span>
  );
}

/** Applications close at the deadline; closing early is the owner's choice. */
export const acceptingProposals = (p: BoardPost) => p.status === "open" && p.deadline >= TODAY;

export const STATUS_TEXT: Record<BoardProposal["status"], string> = { new: "New", shortlisted: "Shortlisted", accepted: "Accepted", declined: "Declined", withdrawn: "Withdrawn" };

const STEPS: [string, string][] = [
  ["Share your idea.", "Describe the experience, who you need, what you offer, and the commercial terms."],
  ["Meet potential partners.", "Receive proposals or respond to opportunities that fit your organization."],
  ["Choose and agree.", "Shortlist, discuss responsibilities, and record both parties' agreement to begin planning."],
  ["Plan together.", "Keep your checklist, messages, assets, dates, and responsibilities in one shared workspace."],
  ["Create the experience.", "Turn the approved plan into an event draft, review the public details together, then publish through a separate action."],
];

export function BoardHowItWorks({ onClose, action }: { onClose: () => void; action?: ReactNode }) {
  return (
    <Modal open onClose={onClose} title="How the partnership board works">
      <ol className="tv-host -mx-1 rounded-[16px] bg-tv-page px-4 py-1" aria-label="Steps">
        {STEPS.map(([title, text], i) => (
          <li key={title} className="tv-step"><b aria-hidden="true">{i + 1}</b><span><strong className="block text-[21px]">{title}</strong><span className="text-tv-ink-2">{text}</span></span></li>
        ))}
      </ol>
      <p className="tv-note mt-4">A proposal or shortlist is not a booking, contract, or payment. An opportunity being posted does not create a public experience.</p>
      {action && <div className="mt-4 flex justify-end">{action}</div>}
    </Modal>
  );
}
