import { mockDashboardData, formatCurrency } from "@/lib/mock-data";

export function PopularServices() {
  const { popularServices } = mockDashboardData;
  const maxBookings = Math.max(...popularServices.map(s => s.bookings));

  return (
    <div className="card p-5 sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Popular Services</h2>
      <div className="space-y-4">
        {popularServices.map((service) => (
          <div key={service.name}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{service.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(service.revenue)}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className={`h-full rounded-full ${service.color}`} style={{ width: `${(service.bookings / maxBookings) * 100}%` }}></div>
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-16 text-right">{service.bookings} bookings</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}