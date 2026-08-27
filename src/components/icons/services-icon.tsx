import type { SVGProps } from "react";

/** Matches DashboardIcon's construction exactly: 24-box, stroked, no fill. */
export function ServicesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
      <circle cx="18.5" cy="17" r="2.5" />
    </svg>
  );
}
