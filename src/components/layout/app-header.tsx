import { AccountMenu } from "@/components/layout/account-menu";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Booking SaaS</span>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  );
}
