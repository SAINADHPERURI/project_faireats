import type { Metadata } from "next";

import { RoleSignInPage } from "@/features/auth/components/role-sign-in-page";

export const metadata: Metadata = {
  title: "Restaurant sign in"
};

export default function RestaurantSignInPage() {
  return <RoleSignInPage role="RESTAURANT" />;
}
