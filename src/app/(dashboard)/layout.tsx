import type { ReactNode } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppHeader } from "@/components/layout/app-header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex flex-1 flex-col px-6 py-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
