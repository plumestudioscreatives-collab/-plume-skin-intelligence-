// Types for App.jsx (Plume Media is written in JavaScript; the app's TypeScript only needs this).
import type { JSX } from "react";

export interface MediaRoute {
  name: string;
  params: Record<string, string | number | boolean | undefined>;
}

export function PlumeMediaApp(props?: {
  route?: MediaRoute;
  onNavigate?: (route: MediaRoute) => void;
  /** Before Plume opens: stop paid checkout with "opens {opensOn}" and link to the waitlist. */
  launch?: { opensOn: string; waitlistHref: string } | null;
}): JSX.Element;
