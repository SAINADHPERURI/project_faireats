import type { PropsWithChildren } from "react";

import { ProtectedShell } from "@/components/layouts/protected-shell";
import { requireRole } from "@/server/auth/authorization";

export default async function DeliveryLayout({ children }: PropsWithChildren) {
  await requireRole("DELIVERY");

  return (
    <ProtectedShell role="DELIVERY" title="Delivery dashboard" description="Review available jobs, active routes, performance, and payouts.">
      {children}
    </ProtectedShell>
  );
}
