import { Reveal } from "@/components/ui/Reveal";
import { Lock, Database, UserCog } from "lucide-react";

export function Security() {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-white border-t border-slate-100">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Security</span></Reveal>
          <Reveal delay={60}><h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Built with security in mind.</h2></Reveal>
          <Reveal delay={120}><p className="mt-4 text-base text-slate-600">Built with secure account access and business-level data separation at its core.</p></Reveal>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {[
            { icon: Lock, title: "Secure Accounts", desc: "Protected authentication for owners and staff." },
            { icon: Database, title: "Separated Workspaces", desc: "Business data is isolated by tenant boundaries." },
            { icon: UserCog, title: "Role-Based Access", desc: "Internal controls mapped to user permissions." }
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 100}>
              <article className="card h-full p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}