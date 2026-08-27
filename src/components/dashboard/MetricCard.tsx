import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  delta?: string;
  deltaDirection?: "up" | "down" | "neutral";
  subtext?: string;
}

export function MetricCard({ title, value, icon: Icon, delta, deltaDirection, subtext }: MetricCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
        <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta && (
          <span className={cn(
            "inline-flex items-center gap-0.5 font-medium",
            deltaDirection === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          )}>
            {deltaDirection === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta}
          </span>
        )}
        {subtext && <span className="text-slate-400 dark:text-slate-500">{subtext}</span>}
      </div>
    </div>
  );
}