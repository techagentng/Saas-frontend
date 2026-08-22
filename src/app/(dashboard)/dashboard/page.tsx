"use client";

import { useAuth } from "@/providers/auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Dashboard</h1>
      {user && (
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Welcome back, {user.email}.</p>
      )}
    </div>
  );
}
