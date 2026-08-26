import { CreateTenantForm } from "./_components/create-tenant-form";

export default function OnboardingPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            New workspace
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Create your business</h1>
          <p className="mt-2 text-sm text-slate-600">
            Set up your workspace to get started. You can finish the details next.
          </p>
        </div>
        <div className="card p-6 shadow-card sm:p-8">
          <CreateTenantForm />
        </div>
      </div>
    </div>
  );
}
