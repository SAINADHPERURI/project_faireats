import { type NextRequest, NextResponse } from "next/server";

import { serverEnv } from "@/config/env";
import { getOnboardableRoleFromMetadata, getRoleHome, getRoleProfileRoute, isRoleProfileComplete, roleRouteMap } from "@/config/roles";
import { appRoutes } from "@/config/routes";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { getIdentityRole } from "@/lib/supabase/identity-profile";
import { isAllowedAdminEmail } from "@/server/auth/admin-access";
import type { UserRole } from "@/types/auth";

const protectedRoutePattern = /^\/(customer|restaurant|delivery|admin)(?:\/.*)?$/;

function createRequestRedirectUrl(pathname: string) {
  const url = new URL(pathname, serverEnv.NEXT_PUBLIC_APP_URL);

  url.search = "";

  return url;
}

function createSessionRedirect(response: NextResponse, url: URL) {
  const redirectResponse = new NextResponse(null, {
    status: 307,
    headers: {
      Location: url.toString()
    }
  });

  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}

function getPublicRoleSignIn(routeSegment: string | undefined) {
  if (routeSegment === "customer") {
    return appRoutes.customerSignIn;
  }

  if (routeSegment === "restaurant") {
    return appRoutes.restaurantSignIn;
  }

  if (routeSegment === "delivery") {
    return appRoutes.deliverySignIn;
  }

  return appRoutes.signIn;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  if (!protectedRoutePattern.test(pathname)) {
    return response;
  }

  const supabase = createMiddlewareClient(request, response);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const routeSegment = pathname.split("/")[1];
    const signInUrl = createRequestRedirectUrl(getPublicRoleSignIn(routeSegment));

    if (!pathname.startsWith("/admin")) {
      signInUrl.searchParams.set("redirectTo", pathname);
    }

    return createSessionRedirect(response, signInUrl);
  }

  const profileRole = await getIdentityRole(supabase, user.id);
  const role = profileRole ?? getOnboardableRoleFromMetadata(user.user_metadata);
  const routeSegment = pathname.split("/")[1];
  const routeRole = routeSegment?.toUpperCase() as UserRole | undefined;

  if (routeSegment === "admin" && (role !== "ADMIN" || !isAllowedAdminEmail(user.email))) {
    return createSessionRedirect(response, createRequestRedirectUrl(getRoleHome(role === "ADMIN" ? null : role)));
  }

  if (!role || !routeRole || roleRouteMap[role] !== `/${routeSegment}`) {
    return createSessionRedirect(response, createRequestRedirectUrl(getRoleHome(role)));
  }

  const profileRoute = getRoleProfileRoute(role);
  const isProfileRoute = pathname === profileRoute;

  if (role === "DELIVERY" && !isProfileRoute && !isRoleProfileComplete(role, user.user_metadata)) {
    return createSessionRedirect(response, createRequestRedirectUrl(profileRoute));
  }

  return response;
}

export const config = {
  matcher: ["/customer/:path*", "/restaurant/:path*", "/delivery/:path*", "/admin/:path*"]
};
