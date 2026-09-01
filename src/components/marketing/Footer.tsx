import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">Run your booking business from one place and give customers a simple way to book you online.</p>
          </div>
          
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Product</p>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="#product" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Features</Link></li>
              <li><Link href="#pricing" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Pricing</Link></li>
              <li><Link href="/register" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Get started</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Resources</p>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="#faq" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Help</Link></li>
              <li><Link href="#faq" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Company</p>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="#" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Contact</Link></li>
              <li><Link href="/privacy" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Terms</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-6">
          <p className="text-xs text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} BookFlow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}