"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Do my customers need to install an app?",
    a: "No. Customers can use the web booking experience directly from any browser without downloading anything."
  },
  {
    q: "Can I manage multiple staff members?",
    a: "Yes. The platform is designed from the ground up for team-based businesses. You can add staff, assign services, and manage schedules."
  },
  {
    q: "Can staff have different access?",
    a: "Yes, the platform supports different access levels. Owners have full access, while staff members see only the tools they need."
  },
  {
    q: "Can customers book from their phone?",
    a: "Absolutely. The booking experience is fully responsive and works perfectly on mobile devices, tablets, and desktop computers."
  },
  {
    q: "Can I customize my booking page?",
    a: "You can define your business identity. The system is designed to support your branding as it continues to evolve."
  },
  {
    q: "Can one account manage more than one business?",
    a: "Yes. The architecture allows a single user account to participate in multiple business workspaces, making it easy to switch contexts."
  }
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-24 lg:py-28 bg-white border-t border-slate-100">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <Reveal><span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />FAQ</span></Reveal>
            <Reveal delay={60}><h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Questions, answered.</h2></Reveal>
          </div>

          <div className="lg:col-span-8">
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <Reveal key={f.q} delay={i * 60}>
                  <div className="card overflow-hidden">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/60"
                      onClick={() => setOpen(open === i ? null : i)}
                      aria-expanded={open === i}
                    >
                      <span className="text-sm font-semibold text-slate-900 sm:text-base">{f.q}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`} />
                    </button>
                    <div className={`grid transition-all duration-300 ease-out ${open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{f.a}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}