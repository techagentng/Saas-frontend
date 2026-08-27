import { mockDashboardData } from "@/lib/mock-data";
import { ArrowRight } from "lucide-react";

export function TechnicianOverview() {
  const { technicians } = mockDashboardData;

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Technicians</h2>
        <a href="#" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-1">
          Manage <ArrowRight className="h-3 w-3" />
        </a>
      </div>
      <div className="space-y-3">
        {technicians.map((tech) => (
          <div key={tech.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${tech.color}`}>
                {tech.initials}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{tech.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  {tech.status === "Off today" ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                  ) : tech.status === "Available" ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  )}
                  {tech.status}
                </p>
              </div>
            </div>
            <div className="text-right">
              {tech.apptsToday > 0 ? (
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{tech.apptsToday} appts</p>
              ) : (
                <p className="text-xs text-slate-400">—</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}