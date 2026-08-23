import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-slate-100 bg-white py-20 sm:py-24">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8 lg:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-ink via-ink-soft to-ink p-10 text-center shadow-card sm:p-14">
            <div className="absolute inset-0 bg-dot-grid-dark opacity-40" />
            <div className="absolute left-1/2 top-0 h-72 w-[640px] -translate-x-1/2 rounded-full opacity-60 blur-3xl" style={{ background: "radial-gradient(ellipse at center, rgb(99 102 241 / 0.45), transparent 70%)" }} />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to simplify your bookings?</h2>
              <p className="mx-auto mt-4 max-w-md text-base text-slate-300">Create your business workspace and start building a better booking experience for your customers.</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href="/register" size="lg">Create your business</Button>
                <Button href="/login" variant="secondary" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30">Sign in</Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}