export const userRoles = ["CUSTOMER", "RESTAURANT", "DELIVERY", "ADMIN"] as const;
export const onboardableUserRoles = ["CUSTOMER", "RESTAURANT", "DELIVERY"] as const;

export type UserRole = (typeof userRoles)[number];
export type OnboardableUserRole = (typeof onboardableUserRoles)[number];

export interface AuthenticatedProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
}
