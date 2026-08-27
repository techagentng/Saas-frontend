import { mockDashboardData } from "@/lib/mock-data";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

export function BookingReadiness() {
  const { readiness } = mockDashboardData;
  const completed = readiness.filter(r => r.done).length;
  const total = readiness.length;
  const percentage = (completed / total) * 100;

  return (
    <div className="card p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Booking Readiness</h2>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{completed} of {total} complete</span>
      </div>
      
      <div className="mb-4 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
      </div>

      <ul className="space-y-2">
        {readiness.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5">
            {item.done ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
            )}
            <span className={`text-xs ${item.done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-white font-medium'}`}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
      
      {!readiness.every(r => r.done) && (
        <button className="mt-4 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-1">
          Finish setup <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}