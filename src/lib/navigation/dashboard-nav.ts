import { DashboardIcon } from "@/components/icons/dashboard-icon";
import type { NavItem } from "@/types/navigation";

/**
 * Configuration-driven sidebar nav. Only "Dashboard" exists today —
 * business features (bookings, staff, services, ...) are out of scope for
 * this phase and their permission identifiers aren't defined by the
 * backend yet, so no placeholder entries are fabricated for them. Add
 * entries here as real routes + confirmed permission identifiers land;
 * nothing else needs to change (see components/layout/sidebar.tsx).
 */
export const dashboardNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
];
