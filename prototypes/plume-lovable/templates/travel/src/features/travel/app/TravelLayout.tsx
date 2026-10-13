// The /travel layout on plumestudioscreatives.com, inside the site's AppShell (see
// src/routes/travel.tsx). Until launch it's a design preview with sample data: everyone gets the
// preview bar and the "View as" switcher, and nothing is saved beyond their own browser.
// Booking stops with "opens October 30" (PLUME_LAUNCH) instead of taking a booking.
import { PLUME_LAUNCH } from "@/features/launch";
import { TRAVEL_LAUNCHED } from "../config";
import { TravelProvider } from "../state/store";
import { TravelShell } from "../components/Shell";

export function TravelLayout() {
  if (!TRAVEL_LAUNCHED) {
    return <TravelProvider initialRole="host" launch={PLUME_LAUNCH ?? undefined}><TravelShell app canPreview /></TravelProvider>;
  }
  // After launch the role comes from the signed-in account (wired up in the backend steps).
  return <TravelProvider lockRole="lover"><TravelShell app canPreview={false} /></TravelProvider>;
}
