import { Reveal } from "@/components/ui/Reveal";
import { ShieldCheck, UserCheck, Eye } from "lucide-react";

export function Teams() {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-slate-50/60 border-t border-slate-100">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />Roles &amp; Team</span></Reveal>
          <Reveal delay={60}><h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Bring your team into the same workspace.</h2></Reveal>
          <Reveal delay={120}><p className="mt-4 text-base text-slate-600">Owners can manage the business while staff see only the tools they need.</p></Reveal>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Business Owner", desc: "Full access to settings, staff, services, and reports." },
            { icon: UserCheck, title: "Staff Member", desc: "Access to daily bookings and customer profiles." },
            { icon: Eye, title: "Custom Roles", desc: "Designed to support different access levels as you grow." }
          ].map((role, i) => (
            <Reveal key={role.title} delay={i * 100}>
              <article className="card card-hover h-full p-6 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-600/10">
                  <role.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-slate-900">{role.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{role.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}