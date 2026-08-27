import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TodaySchedule } from "@/components/dashboard/TodaySchedule";
import { RevenueOverview } from "@/components/dashboard/RevenueOverview";
import { TechnicianOverview } from "@/components/dashboard/TechnicianOverview";
import { PopularServices } from "@/components/dashboard/PopularServices";
import { BookingReadiness } from "@/components/dashboard/BookingReadiness";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentCustomers } from "@/components/dashboard/RecentCustomers";
import { AttentionCard } from "@/components/dashboard/AttentionCard";
import { mockDashboardData, formatCurrency } from "@/lib/mock-data";
import { CalendarCheck, DollarSign, Briefcase, Users } from "lucide-react";

export default function DashboardPage() {
  const { kpis } = mockDashboardData;

  return (
    <div className="space-y-6">
      <DashboardHeader />

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Today's Bookings" 
          value={kpis.todayBookings.toString()} 
          icon={CalendarCheck}
          delta={`+${kpis.todayBookings - kpis.yesterdayBookings}`}
          deltaDirection="up"
          subtext="from yesterday"
        />
        <MetricCard 
          title="Today's Revenue" 
          value={formatCurrency(kpis.todayRevenue)} 
          icon={DollarSign}
          delta={`+${kpis.revenueChange}%`}
          deltaDirection="up"
        />
        <MetricCard 
          title="Active Services" 
          value={kpis.activeServices.toString()} 
          icon={Briefcase}
          subtext="currently offered"
        />
        <MetricCard 
          title="Technicians Working" 
          value={`${kpis.techsWorking} of ${kpis.totalTechs}`} 
          icon={Users}
          subtext="1 off today"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left/Main Column */}
        <div className="space-y-6 lg:col-span-2">
          <QuickActions />
          <TodaySchedule />
          <RevenueOverview />
          
          {/* Upcoming Bookings (Prototype List) */}
          <div className="card p-5 sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Upcoming Bookings</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs text-slate-500 dark:text-slate-400">
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Service</th>
                    <th className="pb-2 font-medium hidden sm:table-cell">Tech</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mockDashboardData.upcoming.map((b) => (
                    <tr key={b.id} className="group">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">{b.customer}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{b.service}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300 hidden sm:table-cell">{b.tech}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{b.date}</td>
                      <td className="py-3 text-right">
                        <span className={
                          b.status === "Confirmed" 
                            ? "px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400"
                        }>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <BookingReadiness />
          <AttentionCard />
          <TechnicianOverview />
          <PopularServices />
          <RecentCustomers />
        </div>
      </div>
    </div>
  );
}