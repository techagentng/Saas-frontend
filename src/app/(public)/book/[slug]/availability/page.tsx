import type { Metadata } from "next";
import { Suspense } from "react";

import { AvailabilityFlow } from "../_components/availability-flow";
import { BookingSkeleton } from "../_components/booking-states";
import { PublicBookingLayout } from "../_components/public-booking-layout";

type AvailabilityPageProps = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Choose a time",
  // The middle of a personal booking flow — nothing for search engines.
  robots: { index: false },
};

/**
 * Steps 2–4 of the public booking journey (Scheduling S9): choose a
 * technician, a date, and a real slot from the S7 engine.
 *
 * Same `(public)` route group as the catalog page — no auth, no dashboard
 * shell. All flow state (`service_id`, `staff_id`, `date`) lives in the URL
 * query string, so a reload or a shared link resumes exactly where it left
 * off; the client component reads it reactively.
 */
export default async function AvailabilityPage({ params }: AvailabilityPageProps) {
  const { slug } = await params;

  // AvailabilityFlow reads flow state from the URL via useSearchParams, which
  // needs a Suspense boundary.
  return (
    <Suspense
      fallback={
        <PublicBookingLayout tenant={null}>
          <BookingSkeleton />
        </PublicBookingLayout>
      }
    >
      <AvailabilityFlow slug={slug} />
    </Suspense>
  );
}
