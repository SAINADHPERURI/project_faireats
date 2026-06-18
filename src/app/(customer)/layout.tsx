import type { PropsWithChildren } from "react";

import { ProtectedShell } from "@/components/layouts/protected-shell";
import { requireRole } from "@/server/auth/authorization";

export default async function CustomerLayout({ children }: PropsWithChildren) {
  await requireRole("CUSTOMER");

  return (
    <ProtectedShell role="CUSTOMER" title="Customer dashboard" description="Discover restaurants, track orders, and manage your FairEats account.">
      {children}
    </ProtectedShell>
  );
}
