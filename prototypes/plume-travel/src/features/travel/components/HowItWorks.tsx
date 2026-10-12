import { createContext, useContext, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FEATURES, type Feature } from "../copy";
import { HOSTS, MY_BUSINESS } from "../data/seed";
import { useTravel } from "../state/store";
import { Modal } from "./ui";

const Ctx = createContext<{ open: () => void }>({ open: () => {} });
export const useHowItWorks = () => useContext(Ctx);

/** The How it works guide: every feature with its one-line description, each linking to that part of the app. */
export function HowItWorksProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open: () => setOpen(true) }}>
      {children}
      {open && <HowItWorksDialog onClose={() => setOpen(false)} />}
    </Ctx.Provider>
  );
}

function HowItWorksDialog({ onClose }: { onClose: () => void }) {
  const t = useTravel();
  const navigate = useNavigate();
  const go = (f: Feature) => {
    if (f.audience === "host" && t.state.role === "lover") { t.setRole("host"); t.toast(`Now viewing as Host, ${HOSTS[MY_BUSINESS].name}`); }
    if (f.audience === "lover" && t.state.role !== "lover" && f.key !== "discover") { t.setRole("lover"); t.toast("Now viewing as a beauty lover"); }
    onClose();
    navigate({ to: f.to as "/travel" }); // concrete paths from copy.ts
  };
  const group = (audience: Feature["audience"], title: string, id: string) => (
    <section aria-labelledby={id}>
      <h3 id={id} className="mb-2 text-[24px]">{title}</h3>
      <ul className="grid gap-1.5">
        {FEATURES.filter((f) => f.audience === audience).map((f) => (
          <li key={f.key}>
            <button type="button" onClick={() => go(f)} className="grid w-full gap-0.5 rounded-[16px] border border-transparent px-4 py-3 text-left transition-colors hover:border-tv-line hover:bg-tv-surface">
              <span className="text-[21px] font-bold leading-tight">{f.name}</span>
              <span className="tv-sub">{f.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
  return (
    <Modal open onClose={onClose} title="How Plume Travel works" wide>
      <p className="tv-muted -mt-1 mb-5 max-w-[60ch]">Every beauty experience in one place: how to get in, how it will feel, what you tried, and what you missed. Tap any feature to go there.</p>
      <div className="grid gap-7 md:grid-cols-2">
        {group("lover", "For beauty lovers", "hiw-lover")}
        {group("host", "For brands, med spas, resorts and hosts", "hiw-host")}
      </div>
      <p className="tv-muted mt-6 text-[17px]">Free for beauty lovers, always. Free for hosts during launch, and ticket sales are commission-free.</p>
    </Modal>
  );
}
