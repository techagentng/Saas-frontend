export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-24" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
    </div>
  );
}
