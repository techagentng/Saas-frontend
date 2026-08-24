import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="card max-w-md px-8 py-10">
        <p className="eyebrow mx-auto w-fit">404</p>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className="mt-6 flex justify-center">
          <Button href="/">Back to homepage</Button>
        </div>
      </div>
    </main>
  );
}
