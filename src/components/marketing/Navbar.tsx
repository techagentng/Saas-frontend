"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled ? "border-b border-slate-200/70 bg-white/80 backdrop-blur-xl" : "border-b border-transparent")}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center" aria-label="BookFlow home">
          <span className="inline-flex items-center gap-2.5">
            <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-ink shadow-sm">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <rect x="4" y="6" width="16" height="14" rx="2.5" stroke="#a5b4fc" strokeWidth="1.8" />
                <path d="M8 4v4M16 4v4M4 11h16" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="15.5" r="1.8" fill="#c7d2fe" />
              </svg>
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-slate-900">Book<span className="text-brand-600">Flow</span></span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="btn btn-secondary h-10 px-4 text-sm">Sign in</Link>
          <Button href="/register" size="sm" className="h-10">Get started</Button>
        </div>

        <button 
          type="button" 
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden" 
          aria-label="Toggle menu"
          onClick={() => setOpen(!open)}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-slate-200/70 bg-white/95 backdrop-blur-xl">
          <div className="space-y-1 px-5 py-4">
            {navLinks.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-100" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="btn btn-secondary h-11 flex-1" onClick={() => setOpen(false)}>Sign in</Link>
              <Link href="/register" className="btn btn-primary h-11 flex-1" onClick={() => setOpen(false)}>Get started</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}