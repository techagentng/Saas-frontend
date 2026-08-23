import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { BusinessTypes } from "@/components/marketing/BusinessTypes";
import { ProblemSolution } from "@/components/marketing/ProblemSolution";
import { Features } from "@/components/marketing/Features";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { CustomerBooking } from "@/components/marketing/CustomerBooking";
import { TenantWorkspaces } from "@/components/marketing/TenantWorkspaces";
import { Branding } from "@/components/marketing/Branding";
import { Teams } from "@/components/marketing/Teams";
import { Security } from "@/components/marketing/Security";
import { Pricing } from "@/components/marketing/Pricing";
import { FAQ } from "@/components/marketing/FAQ";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "BookFlow — Modern Booking Infrastructure for Businesses",
  description: "Run your booking business from one place. Create your business page, manage appointments, organize staff and services, and let customers book online from anywhere.",
  openGraph: {
    title: "BookFlow — Modern Booking Infrastructure for Businesses",
    description: "Run your booking business from one place. Create your business page, manage appointments, organize staff and services, and let customers book online from anywhere.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <BusinessTypes />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <DashboardPreview />
        <CustomerBooking />
        <TenantWorkspaces />
        <Branding />
        <Teams />
        <Security />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}