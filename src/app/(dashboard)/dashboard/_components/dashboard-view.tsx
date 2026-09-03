"use client";

import Link from "next/link";
import { CalendarCheck, DollarSign, Briefcase, Users } from "lucide-react";

import { AttentionCard } from "@/components/dashboard/AttentionCard";
import { BookingReadiness } from "@/components/dashboard/BookingReadiness";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PopularServices } from "@/components/dashboard/PopularServices";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentCustomers } from "@/components/dashboard/RecentCustomers";
import { RevenueOverview } from "@/components/dashboard/RevenueOverview";
import { TechnicianOverview } from "@/components/dashboard/TechnicianOverview";
import { TodaySchedule } from "@/components/dashboard/TodaySchedule";
import { businessTypeLabel } from "@/lib/tenant/business-type-labels";
import { mockDashboardData, formatCurrency } from "@/lib/mock-data";
import { useVerticalExperience } from "@/lib/vertical/use-vertical-experience";
import { useServices } from "@/modules/services/queries";
import { useTenant } from "@/providers/tenant-provider";

import { BookingLinkCard } from "./booking-link-card";
import { ServiceSetupCard } from "./service-setup-card";

/**
 * The dashboard body. The existing appointment-oriented widgets are all
 * prototype nail data (`lib/mock-data.ts`) — today's schedule, technician
 * overview, popular services, revenue, an upcoming-appointments table. They
 * are shown only for a vertical whose `appointmentDashboard` capability is
 * on (NAIL_TECHNICIAN today).
 *
 * For every other vertical those widgets would manufacture a nail-technician
 * experience out of fake data, so they are hidden rather than relabelled —
 * no fake occupancy, covers, or trips are invented in their place. What is
 * left is an honest, real-data summary (workspace name, vertical, a link
 * into the parts of the product that do work for that vertical).
 */
export function DashboardView() {
  const vertical = useVerticalExperience();

  if (vertical.capabilities.appointmentDashboard) {
    return <AppointmentDashboard />;
  }

  return <GenericDashboard />;
}

/** Real tenant data only — no metrics that do not exist yet for this vertical. */
function GenericDashboard() {
  const { currentTenant } = useTenant();
  const vertical = useVerticalExperience();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {currentTenant?.name ?? "Your workspace"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {businessTypeLabel(currentTenant?.business_type)} workspace
        </p>
      </header>

      <div className="card p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Your team</h2>
        <p className="mt-1 max-w-prose text-sm text-slate-600 dark:text-slate-400">
          Manage the {vertical.team.memberPlural} on your team.
        </p>
        <Link
          href="/dashboard/team"
          className="btn-secondary mt-4 inline-flex h-10 px-4 text-sm no-underline"
        >
          Go to {vertical.team.plural}
        </Link>
      </div>

      <div className="card border-dashed p-5 sm:p-6">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Booking tools for {businessTypeLabel(currentTenant?.business_type).toLowerCase()}{" "}
          businesses are on the way. This workspace will gain them here as they ship — nothing
          on this page is a placeholder metric.
        </p>
      </div>
    </div>
  );
}

/**
 * The prototype nail dashboard. The appointment widgets (today's schedule,
 * revenue, popular services, the upcoming table) are still prototype data —
 * there is no backend for them yet. The Services surfaces are NOT: the
 * "Active Services" metric and `ServiceSetupCard` below read the real
 * `useServices` catalog, and the quick actions link into real features.
 */
function AppointmentDashboard() {
  const { kpis } = mockDashboardData;
  const { currentTenant } = useTenant();
  const servicesQuery = useServices(currentTenant?.id, "ALL");
  const activeServiceCount = servicesQuery.isSuccess
    ? servicesQuery.data.filter((service) => service.status === "ACTIVE").length
    : null;

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
          value={activeServiceCount === null ? "—" : activeServiceCount.toString()}
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
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
              Upcoming Bookings
            </h2>
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
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        {b.customer}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{b.service}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                        {b.tech}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{b.date}</td>
                      <td className="py-3 text-right">
                        <span
                          className={
                            b.status === "Confirmed"
                              ? "px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400"
                          }
                        >
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
          <ServiceSetupCard />
          <BookingLinkCard />
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
