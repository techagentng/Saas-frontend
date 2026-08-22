import type { ComponentType, SVGProps } from "react";

import type { Permission } from "@/types/permission";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Omit for items every authenticated user can see; gated items are filtered via Phase B's capability system. */
  permission?: Permission;
};
