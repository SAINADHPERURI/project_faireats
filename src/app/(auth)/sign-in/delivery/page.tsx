import type { Metadata } from "next";

import { RoleSignInPage } from "@/features/auth/components/role-sign-in-page";

export const metadata: Metadata = {
  title: "Delivery partner sign in"
};

export default function DeliverySignInPage() {
  return <RoleSignInPage role="DELIVERY" />;
}
