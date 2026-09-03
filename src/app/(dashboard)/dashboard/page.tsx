import { DashboardView } from "./_components/dashboard-view";

/**
 * The dashboard adapts to the selected workspace's `business_type` — the
 * appointment-oriented prototype widgets render only for a vertical whose
 * capability set includes them (see `DashboardView` and
 * `lib/vertical/experience.ts`). This page is the same shell for every
 * vertical; there is no second dashboard.
 */
export default function DashboardPage() {
  return <DashboardView />;
}
