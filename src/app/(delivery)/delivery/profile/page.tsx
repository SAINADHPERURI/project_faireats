import type { Metadata } from "next";

import { RoleProfileForm, type ProfileInitialIdentity } from "@/features/profiles/components/role-profile-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/auth/authorization";

export const metadata: Metadata = {
  title: "Delivery profile"
};

export default async function DeliveryProfilePage() {
  const profile = await requireRole("DELIVERY");
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

  return <RoleProfileForm role="DELIVERY" initialIdentity={initialIdentity} />;
}
