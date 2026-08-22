"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";

export function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Booking SaaS</span>
      <div className="flex items-center gap-4">
        {user && <span className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</span>}
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm font-medium text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
