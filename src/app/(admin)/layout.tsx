import type { PropsWithChildren } from "react";

import { ProtectedShell } from "@/components/layouts/protected-shell";
import { requireRole } from "@/server/auth/authorization";

export default async function AdminLayout({ children }: PropsWithChildren) {
  await requireRole("ADMIN");

  return (
    <ProtectedShell role="ADMIN" title="Admin dashboard" description="Operate the marketplace, investigate risk, and manage platform controls.">
      {children}
    </ProtectedShell>
  );
}
