import { MessageSquare, PhoneCall, CalendarX, Users } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const problems = [
  { icon: MessageSquare, title: "Scattered bookings", desc: "Bookings lost across WhatsApp, DMs, and paper notes." },
  { icon: PhoneCall, title: "Constant calls", desc: "Customers calling just to ask for availability." },
  { icon: CalendarX, title: "Double bookings", desc: "Manual errors leading to awkward customer conflicts." },
  { icon: Users, title: "Manual coordination", desc: "Hard to keep staff schedules organized and clear." },
];

export function ProblemSolution() {
  return (
    <section id="problem" className="py-20 sm:py-24 lg:py-28 bg-slate-50/60 dark:bg-slate-900/40">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <Reveal><span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" />The problem</span></Reveal>
          <Reveal delay={60}><h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Running on appointments shouldn&apos;t mean running in circles.</h2></Reveal>
        </div>
        
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <article className="card card-hover h-full p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-600/10">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{p.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="mt-12 rounded-2xl border border-brand-200/60 bg-brand-50/50 p-8 text-center sm:p-10">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">One booking system. One dashboard. One simple customer experience.</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400">Bring everything under one roof so you can focus on the work, not the admin.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}