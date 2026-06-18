import type { Route } from "next";

import { appRoutes } from "@/config/routes";
import { onboardableUserRoles, userRoles, type OnboardableUserRole, type UserRole } from "@/types/auth";

export const roleRouteMap = {
  CUSTOMER: appRoutes.customer.dashboard,
  RESTAURANT: appRoutes.restaurant.dashboard,
  DELIVERY: appRoutes.delivery.dashboard,
  ADMIN: appRoutes.admin.dashboard
} satisfies Record<UserRole, Route>;

export const roleProfileRouteMap = {
  CUSTOMER: appRoutes.customer.profile,
  RESTAURANT: appRoutes.restaurant.profile,
  DELIVERY: appRoutes.delivery.profile,
  ADMIN: appRoutes.admin.dashboard
} satisfies Record<UserRole, Route>;

export function getRoleHome(role?: UserRole | null): Route {
  return role ? roleRouteMap[role] : appRoutes.signIn;
}

export function getRoleProfileRoute(role?: UserRole | null): Route {
  return role ? roleProfileRouteMap[role] : appRoutes.signIn;
}

export function getRoleEntryRoute(role?: UserRole | null): Route {
  return getRoleHome(role);
}

export function getProfileCompletionKey(role: Exclude<UserRole, "ADMIN">) {
  return `${role.toLowerCase()}_profile_completed` as const;
}

export function isRoleProfileComplete(role: UserRole, metadata: Record<string, unknown> | null | undefined) {
  if (role === "ADMIN") {
    return true;
  }

  return metadata?.[getProfileCompletionKey(role)] === true;
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (userRoles as readonly string[]).includes(value);
}

export function isOnboardableUserRole(value: unknown): value is OnboardableUserRole {
  return typeof value === "string" && (onboardableUserRoles as readonly string[]).includes(value);
}

export function getOnboardableRoleFromMetadata(metadata: Record<string, unknown> | null | undefined): OnboardableUserRole | null {
  return isOnboardableUserRole(metadata?.role) ? metadata.role : null;
}

export function getFullNameFromMetadata(metadata: Record<string, unknown> | null | undefined) {
  return typeof metadata?.full_name === "string" ? metadata.full_name : null;
}
