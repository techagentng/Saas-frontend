import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-24 lg:py-28 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />Pricing</span></Reveal>
          <Reveal delay={60}><h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Simple plans that grow with your business.</h2></Reveal>
          <Reveal delay={120}><p className="mt-4 text-base text-slate-600 dark:text-slate-400">We&apos;re finalizing the perfect plans for independent professionals and growing teams.</p></Reveal>
        </div>

        <Reveal delay={150}>
          <div className="mt-10 flex justify-center">
            <Button href="/register" size="lg">Get started now</Button>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-12 grid gap-5 sm:grid-cols-3 opacity-80">
            {[
              { title: "Starter", desc: "For independent professionals" },
              { title: "Business", desc: "For growing teams" },
              { title: "Scale", desc: "For larger operations" }
            ].map((tier) => (
              <div key={tier.title} className="card p-6 text-center">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{tier.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{tier.desc}</p>
                <div className="mt-4 text-xs font-medium text-slate-400 dark:text-slate-500">Pricing coming soon</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}