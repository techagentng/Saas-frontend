"use client";

import { useAuth } from "@/providers/auth-provider";

import { ServiceSetupCard } from "./_components/service-setup-card";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Dashboard</h1>
        {user && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Welcome back, {user.email}.</p>
        )}
      </header>

      {/* The only dashboard addition in S2: a route into the service catalog.
          It renders nothing for workspaces the catalog doesn't apply to, so
          the page is unchanged for every other vertical. */}
      <ServiceSetupCard />
    </div>
  );
}
