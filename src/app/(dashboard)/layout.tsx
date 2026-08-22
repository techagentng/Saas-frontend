import type { ReactNode } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TenantGate } from "@/components/tenant/tenant-gate";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <TenantGate>
        <DashboardShell>{children}</DashboardShell>
      </TenantGate>
    </ProtectedRoute>
  );
}
