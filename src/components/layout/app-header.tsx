import { AccountMenu } from "@/components/layout/account-menu";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Booking SaaS</span>
      <AccountMenu />
    </header>
  );
}
