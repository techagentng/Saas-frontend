import { Plus, Scissors, Users, Clock, Contact, ExternalLink } from "lucide-react";

const actions = [
  { label: "New booking", icon: Plus, primary: true },
  { label: "Add service", icon: Scissors },
  { label: "Add technician", icon: Users },
  { label: "Working hours", icon: Clock },
  { label: "View customers", icon: Contact },
  { label: "Open booking page", icon: ExternalLink },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {actions.map((action) => (
        <button
          key={action.label}
          className="card card-hover flex flex-col items-start gap-2 p-4 text-left"
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.primary ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
            <action.icon className="h-4 w-4" />
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{action.label}</span>
        </button>
      ))}
    </div>
  );
}