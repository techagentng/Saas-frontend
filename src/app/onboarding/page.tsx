import { CreateTenantForm } from "./_components/create-tenant-form";

export default function OnboardingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Create your business</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Set up your workspace to get started.
        </p>
      </div>
      <CreateTenantForm />
    </div>
  );
}
