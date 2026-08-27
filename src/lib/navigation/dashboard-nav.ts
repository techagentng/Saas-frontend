import { DashboardIcon } from "@/components/icons/dashboard-icon";
import { ServicesIcon } from "@/components/icons/services-icon";
import { SCHEDULING_BUSINESS_TYPES } from "@/lib/tenant/scheduling";
import type { NavItem } from "@/types/navigation";
import type { Permission } from "@/types/permission";
import type { BusinessType } from "@/types/tenant";

/**
 * Configuration-driven sidebar nav. Entries are added only as the real route
 * and its confirmed backend permission actually land — no placeholder items are
 * fabricated for features that do not exist yet (Technicians, Availability,
 * Bookings, Customers all remain absent by design).
 *
 * "Services" is the first vertical-gated entry: it exists only for the
 * business types that use the appointment-scheduling booking model, and only
 * for a user the backend has granted `service.read`.
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
