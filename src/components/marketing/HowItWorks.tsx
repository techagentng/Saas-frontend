import { Reveal } from "@/components/ui/Reveal";

const steps = [
  { no: "01", title: "Create your business", desc: "Register and set up your secure business workspace." },
  { no: "02", title: "Add your services", desc: "Configure what customers can book, durations, and prices." },
  { no: "03", title: "Share your link", desc: "Give customers a simple link they can open in any browser." },
  { no: "04", title: "Manage everything", desc: "Use your dashboard to manage bookings, staff, and customers." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-24 lg:py-28 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <Reveal><span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-violet-500" />How it works</span></Reveal>
          <Reveal delay={60}><h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Live in four simple steps.</h2></Reveal>
        </div>
        <ol className="mt-14 grid gap-6 md:grid-cols-4 md:gap-5">
          {steps.map((s, i) => (
            <Reveal key={s.no} delay={i * 100}>
              <li className="relative h-full">
                <div className="card h-full p-7">
                  <span className="text-sm font-bold tracking-widest text-brand-600 dark:text-brand-400">{s.no}</span>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 md:block">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                  </div>
                )}
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}