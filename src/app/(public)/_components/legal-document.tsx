import type { ReactNode } from "react";

import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

export type LegalSection = {
  /** Anchor target; also the deep-link fragment, so keep these stable once published. */
  id: string;
  title: string;
  body: ReactNode;
};

/**
 * Shared shell for /privacy and /terms. Both documents are long, numbered,
 * and deep-linked from support conversations, so the section list drives
 * the table of contents and the headings from one array — they cannot
 * drift apart.
 */
export function LegalDocument({
  title,
  summary,
  lastUpdated,
  effectiveDate,
  sections,
}: {
  title: string;
  summary: ReactNode;
  lastUpdated: string;
  effectiveDate: string;
  sections: readonly LegalSection[];
}) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-5 pb-24 pt-32 sm:px-8">
        <p className="eyebrow w-fit">Legal</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-xs text-slate-500">
          Effective {effectiveDate} · Last updated {lastUpdated}
        </p>

        <div className="card mt-8 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            In short
          </p>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">{summary}</div>
        </div>

        <nav aria-label="Contents" className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contents</p>
          <ol className="mt-4 space-y-2">
            {sections.map((section, index) => (
              <li key={section.id} className="text-sm">
                <a
                  href={`#${section.id}`}
                  className="text-slate-600 underline-offset-4 hover:text-brand-600 hover:underline"
                >
                  <span className="tabular-nums text-slate-400">{index + 1}.</span> {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 space-y-12">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                <span className="tabular-nums text-slate-400">{index + 1}.</span> {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

/** Bulleted list with the spacing both documents use. */
export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="ml-5 list-disc space-y-2 marker:text-slate-400">{children}</ul>;
}

/** Emphasised aside for the points users most often miss. */
export function LegalNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 text-sm leading-relaxed text-slate-700">
      {children}
    </div>
  );
}

/** Inline mailto styled as a link. */
export function LegalMail({ address }: { address: string }) {
  return (
    <a
      href={`mailto:${address}`}
      className="font-medium text-brand-600 underline-offset-4 hover:underline"
    >
      {address}
    </a>
  );
}
