import type { ComponentType, SVGProps } from "react";

import type { Permission } from "@/types/permission";
import type { BusinessType } from "@/types/tenant";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Omit for items every authenticated user can see; gated items are filtered via Phase B's capability system. */
  permission?: Permission;
  /**
   * Vertical gate (Scheduling S2). Omit for items every business type sees.
   *
   * Deliberately independent of `permission`: a capability answers "may this
   * user do it", a business type answers "does this product surface exist for
   * this workspace at all". Both must pass — see `filterNavItems`. This is the
   * narrow nav predicate S2 owns; it is not the broader vertical-dashboard
   * feature (onboarding plan F7), which stays unstarted.
   */
  businessTypes?: readonly BusinessType[];
};
