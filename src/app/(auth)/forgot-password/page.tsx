import Link from "next/link";

/** Placeholder — no password-reset endpoint exists on the backend yet. */
export default function ForgotPasswordPage() {
  return (
    <div className="card w-full max-w-md p-6 text-center shadow-card sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reset your password</h1>
      <p className="mt-2 text-sm text-slate-600">
        Password reset isn&apos;t available yet. We&apos;re still building this — check back soon.
      </p>
      <Link href="/login" className="btn-primary mt-6 inline-flex h-11 items-center px-6 text-sm">
        Back to sign in
      </Link>
    </div>
  );
}
