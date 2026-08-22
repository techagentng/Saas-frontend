import type { ReactNode } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </ProtectedRoute>
  );
}
