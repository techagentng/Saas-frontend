import { Reveal } from "@/components/ui/Reveal";
import { CheckCircle2 } from "lucide-react";

export function CustomerBooking() {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          
          {/* Mobile Mockup */}
          <Reveal className="order-last lg:order-first">
            <div className="flex justify-center">
              <div className="relative h-[480px] w-[240px] rounded-[2.5rem] border-[8px] border-slate-900 bg-white dark:bg-slate-900 shadow-card">
                <div className="absolute left-1/2 top-0 h-4 w-24 -translate-x-1/2 rounded-b-2xl bg-slate-900"></div>
                <div className="flex h-full flex-col p-4 pt-8">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">Acme Salon</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Select a service</p>
                  </div>
                  <div className="mt-4 space-y-2">
                    {["Haircut", "Beard Trim", "Hair Coloring"].map((s, i) => (
                      <div key={s} className={`flex items-center justify-between rounded-lg border p-2.5 ${i === 0 ? "border-brand-600 bg-brand-50 dark:bg-brand-950/40" : "border-slate-200 dark:border-slate-800"}`}>
                        <div>
                          <p className="text-[11px] font-medium text-slate-900 dark:text-white">{s}</p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400">30 min</p>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">${30 + i * 15}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Available times</p>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {["09:00", "10:30", "13:00", "14:00", "15:30", "16:00"].map((t, i) => (
                        <div key={t} className={`rounded-md py-1.5 text-center text-[10px] ${i === 2 ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>{t}</div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-auto rounded-lg bg-brand-600 py-2 text-center text-[11px] font-semibold text-white">Confirm Booking</div>
                </div>
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal><span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Customer Experience</span></Reveal>
            <Reveal delay={60}><h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Customers book instantly from the web.</h2></Reveal>
            <Reveal delay={120}><p className="mt-4 text-base text-slate-600 dark:text-slate-400">No download required. Customers can open your booking page directly from their phone or computer, select a service, and book in seconds.</p></Reveal>
            
            <Reveal delay={180}>
              <ul className="mt-6 space-y-4">
                {["Open booking link", "Select service", "Choose date/time", "Enter details & Confirm"].map((step, i) => (
                  <li key={step} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                      {i === 3 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{i+1}</span>}
                    </div>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{step}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}