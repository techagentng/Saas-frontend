export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-ink shadow-sm dark:bg-brand-600">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <rect x="4" y="6" width="16" height="14" rx="2.5" stroke="#a5b4fc" strokeWidth="1.8" />
          <path d="M8 4v4M16 4v4M4 11h16" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="15.5" r="1.8" fill="#c7d2fe" />
        </svg>
      </span>
      {/* Was hard-coded slate-900, which left the wordmark near-invisible on a
          dark surface once the shell gained a dark background. */}
      <span className="text-[17px] font-semibold tracking-tight text-slate-900 dark:text-white">
        Book<span className="text-brand-600 dark:text-brand-400">Flow</span>
      </span>
    </span>
  );
}
