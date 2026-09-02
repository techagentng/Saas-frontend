import { CalendarDays, Clock, Contact, Users } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { DashboardIcon } from "@/components/icons/dashboard-icon";
import { ServicesIcon } from "@/components/icons/services-icon";
import { SCHEDULING_BUSINESS_TYPES } from "@/lib/tenant/scheduling";
import type { NavItem } from "@/types/navigation";
import type { Permission } from "@/types/permission";
import type { BusinessType } from "@/types/tenant";

const TeamIcon = Users as ComponentType<SVGProps<SVGSVGElement>>;
const AvailabilityIcon = Clock as ComponentType<SVGProps<SVGSVGElement>>;
const BookingsIcon = CalendarDays as ComponentType<SVGProps<SVGSVGElement>>;
const CustomersIcon = Contact as ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Configuration-driven sidebar nav. Entries are added only as the real route
 * and its confirmed backend permission actually land — no placeholder items are
 * fabricated for features that do not exist yet (Availability, Bookings,
 * Customers all remain absent by design).
 *
 * "Services" is vertical-gated: it exists only for the business types that
 * use the appointment-scheduling booking model, and only for a user the
 * backend has granted `service.read`.
 *
 * "Team" (Scheduling S3) is deliberately NOT vertical-gated. Unlike a service
 * catalog, a staff roster is universal — a restaurant, a hotel, and a
 * transport business all have staff — so the schema carries no business-type
 * coupling and neither does this entry. It is permission-gated on
 * `staff.read` alone.
 */
export const dashboardNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  {
    label: "Services",
    href: "/dashboard/services",
    icon: ServicesIcon,
    permission: "service.read",
    businessTypes: SCHEDULING_BUSINESS_TYPES,
  },
  {
    label: "Team",
    href: "/dashboard/team",
    icon: TeamIcon,
    permission: "staff.read",
  },
];

/**
 * Roadmap entries, rendered as disabled rows with a "Soon" badge — never as
 * links. They exist so the navigation communicates the shape of the product
 * instead of looking unfinished, without the dishonesty of a clickable item
 * that 404s.
 *
 * Deliberately kept out of `dashboardNavItems`: that list is the set of
 * routes that actually exist and is what `filterNavItems` gates. Promoting one
 * of these is a two-line move — add `href` + `permission` to the real list,
 * delete the row here — once the feature that backs it ships. "Technicians"
 * (S4) was the most recent promotion, now `dashboardNavItems`' "Team" entry.
 */
export type UpcomingNavItem = {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** The plan feature that will make this real, for whoever picks it up next. */
  lands: string;
};

export const upcomingNavItems: UpcomingNavItem[] = [
  { label: "Availability", icon: AvailabilityIcon, lands: "S6" },
  { label: "Bookings", icon: BookingsIcon, lands: "S11" },
  { label: "Customers", icon: CustomersIcon, lands: "S11" },
];

/**
 * Both gates, composed — a nav item is shown only when the user's capability
 * check AND the workspace's vertical check pass. Kept a pure function rather
 * than inline JSX so each predicate is testable on its own and in combination.
 *
 * Fails closed in every unknown case, matching PermissionsProvider: an empty
 * permission set (no tenant yet, permissions still loading, or a 403) hides
 * every gated item, and a null `businessType` (a pre-F1 legacy tenant, or no
 * tenant selected) hides every vertical-gated one.
 */
export function filterNavItems(
  items: readonly NavItem[],
  context: { permissions: Set<Permission>; businessType: BusinessType | null | undefined }
): NavItem[] {
  return items.filter((item) => {
    if (item.permission && !context.permissions.has(item.permission)) return false;
    if (item.businessTypes) {
      if (context.businessType == null) return false;
      if (!item.businessTypes.includes(context.businessType)) return false;
    }
    return true;
  });
}
