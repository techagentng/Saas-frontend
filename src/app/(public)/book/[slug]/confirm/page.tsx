import type { Metadata } from "next";
import { Suspense } from "react";

import { BookingSkeleton } from "../_components/booking-states";
import { PublicBookingLayout } from "../_components/public-booking-layout";
import { BookingReview } from "./_components/booking-review";

type ConfirmPageProps = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Review your booking",
  robots: { index: false },
};

/**
 * The booking review shell (Scheduling S9). Public, no auth. It shows a
 * non-mutating summary of the customer's choices and hands off to the S10
 * booking-creation step, which does not exist yet. It never sends a POST.
 */
export default async function ConfirmPage({ params }: ConfirmPageProps) {
  const { slug } = await params;

  return (
    <Suspense
      fallback={
        <PublicBookingLayout tenant={null}>
          <BookingSkeleton />
        </PublicBookingLayout>
      }
    >
      <BookingReview slug={slug} />
    </Suspense>
  );
}
