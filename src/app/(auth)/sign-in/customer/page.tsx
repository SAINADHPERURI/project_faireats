import type { Metadata } from "next";

import { RoleSignInPage } from "@/features/auth/components/role-sign-in-page";

export const metadata: Metadata = {
  title: "Customer sign in"
};

export default function CustomerSignInPage() {
  return <RoleSignInPage role="CUSTOMER" />;
}
