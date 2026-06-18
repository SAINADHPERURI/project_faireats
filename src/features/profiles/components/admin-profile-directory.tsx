"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Bike, CreditCard, IdCard, Mail, MapPin, Phone, RefreshCw, ShieldCheck, Store, UserRound, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProfileInitials, getStoredProfiles, managedProfileStoreChangedEvent } from "@/features/profiles/lib/profile-store";
import type { ManagedProfile, ManagedProfileRole } from "@/features/profiles/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { listIdentityProfiles } from "@/lib/supabase/identity-profile";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";
import type { Database, Json } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type LegacyProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type DirectoryUserRow = UserRow | LegacyProfileRow;
type DeliveryPartnerRow = Database["public"]["Tables"]["delivery_partners"]["Row"];

interface AdminProfileRow {
  userId: string;
  role: Exclude<UserRole, "ADMIN">;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  isComplete: boolean;
  updatedAt: string | null;
  details: Array<{ label: string; value: string; icon: LucideIcon }>;
}

const roleMeta: Record<ManagedProfileRole, { label: string; icon: LucideIcon; className: string }> = {
  CUSTOMER: { label: "Customer", icon: UserRound, className: "border-primary/20 bg-primary/10 text-primary" },
  RESTAURANT: { label: "Restaurant", icon: Store, className: "border-amber-200 bg-amber-50 text-amber-700" },
  DELIVERY: { label: "Delivery", icon: Bike, className: "border-sky-200 bg-sky-50 text-sky-700" }
};

export function AdminProfileDirectory() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [profiles, setProfiles] = useState<AdminProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);

    const [usersResult, deliveryResult] = await Promise.all([
      listIdentityProfiles(supabase),
      supabase.from("delivery_partners").select("*").order("updated_at", { ascending: false })
    ]);

    if (usersResult.error) {
      toast.error(usersResult.error.message);
      setProfiles([]);
      setIsLoading(false);
      return;
    }

    const users = ((usersResult.data ?? []) as DirectoryUserRow[]).filter((user) => user.role !== "ADMIN");
    const deliveryPartners = (deliveryResult.data ?? []) as DeliveryPartnerRow[];
    const localProfiles = getStoredProfiles();
    const deliveryByUserId = new Map(deliveryPartners.map((deliveryPartner) => [deliveryPartner.user_id, deliveryPartner]));
    const localByUserRole = new Map(localProfiles.map((profile) => [`${profile.userId}:${profile.role}`, profile]));

    setProfiles(
      users.map((user) =>
        buildAdminProfileRow(user, deliveryByUserId.get(user.id) ?? null, localByUserRole.get(`${user.id}:${user.role}`) ?? null)
      )
    );
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadProfiles();
    window.addEventListener("storage", loadProfiles);
    window.addEventListener(managedProfileStoreChangedEvent, loadProfiles);

    return () => {
      window.removeEventListener("storage", loadProfiles);
      window.removeEventListener(managedProfileStoreChangedEvent, loadProfiles);
    };
  }, [loadProfiles]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Badge className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin access
          </Badge>
          <h2 className="mt-3 text-xl font-bold tracking-normal">Role profile directory</h2>
          <p className="mt-1 text-sm text-muted-foreground">Customer, restaurant, and delivery partner profile records visible to admins.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void loadProfiles()} disabled={isLoading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : profiles.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {profiles.map((profile, index) => (
            <AdminProfileCard key={`${profile.userId}:${profile.role}`} profile={profile} index={index} />
          ))}
        </div>
      ) : (
        <div className="grid min-h-52 place-items-center rounded-lg border bg-card p-8 text-center shadow-sm">
          <div>
            <UsersRound className="mx-auto h-8 w-8 text-primary" />
            <h3 className="mt-4 font-semibold">No role profiles yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Profiles will appear here after users complete their role setup.</p>
          </div>
        </div>
      )}
    </section>
  );
}

function AdminProfileCard({ profile, index }: { profile: AdminProfileRow; index: number }) {
  const meta = roleMeta[profile.role];
  const Icon = meta.icon;

  return (
    <m.article
      className="rounded-lg border bg-card p-5 shadow-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div className="flex items-start gap-4">
        <ProfileAvatar image={profile.avatarUrl} name={profile.fullName} email={profile.email} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={meta.className}>
              <Icon className="mr-1 h-3.5 w-3.5" />
              {meta.label}
            </Badge>
            <Badge variant={profile.isComplete ? "default" : "secondary"}>{profile.isComplete ? "Complete" : "Pending"}</Badge>
          </div>
          <h3 className="mt-3 truncate text-lg font-bold">{profile.fullName}</h3>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p className="flex min-w-0 items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </p>
            <p className="flex min-w-0 items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <span className="truncate">{profile.phone}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {profile.details.map((detail) => (
          <div key={detail.label} className="flex items-start gap-3 rounded-lg border bg-background p-3">
            <detail.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{detail.label}</p>
              <p className="mt-1 break-words text-sm font-medium">{detail.value}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">Updated {formatDate(profile.updatedAt)}</p>
    </m.article>
  );
}

