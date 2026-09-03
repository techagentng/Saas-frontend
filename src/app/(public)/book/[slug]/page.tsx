import type { Metadata } from "next";

import { getBookingUrl } from "@/lib/config/public-url";

import { BookingExperience } from "./_components/booking-experience";

type BookPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Public route — lives in the `(public)` group, so it inherits none of the
 * `(dashboard)` gates: no `ProtectedRoute`, no `TenantGate`, no
 * `DashboardShell`, no redirect to `/login`. An incognito browser reaches it
 * directly.
 */
export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { slug } = await params;

  let canonical: string | undefined;
  try {
    canonical = getBookingUrl(slug);
  } catch {
    // NEXT_PUBLIC_APP_URL not configured in this environment — skip the
    // canonical tag rather than failing the render.
    canonical = undefined;
  }

  return {
    title: "Book an appointment",
    description: "Choose a service to book online.",
    alternates: canonical ? { canonical } : undefined,
  };
}

export default async function BookSlugPage({ params }: BookPageProps) {
  const { slug } = await params;

  return <BookingExperience slug={slug} />;
}
