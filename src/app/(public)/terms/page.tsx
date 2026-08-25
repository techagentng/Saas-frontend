import type { Metadata } from "next";

import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = { title: "Terms of Service — BookFlow" };

/** Placeholder — content pending. */
export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-5 pb-24 pt-32 sm:px-8">
        <p className="eyebrow w-fit">Legal</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          We&apos;re finalizing our terms of service. This page will be updated before general availability.
        </p>
      </main>
      <Footer />
    </>
  );
}
