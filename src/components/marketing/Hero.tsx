import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-24">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-white" />
      <div className="absolute inset-0 -z-10 bg-dot-grid opacity-60" />
      <div className="absolute left-1/2 top-0 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(ellipse at center, rgb(99 102 241 / 0.18), transparent 70%)" }} />

      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <div className="animate-fade-up">
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                Now in development · Early access coming soon
              </span>
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl animate-fade-up" style={{ animationDelay: "60ms" }}>
              Everything you need to run your booking business.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg animate-fade-up" style={{ animationDelay: "140ms" }}>
              Create your business page, manage appointments, organize staff and services, and let customers book online from anywhere.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-up" style={{ animationDelay: "220ms" }}>
              <Button href="/register" size="lg">Create your business</Button>
              <Button href="#how-it-works" variant="secondary" size="lg">See how it works</Button>
            </div>
            <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 animate-fade-up" style={{ animationDelay: "300ms" }}>
              Simple setup. No app required for your customers.
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
              <HeroMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-500/20 via-violet-500/10 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="ml-3 flex h-6 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-[11px] text-slate-500">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></svg>
            app.bookflow.io/dashboard
          </div>
        </div>
        <div className="flex min-h-[400px]">
          <aside className="hidden w-14 shrink-0 flex-col items-center gap-1 border-r border-slate-200 bg-slate-50/60 py-4 sm:flex">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-ink">
              <span className="h-3 w-3 rounded-sm bg-brand-400" />
            </div>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex h-9 w-9 items-center justify-center rounded-lg ${i === 0 ? "bg-brand-600 text-white" : "text-slate-400"}`}>
                <span className="h-4 w-4 rounded-sm bg-current opacity-80" />
              </div>
            ))}
          </aside>
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Dashboard</p>
                <h3 className="text-sm font-semibold text-slate-900">Good morning, Alex</h3>
              </div>
              <div className="btn-primary h-8 px-2.5 text-[11px]">+ New booking</div>
            </div>
            <div className="mb-5 grid grid-cols-3 gap-2.5">
              {[
                { label: "Today", value: "12" },
                { label: "This week", value: "47" },
                { label: "Revenue", value: "$2.4k" }
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{s.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5">
                <p className="text-xs font-semibold text-slate-900">Today's schedule</p>
                <span className="text-[10px] font-medium text-slate-400">Tue, 14 May</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {[{ t: "09:00", n: "Sarah K.", s: "Haircut" }, { t: "10:30", n: "Marcus L.", s: "Beard trim" }, { t: "13:00", n: "Diana R.", s: "Coloring" }].map((b) => (
                  <li key={b.t} className="flex items-center gap-3 px-3.5 py-2.5">
                    <span className="w-10 shrink-0 text-[11px] font-semibold text-slate-700">{b.t}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-900">{b.n}</p>
                      <p className="truncate text-[10px] text-slate-500">{b.s}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Confirmed
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}