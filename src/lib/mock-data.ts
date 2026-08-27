// Isolated prototype data for the Nail Technician dashboard.
// This file can be deleted once real API endpoints for these domains are built.

export const mockDashboardData = {
  kpis: {
    todayBookings: 12,
    yesterdayBookings: 9,
    todayRevenue: 186500,
    revenueChange: 12.4,
    activeServices: 8,
    techsWorking: 4,
    totalTechs: 5,
  },
  schedule: [
    { id: "1", time: "09:00", customer: "Ada", service: "Gel Manicure", tech: "Amaka Johnson", duration: "60 min", status: "Confirmed" },
    { id: "2", time: "10:30", customer: "Chioma", service: "Acrylic Full Set", tech: "Sarah Obi", duration: "90 min", status: "Confirmed" },
    { id: "3", time: "12:30", customer: "Ada", service: "Pedicure", tech: "Ifeoma Okeke", duration: "45 min", status: "Pending" },
    { id: "4", time: "14:00", customer: "Ngozi", service: "Gel Polish", tech: "Mary James", duration: "45 min", status: "Confirmed" },
  ],
  revenueChart: {
    currentMonth: 1240000,
    data: [42, 55, 45, 68, 72, 60, 85, 90, 75, 110, 95, 120]
  },
  popularServices: [
    { name: "Gel Manicure", bookings: 42, revenue: 420000, color: "bg-brand-500" },
    { name: "Acrylic Full Set", bookings: 31, revenue: 465000, color: "bg-emerald-500" },
    { name: "Pedicure", bookings: 27, revenue: 270000, color: "bg-amber-500" },
    { name: "Gel Polish", bookings: 21, revenue: 168000, color: "bg-rose-500" },
  ],
  technicians: [
    { name: "Ada", initials: "A", status: "Available", apptsToday: 4, color: "bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300" },
    { name: "Chioma", initials: "C", status: "With customer", apptsToday: 5, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
    { name: "Ngozi", initials: "N", status: "Available", apptsToday: 3, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
    { name: "Amara", initials: "Am", status: "Off today", apptsToday: 0, color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  ],
  recentCustomers: [
    { name: "Amaka Johnson", visits: 5, lastVisit: "Today" },
    { name: "Sarah Obi", visits: 3, lastVisit: "Aug 25" },
    { name: "Ifeoma Okeke", visits: 8, lastVisit: "Aug 23" },
  ],
  alerts: [
    { id: "1", text: "2 bookings awaiting confirmation", type: "warning" },
    { id: "2", text: "Booking page is not published", type: "info" },
  ],
  readiness: [
    { label: "Business profile", done: true },
    { label: "Currency", done: true },
    { label: "Services", done: true },
    { label: "Technicians", done: true },
    { label: "Working hours", done: true },
    { label: "Publish booking page", done: false },
  ],
  upcoming: [
    { id: "1", customer: "Amaka Johnson", service: "Gel Manicure", tech: "Ada", date: "Aug 28, 09:00", status: "Confirmed" },
    { id: "2", customer: "Bisi Ade", service: "Pedicure", tech: "Chioma", date: "Aug 28, 11:00", status: "Pending" },
    { id: "3", customer: "John Doe", service: "Acrylic Full Set", tech: "Ngozi", date: "Aug 29, 14:00", status: "Confirmed" },
  ]
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
};