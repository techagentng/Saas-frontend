import { CalendarCheck, Users2, Bell, CreditCard } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const features = [
  { icon: CalendarCheck, title: "Smart scheduling", desc: "Real-time availability and calendar sync so double-bookings never happen." },
  { icon: Users2, title: "Staff & services", desc: "Organize your team, services, and hours in one simple dashboard." },
  { icon: Bell, title: "Automated reminders", desc: "SMS and email reminders that cut no-shows without any manual work." },
  { icon: CreditCard, title: "Secure payments", desc: "Take deposits or full payment at booking with built-in checkout." },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-24 lg:py-28 bg-white dark:bg-slate-950">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <Reveal><span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />Features</span></Reveal>
          <Reveal delay={60}><h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Everything you need to run bookings, built in.</h2></Reveal>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <article className="card card-hover h-full p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 ring-1 ring-inset ring-brand-600/10">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
