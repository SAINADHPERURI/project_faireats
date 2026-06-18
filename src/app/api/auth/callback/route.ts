import { NextResponse, type NextRequest } from "next/server";

import { appRoutes } from "@/config/routes";
import { getOnboardableRoleFromMetadata, getRoleEntryRoute } from "@/config/roles";
import { getIdentityRole } from "@/lib/supabase/identity-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextPath(next: string | null) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : appRoutes.home;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectByRole = requestUrl.searchParams.get("redirect") === "role";
  let next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL(appRoutes.signIn, request.url));
    }

    if (redirectByRole) {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        const profileRole = await getIdentityRole(supabase, user.id);
        const metadataRole = getOnboardableRoleFromMetadata(user.user_metadata);
        next = getRoleEntryRoute(profileRole ?? metadataRole ?? "CUSTOMER");
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
