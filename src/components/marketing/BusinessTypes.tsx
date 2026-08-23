import { Scissors, Sparkles, Camera, Briefcase, GraduationCap, Wrench } from "lucide-react";

const types = [
  { icon: Scissors, label: "Salons" },
  { icon: Sparkles, label: "Wellness" },
  { icon: Camera, label: "Photography" },
  { icon: Briefcase, label: "Consulting" },
  { icon: GraduationCap, label: "Tutoring" },
  { icon: Wrench, label: "Repair Services" },
];

export function BusinessTypes() {
  return (
    <section className="py-12 border-y border-slate-100 bg-white">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <p className="text-center text-xs font-medium uppercase tracking-wider text-slate-500">
          Built for businesses that run on appointments
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {types.map((type) => (
            <div key={type.label} className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 py-5 text-center transition-colors hover:bg-slate-100/60">
              <type.icon className="h-5 w-5 text-slate-500" />
              <span className="text-xs font-medium text-slate-700">{type.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}