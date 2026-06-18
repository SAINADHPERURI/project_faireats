import type { ManagedProfile, ManagedProfileRole } from "@/features/profiles/types";

export const managedProfileStoreKey = "faireats:managed-role-profiles:v1";
export const managedProfileStoreChangedEvent = "faireats:managed-role-profiles-changed";

export function getStoredProfiles(): ManagedProfile[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(managedProfileStoreKey);
    const parsedValue: unknown = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isManagedProfile);
  } catch {
    return [];
  }
}

export function getStoredProfile(userId: string, role: ManagedProfileRole) {
  return getStoredProfiles().find((profile) => profile.userId === userId && profile.role === role) ?? null;
}

export function saveStoredProfile(profile: ManagedProfile) {
  if (typeof window === "undefined") {
    return;
  }

  const profiles = getStoredProfiles();
  const nextProfiles = profiles.filter((item) => !(item.userId === profile.userId && item.role === profile.role));
  nextProfiles.unshift(profile);

  window.localStorage.setItem(managedProfileStoreKey, JSON.stringify(nextProfiles));
  window.dispatchEvent(new Event(managedProfileStoreChangedEvent));
}

export function getProfileInitials(name: string | null | undefined, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "FairEats";
  const words = source.split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "FE";
}

export function maskAadhaar(value: string) {
  const digits = value.replace(/\D/g, "");
  const last4 = digits.slice(-4);

  return {
    digits,
    last4,
    masked: last4 ? `XXXX XXXX ${last4}` : ""
  };
}

function isManagedProfile(value: unknown): value is ManagedProfile {
  if (!isRecord(value)) {
    return false;
  }

  const role = value.role;
  const hasBaseFields =
    typeof value.id === "string" &&
    typeof value.userId === "string" &&
    typeof value.email === "string" &&
    typeof value.fullName === "string" &&
    typeof value.phone === "string" &&
    typeof value.updatedAt === "string";

  if (!hasBaseFields || (role !== "CUSTOMER" && role !== "RESTAURANT" && role !== "DELIVERY")) {
    return false;
  }

  if (role === "DELIVERY") {
    return typeof value.photoDataUrl === "string" && typeof value.licenseNumber === "string";
  }

  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
