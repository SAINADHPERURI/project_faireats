import type { PropsWithChildren } from "react";

import { ProtectedShell } from "@/components/layouts/protected-shell";
import { requireRole } from "@/server/auth/authorization";

export default async function RestaurantLayout({ children }: PropsWithChildren) {
  await requireRole("RESTAURANT");

  return (
    <ProtectedShell role="RESTAURANT" title="Restaurant dashboard" description="Control orders, menu availability, store settings, and kitchen operations.">
      {children}
    </ProtectedShell>
  );
}
