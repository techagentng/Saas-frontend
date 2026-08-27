import { mockDashboardData } from "@/lib/mock-data";
import { ArrowRight, Clock } from "lucide-react";

export function TodaySchedule() {
  const { schedule } = mockDashboardData;

  return (
    <div className="card h-full p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Today&apos;s Schedule</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{schedule.length} appointments</p>
        </div>
        <a href="#" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-1">
          View full schedule <ArrowRight className="h-3 w-3" />
        </a>
      </div>

      <div className="space-y-4">
        {schedule.map((apt) => (
          <div key={apt.id} className="flex items-start gap-4 group">
            <div className="flex flex-col items-center pt-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{apt.time}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5 mt-0.5">
                <Clock className="h-2.5 w-2.5" /> {apt.duration}
              </span>
            </div>
            <div className="relative flex h-2 w-2 items-center justify-center pt-3">
              <span className="absolute inline-flex h-2 w-2 rounded-full bg-brand-400 opacity-75 group-hover:scale-125 transition-transform"></span>
            </div>
            <div className="flex-1 border-b border-slate-100 pb-4 dark:border-slate-800 group-last:border-0 group-last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{apt.service}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{apt.customer} • {apt.tech}</p>
                </div>
                <span className={
                  apt.status === "Confirmed" 
                    ? "px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-500/30"
                    : "px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/30"
                }>
                  {apt.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}