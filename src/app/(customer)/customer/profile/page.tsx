import type { Metadata } from "next";

import { RoleProfileForm, type ProfileInitialIdentity } from "@/features/profiles/components/role-profile-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/auth/authorization";

export const metadata: Metadata = {
  title: "Customer profile"
};

export default async function CustomerProfilePage() {
  const profile = await requireRole("CUSTOMER");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const initialIdentity: ProfileInitialIdentity = {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    userMetadata: user?.user_metadata ?? {}
  };

  return <RoleProfileForm role="CUSTOMER" initialIdentity={initialIdentity} />;
}
