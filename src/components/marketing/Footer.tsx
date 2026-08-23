import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/60">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="inline-flex items-center gap-2.5">
              <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-ink shadow-sm">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><rect x="4" y="6" width="16" height="14" rx="2.5" stroke="#a5b4fc" strokeWidth="1.8" /><path d="M8 4v4M16 4v4M4 11h16" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" /><circle cx="12" cy="15.5" r="1.8" fill="#c7d2fe" /></svg>
              </span>
              <span className="text-[17px] font-semibold tracking-tight text-slate-900">Book<span className="text-brand-600">Flow</span></span>
            </span>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">Run your booking business from one place and give customers a simple way to book you online.</p>
          </div>
          
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Product</p>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="#product" className="text-sm text-slate-600 hover:text-slate-900">Features</Link></li>
              <li><Link href="#pricing" className="text-sm text-slate-600 hover:text-slate-900">Pricing</Link></li>
              <li><Link href="/register" className="text-sm text-slate-600 hover:text-slate-900">Get started</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resources</p>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="#faq" className="text-sm text-slate-600 hover:text-slate-900">Help</Link></li>
              <li><Link href="#faq" className="text-sm text-slate-600 hover:text-slate-900">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Company</p>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="#" className="text-sm text-slate-600 hover:text-slate-900">Contact</Link></li>
              <li><Link href="/privacy" className="text-sm text-slate-600 hover:text-slate-900">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-slate-600 hover:text-slate-900">Terms</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t border-slate-200 pt-6">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} BookFlow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}