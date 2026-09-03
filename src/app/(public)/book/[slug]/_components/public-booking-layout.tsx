import type { ReactNode } from "react";

import type { PublicTenant } from "@/modules/public-booking/types";

import { BookingVisualPanel } from "./booking-visual-panel";

/**
 * The premium two-column shell for the public booking experience.
 *
 *   desktop  — booking column ~60%  ·  editorial panel ~40% (tall, sticky)
 *   tablet   — ~65 / 35
 *   mobile   — single column; the panel becomes a short editorial hero above
 *              the content
 *
 * The booking column carries all functionality; nothing is ever placed over
 * the image. Owns the page `<main>` and the outer background so every state
 * of the flow (catalogue, availability, review, empty) sits in the same
 * frame.
 */
export function PublicBookingLayout({
  tenant,
  children,
}: {
  tenant: Pick<PublicTenant, "slug"> | null | undefined;
  children: ReactNode;
}) {
  return (
    <main className="min-h-full bg-[#FBF7F3] dark:bg-slate-950">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-8 md:grid-cols-[1.9fr_1fr] md:gap-8 md:py-10 lg:grid-cols-[3fr_2fr] lg:gap-12">
        <BookingVisualPanel
          tenant={tenant}
          className="h-40 w-full sm:h-52 md:order-2 md:h-[calc(100vh-5rem)] md:sticky md:top-10 md:self-start"
        />

        <div className="md:order-1 md:min-w-0 md:py-2">{children}</div>
      </div>
    </main>
  );
}

/**
 * A centered, image-free frame for the terminal states (not found, unsupported
 * vertical, hard error). These are "there is nothing to book here" — a big
 * editorial image would be noise.
 */
export function PublicBookingTerminal({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-full items-center justify-center bg-[#FBF7F3] px-4 py-16 dark:bg-slate-950">
      <div className="w-full max-w-md text-center">{children}</div>
    </main>
  );
}
