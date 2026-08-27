import { mockDashboardData } from "@/lib/mock-data";
import { ArrowRight } from "lucide-react";

export function RecentCustomers() {
  const { recentCustomers } = mockDashboardData;

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent Customers</h2>
        <a href="#" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </a>
      </div>
      <div className="space-y-3">
        {recentCustomers.map((customer) => (
          <div key={customer.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {customer.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{customer.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{customer.visits} visits</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Last: {customer.lastVisit}</p>
          </div>
        ))}
      </div>
    </div>
  );
}