function buildAdminProfileRow(user: DirectoryUserRow, deliveryPartner: DeliveryPartnerRow | null, localProfile: ManagedProfile | null): AdminProfileRow {
  const role = user.role as ManagedProfileRole;
  const userProfileMetadata = getProfileMetadata(getUserValue(user, "metadata", null));
  const deliveryMetadata = getRecord(deliveryPartner?.metadata);
  const isComplete = getBoolean(userProfileMetadata, "completed") || getBoolean(deliveryMetadata, "profile_completed") || Boolean(localProfile);

  return {
    userId: user.id,
    role,
    fullName: localProfile?.fullName ?? user.full_name ?? "Unnamed user",
    email: user.email,
    phone: localProfile?.phone ?? getUserValue(user, "phone", null) ?? "Not provided",
    avatarUrl: getAvatarUrl(user, localProfile),
    isComplete,
    updatedAt: localProfile?.updatedAt ?? deliveryPartner?.updated_at ?? user.updated_at,
    details: getProfileDetails(role, user, deliveryPartner, localProfile, userProfileMetadata, deliveryMetadata)
  };
}

function getProfileDetails(
  role: ManagedProfileRole,
  user: DirectoryUserRow,
  deliveryPartner: DeliveryPartnerRow | null,
  localProfile: ManagedProfile | null,
  userProfileMetadata: Record<string, unknown>,
  deliveryMetadata: Record<string, unknown>
) {
  if (role === "CUSTOMER") {
    return [
      {
        label: "Address",
        value:
          localProfile?.role === "CUSTOMER"
            ? localProfile.address
            : getText(userProfileMetadata, "address") ?? getUserValue(user, "address_line1", null) ?? "Not provided",
        icon: MapPin
      },
      {
        label: "Preferences",
        value: localProfile?.role === "CUSTOMER" ? localProfile.preferences || "Default" : getText(userProfileMetadata, "preferences") ?? "Default",
        icon: ShieldCheck
      }
    ];
  }

  if (role === "RESTAURANT") {
    return [
      {
        label: "Restaurant",
        value: localProfile?.role === "RESTAURANT" ? localProfile.restaurantName : getText(userProfileMetadata, "restaurant_name") ?? "Not provided",
        icon: Store
      },
      {
        label: "Cuisine",
        value: localProfile?.role === "RESTAURANT" ? localProfile.cuisine : getText(userProfileMetadata, "cuisine") ?? "Not provided",
        icon: ShieldCheck
      },
      {
        label: "Outlet",
        value:
          localProfile?.role === "RESTAURANT"
            ? localProfile.outletAddress
            : getText(userProfileMetadata, "outlet_address") ?? getUserValue(user, "address_line1", null) ?? "Not provided",
        icon: MapPin
      }
    ];
  }

  return [
    {
      label: "Vehicle",
      value:
        localProfile?.role === "DELIVERY"
          ? `${localProfile.vehicleType} - ${localProfile.vehicleNumber}`
          : `${deliveryPartner?.vehicle_type ?? "Vehicle"} - ${deliveryPartner?.vehicle_number ?? "Not provided"}`,
      icon: Bike
    },
    {
      label: "License",
      value: localProfile?.role === "DELIVERY" ? localProfile.licenseNumber : deliveryPartner?.license_number ?? "Not provided",
      icon: IdCard
    },
    {
      label: "Aadhaar",
      value: localProfile?.role === "DELIVERY" ? localProfile.aadhaarMasked : getText(deliveryMetadata, "aadhaar_masked") ?? "Masked value pending",
      icon: CreditCard
    },
    {
      label: "Age",
      value: localProfile?.role === "DELIVERY" ? `${localProfile.age}+ verified` : `${getText(deliveryMetadata, "age") ?? "18"}+ required`,
      icon: ShieldCheck
    }
  ];
}

function ProfileAvatar({ image, name, email }: { image: string | null; name: string; email: string }) {
  return (
    <span
      className={cn(
        "grid h-16 w-16 shrink-0 place-items-center rounded-lg border bg-primary/10 bg-cover bg-center text-lg font-bold text-primary",
        image && "text-transparent"
      )}
      style={image ? { backgroundImage: `url(${image})` } : undefined}
    >
      {image ? null : getProfileInitials(name, email)}
    </span>
  );
}

function getAvatarUrl(user: DirectoryUserRow, localProfile: ManagedProfile | null) {
  if (localProfile?.role === "DELIVERY") {
    return localProfile.photoDataUrl;
  }

  return localProfile?.avatarDataUrl ?? getUserValue(user, "avatar_url", null);
}

function getProfileMetadata(metadata: Json | null) {
  const record = getRecord(metadata);
  return getRecord(record.profile);
}

function getUserValue<Key extends keyof UserRow>(user: DirectoryUserRow, key: Key, fallback: UserRow[Key] | null) {
  return key in user ? (user[key as keyof DirectoryUserRow] as UserRow[Key]) : fallback;
}

function getRecord(value: unknown): Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function getText(record: Record<string, unknown>, key: string) {
  const value = record[key];

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function getBoolean(record: Record<string, unknown>, key: string) {
  return record[key] === true;
}

function formatDate(value: string | null) {
  if (!value) {
    return "not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
