import { Reveal } from "@/components/ui/Reveal";
import { Palette, Type, Droplet } from "lucide-react";

export function Branding() {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-white border-t border-slate-100">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          
          <div>
            <Reveal><span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-violet-500" />Branding</span></Reveal>
            <Reveal delay={60}><h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Make the booking experience feel like your business.</h2></Reveal>
            <Reveal delay={120}><p className="mt-4 text-base text-slate-600">Build a recognizable booking experience around your brand. Configure your identity so customers know exactly where they are booking.</p></Reveal>
            
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Type, title: "Business Name" },
                { icon: Palette, title: "Logo" },
                { icon: Droplet, title: "Brand Colors" }
              ].map((item) => (
                <div key={item.title} className="card p-4 text-center">
                  <item.icon className="mx-auto h-5 w-5 text-slate-700" />
                  <p className="mt-2 text-xs font-medium text-slate-900">{item.title}</p>
                </div>
              ))}
            </div>
          </div>

          <Reveal delay={150}>
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-soft">
              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 text-white font-bold">B</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Bloom Beauty Studio</p>
                    <p className="text-xs text-slate-500">bloom.bookflow.io</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-12 rounded-lg bg-rose-50 ring-1 ring-rose-100"></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-20 rounded-lg bg-slate-50 ring-1 ring-slate-100"></div>
                    <div className="h-20 rounded-lg bg-slate-50 ring-1 ring-slate-100"></div>
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