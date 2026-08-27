import { mockDashboardData } from "@/lib/mock-data";
import { AlertTriangle, Info } from "lucide-react";

export function AttentionCard() {
  const { alerts } = mockDashboardData;

  if (alerts.length === 0) return null;

  return (
    <div className="card p-5 sm:p-6 border-amber-200/60 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-900/10">
      <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Needs attention</h2>
      <ul className="space-y-2.5">
        {alerts.map((alert) => (
          <li key={alert.id} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
            {alert.type === "warning" ? (
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
            )}
            <span>{alert.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}