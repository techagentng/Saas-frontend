import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AppProviders } from "@/providers/app-providers";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Booking SaaS",
  description: "Multi-tenant booking platform",
};

/**
 * Applies the saved theme while the browser is still parsing <head>, before
 * anything paints. Doing it in an effect instead would let the light default
 * render first, so a dark-mode user would see a white flash on every hard
 * navigation. Reads the same key and the same default as `useTheme`, so the
 * two can never disagree. The try/catch covers browsers where localStorage
 * throws outright (Safari private mode, storage disabled by policy).
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `data-theme="light"` is the default the server renders: the app is a
    // light-mode product that offers dark as an opt-in, so a visitor who has
    // never touched the toggle gets light regardless of their OS setting.
    // `suppressHydrationWarning` is required because THEME_SCRIPT may have
    // changed this attribute before React hydrates — see
    // next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md.
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
