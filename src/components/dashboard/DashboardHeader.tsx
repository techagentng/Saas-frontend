import { CalendarDays, Plus, ExternalLink } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Good morning, Nnamdi
        </h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">Luxe Nails Studio</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Wednesday, 27 August
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-secondary h-10 px-4 text-sm">
          <ExternalLink className="h-4 w-4" />
          View booking page
        </button>
        <button className="btn-primary h-10 px-4 text-sm">
          <Plus className="h-4 w-4" />
          New booking
        </button>
      </div>
    </div>
  );
}