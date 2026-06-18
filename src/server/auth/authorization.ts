import "server-only";

import { redirect } from "next/navigation";

import { getFullNameFromMetadata, getOnboardableRoleFromMetadata, getRoleHome } from "@/config/roles";
import { appRoutes } from "@/config/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getIdentityProfile } from "@/lib/supabase/identity-profile";
import { isAllowedAdminEmail } from "@/server/auth/admin-access";
import type { AuthenticatedProfile, UserRole } from "@/types/auth";

export async function getAuthenticatedProfile(): Promise<AuthenticatedProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const profile = await getIdentityProfile(supabase, user.id);

  if (profile) {
    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role
    };
  }

  const metadataRole = getOnboardableRoleFromMetadata(user.user_metadata);

  if (!metadataRole) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: getFullNameFromMetadata(user.user_metadata),
    role: metadataRole
  };
}

export async function requireRole(role: UserRole) {
  const profile = await getAuthenticatedProfile();

  if (!profile) {
    redirect(appRoutes.signIn);
  }

  if (profile.role !== role) {
    redirect(getRoleHome(profile.role));
  }

  if (role === "ADMIN" && !isAllowedAdminEmail(profile.email)) {
    redirect(appRoutes.signIn);
  }

  return profile;
}
