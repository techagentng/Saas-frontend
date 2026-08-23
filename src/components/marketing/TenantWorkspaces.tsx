import { Reveal } from "@/components/ui/Reveal";

export function TenantWorkspaces() {
  return (
    <section className="relative overflow-hidden bg-ink text-white py-20 sm:py-24 lg:py-28 border-t border-white/5">
      <div className="absolute inset-0 bg-dot-grid-dark opacity-50" />
      <div className="absolute left-1/2 top-1/2 -z-0 h-[420px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(ellipse at center, rgb(99 102 241 / 0.35), transparent 70%)" }} />
      
      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Reveal><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-slate-300 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-brand-400" />Multi-Tenant</span></Reveal>
            <Reveal delay={60}><h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Every business gets its own secure workspace.</h2></Reveal>
            <Reveal delay={120}><p className="mt-5 text-base leading-relaxed text-slate-300">Separate business data, staff, services, bookings, and settings. Your data is never mixed with anyone else&apos;s.</p></Reveal>
          </div>
          
          <Reveal delay={150}>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { name: "Acme Salon", initial: "A", color: "from-brand-500 to-violet-500" },
                { name: "Elite Cuts", initial: "E", color: "from-emerald-500 to-teal-500" },
                { name: "Studio One", initial: "S", color: "from-amber-500 to-orange-500" }
              ].map((tenant) => (
                <div key={tenant.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur transition-all hover:bg-white/[0.06]">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${tenant.color} text-sm font-bold text-white shadow-sm`}>{tenant.initial}</div>
                  <p className="mt-4 text-sm font-semibold text-white">{tenant.name}</p>
                  <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                    <p className="text-[10px] text-slate-400">Bookings • Staff</p>
                    <p className="text-[10px] text-slate-400">Services • Settings</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}