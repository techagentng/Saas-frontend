import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function DashboardPreview() {
  return (
    <section id="product" className="py-20 sm:py-24 lg:py-28 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Reveal><span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />Business Dashboard</span></Reveal>
            <Reveal delay={60}><h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Your entire business in one dashboard.</h2></Reveal>
            <Reveal delay={120}><p className="mt-4 text-base text-slate-600 dark:text-slate-400">Business owners and staff use a secure, tenant-aware dashboard to manage day-to-day operations. Give staff the access they need without exposing controls they shouldn&apos;t use.</p></Reveal>
            <Reveal delay={180}>
              <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                {["Dashboard overview", "Bookings & Appointments", "Customer management", "Staff & Services", "Reports & Settings"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8">
                <Button href="/register" variant="secondary">Get started for free</Button>
              </div>
            </Reveal>
          </div>
          
          <Reveal delay={120}>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-2 shadow-card">
              <div className="rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="mb-4 flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white">Dashboard</span>
                  <span className="rounded-md px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">Bookings</span>
                  <span className="rounded-md px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">Customers</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Revenue (May)</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">$4,250</p>
                    <div className="mt-2 flex h-10 items-end gap-1">
                      {[40, 65, 50, 80, 45, 90, 70].map((h, i) => (
                        <div key={i} className="w-full rounded-sm bg-brand-200" style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Today</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">12</p>
                    <div className="mt-2 flex flex-col gap-1">
                      <div className="h-1.5 w-full rounded-full bg-emerald-400"></div>
                      <div className="h-1.5 w-3/4 rounded-full bg-slate-200"></div>
                      <div className="h-1.5 w-1/2 rounded-full bg-slate-200"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="border-b border-slate-100 dark:border-slate-800 px-3 py-2 text-[10px] font-medium text-slate-700 dark:text-slate-300">Upcoming Appointments</div>
                  <div className="divide-y divide-slate-100">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2">
                        <div className="h-6 w-6 rounded-full bg-slate-200"></div>
                        <div className="flex-1">
                          <div className="h-2 w-1/2 rounded-full bg-slate-700"></div>
                          <div className="mt-1 h-1.5 w-1/4 rounded-full bg-slate-200"></div>
                        </div>
                        <div className="h-2 w-8 rounded-full bg-emerald-400"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}