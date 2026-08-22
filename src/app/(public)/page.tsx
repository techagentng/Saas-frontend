import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Booking SaaS
      </h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Public site placeholder. Sign in to reach the admin dashboard.
      </p>
      <Link
        href="/login"
        className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Sign in
      </Link>
    </main>
  );
}
