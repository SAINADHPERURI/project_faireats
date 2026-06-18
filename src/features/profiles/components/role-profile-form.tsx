"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Bike,
  Calendar,
  CreditCard,
  IdCard,
  Loader2,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Store,
  Upload,
  UserRound
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfileCompletionKey, getRoleHome } from "@/config/roles";
import { useAuth } from "@/features/auth/context/auth-provider";
import { getProfileInitials, getStoredProfile, maskAadhaar, saveStoredProfile } from "@/features/profiles/lib/profile-store";
import type { DeliveryManagedProfile, ManagedProfile, ManagedProfileRole } from "@/features/profiles/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import type { Database, Json } from "@/types/database";

type FormValues = {
  fullName: string;
  phone: string;
  avatarDataUrl: string | null;
  customerAddress: string;
  customerPreferences: string;
  ownerName: string;
  restaurantName: string;
  cuisine: string;
  outletAddress: string;
  deliveryPhotoDataUrl: string | null;
  dateOfBirth: string;
  licenseNumber: string;
  aadhaarNumber: string;
  vehicleType: string;
  vehicleNumber: string;
};

type AadhaarMask = ReturnType<typeof maskAadhaar>;
export interface ProfileInitialIdentity {
  id: string;
  email: string;
  fullName: string | null;
  userMetadata: Record<string, unknown>;
}

type ProfileValidationResult =
  | {
      ok: true;
      age: number | null;
      aadhaar: AadhaarMask | null;
    }
  | {
      ok: false;
      message: string;
    };

const emptyValues: FormValues = {
  fullName: "",
  phone: "",
  avatarDataUrl: null,
  customerAddress: "",
  customerPreferences: "",
  ownerName: "",
  restaurantName: "",
  cuisine: "",
  outletAddress: "",
  deliveryPhotoDataUrl: null,
  dateOfBirth: "",
  licenseNumber: "",
  aadhaarNumber: "",
  vehicleType: "Electric scooter",
  vehicleNumber: ""
};

const roleProfileCopy: Record<
  ManagedProfileRole,
  {
    eyebrow: string;
    title: string;
    description: string;
    icon: LucideIcon;
    accent: string;
  }
> = {
  CUSTOMER: {
    eyebrow: "Customer profile",
    title: "Complete your customer profile",
    description: "Save delivery contact details and food preferences for a faster FairEats checkout.",
    icon: UserRound,
    accent: "bg-primary/10 text-primary"
  },
  RESTAURANT: {
    eyebrow: "Restaurant profile",
    title: "Set up your restaurant profile",
    description: "Add owner, outlet, and cuisine details before managing your kitchen dashboard.",
    icon: Store,
    accent: "bg-amber-100 text-amber-700"
  },
  DELIVERY: {
    eyebrow: "Delivery verification",
    title: "Verify your delivery partner profile",
    description: "Your delivery profile needs identity, age, vehicle, and photo verification before accepting orders.",
    icon: Bike,
    accent: "bg-sky-100 text-sky-700"
  }
};

export function RoleProfileForm({ role, initialIdentity }: { role: ManagedProfileRole; initialIdentity?: ProfileInitialIdentity }) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { user, profile, isLoading, refresh } = useAuth();
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const copy = roleProfileCopy[role];
  const Icon = copy.icon;
  const userId = user?.id ?? initialIdentity?.id ?? null;
  const userEmail = user?.email ?? initialIdentity?.email ?? null;
  const userMetadata = useMemo(() => user?.user_metadata ?? initialIdentity?.userMetadata ?? {}, [initialIdentity?.userMetadata, user?.user_metadata]);
  const authenticatedFullName = profile?.fullName ?? initialIdentity?.fullName ?? null;
  const initials = getProfileInitials(values.fullName, userEmail);
  const previewImage = role === "DELIVERY" ? values.deliveryPhotoDataUrl : values.avatarDataUrl;

  useEffect(() => {
    if (!userId) {
      return;
    }

    const storedProfile = getStoredProfile(userId, role);
    const metadataFullName = getMetadataString(userMetadata, "full_name");
    const metadataPhone = getMetadataString(userMetadata, "phone");

    setValues({
      ...emptyValues,
      fullName: storedProfile?.fullName ?? authenticatedFullName ?? metadataFullName ?? "",
      phone: storedProfile?.phone ?? metadataPhone ?? "",
      avatarDataUrl: storedProfile?.role !== "DELIVERY" ? storedProfile?.avatarDataUrl ?? null : null,
      customerAddress: storedProfile?.role === "CUSTOMER" ? storedProfile.address : "",
      customerPreferences: storedProfile?.role === "CUSTOMER" ? storedProfile.preferences : "",
      ownerName: storedProfile?.role === "RESTAURANT" ? storedProfile.ownerName : authenticatedFullName ?? metadataFullName ?? "",
      restaurantName: storedProfile?.role === "RESTAURANT" ? storedProfile.restaurantName : "",
      cuisine: storedProfile?.role === "RESTAURANT" ? storedProfile.cuisine : "",
      outletAddress: storedProfile?.role === "RESTAURANT" ? storedProfile.outletAddress : "",
      deliveryPhotoDataUrl: storedProfile?.role === "DELIVERY" ? storedProfile.photoDataUrl : null,
      dateOfBirth: storedProfile?.role === "DELIVERY" ? storedProfile.dateOfBirth : "",
      licenseNumber: storedProfile?.role === "DELIVERY" ? storedProfile.licenseNumber : "",
      aadhaarNumber: storedProfile?.role === "DELIVERY" ? storedProfile.aadhaarLast4 : "",
      vehicleType: storedProfile?.role === "DELIVERY" ? storedProfile.vehicleType : emptyValues.vehicleType,
      vehicleNumber: storedProfile?.role === "DELIVERY" ? storedProfile.vehicleNumber : ""
    });
  }, [authenticatedFullName, role, userId, userMetadata]);

  function updateValue<Key extends keyof FormValues>(key: Key, value: FormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>, key: "avatarDataUrl" | "deliveryPhotoDataUrl") {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Upload a valid image file.");
      return;
    }

    if (file.size > 1_500_000) {
      setError("Use an image below 1.5 MB for this demo profile.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateValue(key, reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId || !userEmail) {
      setError("Sign in again to save your profile.");
      return;
    }

    const validation = validateProfile(role, values, userId, userEmail);

    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const completionKey = getProfileCompletionKey(role);
      const now = new Date().toISOString();
      const managedProfile = buildManagedProfile(role, values, userId, userEmail, validation.age, validation.aadhaar, now);

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: managedProfile.fullName,
          phone: managedProfile.phone,
          role,
          [completionKey]: true,
          role_profile_completed: true,
          role_profile_updated_at: now,
          delivery_photo_added: role === "DELIVERY",
          aadhaar_verified_masked: role === "DELIVERY"
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      saveStoredProfile(managedProfile);

      const databaseWarnings = await syncManagedProfile(supabase, managedProfile);
      await refresh();

      toast.success("Profile saved. Redirecting to your dashboard.");

      if (databaseWarnings.length > 0) {
        toast.warning(`Saved locally. Supabase sync needs attention: ${databaseWarnings.join(", ")}.`);
      }

      router.replace(getRoleHome(role));
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this profile right now.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading && !initialIdentity) {
    return <ProfileFormSkeleton />;
  }

  if (!userId || !userEmail) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Sign in to continue profile setup.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <m.form
      onSubmit={handleSubmit}
      className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <aside className="space-y-4">
        <Card>
          <CardContent className="p-5">
            <Badge className="gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              {copy.eyebrow}
            </Badge>
            <div className="mt-5 flex items-center gap-4">
              <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-lg", copy.accent)}>
                <Icon className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-bold tracking-normal">{copy.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{userEmail}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{copy.description}</p>
          </CardContent>
        </Card>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <AvatarPreview image={previewImage} initials={initials} />
            <div className="min-w-0">
              <p className="font-semibold">{values.fullName || "FairEats profile"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{role === "DELIVERY" ? "Photo required" : "Default avatar allowed"}</p>
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="profile-photo">{role === "DELIVERY" ? "Delivery partner photo" : "Avatar"}</Label>
            <Input
              id="profile-photo"
              type="file"
              accept="image/*"
              className="mt-2"
              onChange={(event) => handleImageChange(event, role === "DELIVERY" ? "deliveryPhotoDataUrl" : "avatarDataUrl")}
            />
          </div>
        </div>
      </aside>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Profile details</CardTitle>
          <CardDescription>{role === "DELIVERY" ? "Delivery verification fields are required." : "Save the basics for this workspace."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </div>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2">
            <FormField label="Full name" htmlFor="fullName" icon={UserRound}>
              <Input id="fullName" value={values.fullName} onChange={(event) => updateValue("fullName", event.target.value)} placeholder="Your full name" required />
            </FormField>
            <FormField label="Working phone number" htmlFor="phone" icon={Phone}>
              <Input id="phone" value={values.phone} onChange={(event) => updateValue("phone", event.target.value)} placeholder="+91 98765 43210" required />
            </FormField>
          </section>

          {role === "CUSTOMER" ? (
            <section className="grid gap-4 md:grid-cols-2">
              <FormField label="Delivery address" htmlFor="customerAddress" icon={MapPin}>
                <Input
                  id="customerAddress"
                  value={values.customerAddress}
                  onChange={(event) => updateValue("customerAddress", event.target.value)}
                  placeholder="Flat, street, city"
                  required
                />
              </FormField>
              <FormField label="Food preferences" htmlFor="customerPreferences" icon={BadgeCheck}>
                <Input
                  id="customerPreferences"
                  value={values.customerPreferences}
                  onChange={(event) => updateValue("customerPreferences", event.target.value)}
                  placeholder="Vegetarian, low spice"
                />
              </FormField>
            </section>
          ) : null}

          {role === "RESTAURANT" ? (
            <section className="grid gap-4 md:grid-cols-2">
              <FormField label="Owner name" htmlFor="ownerName" icon={UserRound}>
                <Input id="ownerName" value={values.ownerName} onChange={(event) => updateValue("ownerName", event.target.value)} placeholder="Owner name" required />
              </FormField>
              <FormField label="Restaurant name" htmlFor="restaurantName" icon={Store}>
                <Input
                  id="restaurantName"
                  value={values.restaurantName}
                  onChange={(event) => updateValue("restaurantName", event.target.value)}
                  placeholder="FairEats Kitchen"
                  required
                />
              </FormField>
              <FormField label="Cuisine" htmlFor="cuisine" icon={BadgeCheck}>
                <Input id="cuisine" value={values.cuisine} onChange={(event) => updateValue("cuisine", event.target.value)} placeholder="Indian, Biryani, Cafe" required />
              </FormField>
              <FormField label="Outlet address" htmlFor="outletAddress" icon={MapPin}>
                <Input
                  id="outletAddress"
                  value={values.outletAddress}
                  onChange={(event) => updateValue("outletAddress", event.target.value)}
                  placeholder="Restaurant outlet address"
                  required
                />
              </FormField>
            </section>
          ) : null}

          {role === "DELIVERY" ? (
            <section className="grid gap-4 md:grid-cols-2">
              <FormField label="Date of birth" htmlFor="dateOfBirth" icon={Calendar}>
                <Input id="dateOfBirth" type="date" value={values.dateOfBirth} onChange={(event) => updateValue("dateOfBirth", event.target.value)} required />
              </FormField>
              <FormField label="Driving license number" htmlFor="licenseNumber" icon={IdCard}>
                <Input
                  id="licenseNumber"
                  value={values.licenseNumber}
                  onChange={(event) => updateValue("licenseNumber", event.target.value.toUpperCase())}
                  placeholder="TS0120260001234"
                  required
                />
              </FormField>
              <FormField label="Aadhaar number" htmlFor="aadhaarNumber" icon={CreditCard}>
                <Input
                  id="aadhaarNumber"
                  inputMode="numeric"
                  value={values.aadhaarNumber}
                  onChange={(event) => updateValue("aadhaarNumber", event.target.value)}
                  placeholder="12 digit Aadhaar"
                  required
                />
              </FormField>
              <FormField label="Vehicle type" htmlFor="vehicleType" icon={Bike}>
                <Input id="vehicleType" value={values.vehicleType} onChange={(event) => updateValue("vehicleType", event.target.value)} placeholder="Bike, scooter, cycle" required />
              </FormField>
              <FormField label="Vehicle number" htmlFor="vehicleNumber" icon={BadgeCheck}>
                <Input
                  id="vehicleNumber"
                  value={values.vehicleNumber}
                  onChange={(event) => updateValue("vehicleNumber", event.target.value.toUpperCase())}
                  placeholder="TS09AB1234"
                  required
                />
              </FormField>
              <div className="rounded-lg border bg-muted/40 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Verification rule</p>
                    <p className="mt-1 text-sm text-muted-foreground">Delivery partners must be 18+ and upload a real profile photo before entering the dashboard.</p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              <span>{role === "DELIVERY" ? "Aadhaar is saved only as a masked value." : "Avatar upload is optional."}</span>
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </m.form>
  );
}

function FormField({ label, htmlFor, icon: Icon, children }: { label: string; htmlFor: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </Label>
      {children}
    </div>
  );
}

function AvatarPreview({ image, initials }: { image: string | null; initials: string }) {
  return (
    <span
      className={cn(
        "grid h-20 w-20 shrink-0 place-items-center rounded-lg border bg-primary/10 text-xl font-bold text-primary",
        image && "bg-cover bg-center text-transparent"
      )}
      style={image ? { backgroundImage: `url(${image})` } : undefined}
    >
      {image ? null : initials}
    </span>
  );
}

function validateProfile(role: ManagedProfileRole, values: FormValues, userId: string, email: string): ProfileValidationResult {
  const fullName = values.fullName.trim();
  const phoneDigits = values.phone.replace(/\D/g, "");

  if (!userId || !email) {
    return { ok: false as const, message: "Your session is missing account details." };
  }

  if (fullName.length < 2) {
    return { ok: false as const, message: "Enter your full name." };
  }

  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return { ok: false as const, message: "Enter a valid working phone number." };
  }

  if (role === "CUSTOMER" && values.customerAddress.trim().length < 6) {
    return { ok: false as const, message: "Enter a complete delivery address." };
  }

  if (role === "RESTAURANT") {
    if (values.ownerName.trim().length < 2 || values.restaurantName.trim().length < 2 || values.cuisine.trim().length < 2) {
      return { ok: false as const, message: "Complete owner, restaurant, and cuisine details." };
    }

    if (values.outletAddress.trim().length < 6) {
      return { ok: false as const, message: "Enter a complete restaurant outlet address." };
    }
  }

  if (role === "DELIVERY") {
    const age = calculateAge(values.dateOfBirth);
    const aadhaar = maskAadhaar(values.aadhaarNumber);

    if (!values.deliveryPhotoDataUrl) {
      return { ok: false as const, message: "Upload your delivery partner profile photo." };
    }

    if (age === null || age < 18) {
      return { ok: false as const, message: "Delivery partners must be at least 18 years old." };
    }

    if (values.licenseNumber.trim().length < 8) {
      return { ok: false as const, message: "Enter a valid driving license number." };
    }

    if (aadhaar.digits.length !== 12) {
      return { ok: false as const, message: "Enter a valid 12 digit Aadhaar number." };
    }

    if (values.vehicleType.trim().length < 2 || values.vehicleNumber.trim().length < 6) {
      return { ok: false as const, message: "Enter valid vehicle details." };
    }

    return { ok: true as const, age, aadhaar };
  }

  return { ok: true as const, age: null, aadhaar: null };
}

function buildManagedProfile(
  role: ManagedProfileRole,
  values: FormValues,
  userId: string,
  email: string,
  age: number | null,
  aadhaar: AadhaarMask | null,
  updatedAt: string
): ManagedProfile {
  const base = {
    id: `${userId}:${role}`,
    userId,
    email,
    role,
    fullName: values.fullName.trim(),
    phone: values.phone.trim(),
    avatarDataUrl: role === "DELIVERY" ? null : values.avatarDataUrl,
    updatedAt
  };

  if (role === "CUSTOMER") {
    return {
      ...base,
      role,
      address: values.customerAddress.trim(),
      preferences: values.customerPreferences.trim()
    };
  }

  if (role === "RESTAURANT") {
    return {
      ...base,
      role,
      ownerName: values.ownerName.trim(),
      restaurantName: values.restaurantName.trim(),
      cuisine: values.cuisine.trim(),
      outletAddress: values.outletAddress.trim()
    };
  }

  return {
    ...base,
    role,
    avatarDataUrl: null,
    photoDataUrl: values.deliveryPhotoDataUrl ?? "",
    dateOfBirth: values.dateOfBirth,
    age: age ?? 0,
    licenseNumber: values.licenseNumber.trim().toUpperCase(),
    aadhaarLast4: aadhaar?.last4 ?? "",
    aadhaarMasked: aadhaar?.masked ?? "",
    vehicleType: values.vehicleType.trim(),
    vehicleNumber: values.vehicleNumber.trim().toUpperCase()
  };
}

async function syncManagedProfile(supabase: ReturnType<typeof createSupabaseBrowserClient>, profile: ManagedProfile) {
  const warnings: string[] = [];
  const userUpdate: Database["public"]["Tables"]["users"]["Update"] = {
    full_name: profile.fullName,
    phone: profile.phone,
    avatar_url: profile.role === "DELIVERY" ? profile.photoDataUrl : profile.avatarDataUrl,
    country: "IN",
    metadata: buildUserMetadata(profile)
  };

  if (profile.role === "CUSTOMER") {
    userUpdate.address_line1 = profile.address;
  }

  if (profile.role === "RESTAURANT") {
    userUpdate.address_line1 = profile.outletAddress;
  }

  const { error: userError } = await supabase.from("users").update(userUpdate).eq("id", profile.userId);

  if (userError) {
    const { error: legacyProfileError } = await supabase
      .from("profiles")
      .update({
        full_name: profile.fullName,
        updated_at: profile.updatedAt
      })
      .eq("id", profile.userId);

    if (legacyProfileError) {
      warnings.push("profile");
    }
  }

  if (profile.role === "DELIVERY") {
    const deliveryProfile = profile as DeliveryManagedProfile;
    const { error: deliveryError } = await supabase.from("delivery_partners").upsert(
      {
        user_id: deliveryProfile.userId,
        status: "AVAILABLE",
        vehicle_type: deliveryProfile.vehicleType,
        vehicle_number: deliveryProfile.vehicleNumber,
        license_number: deliveryProfile.licenseNumber,
        metadata: {
          profile_completed: true,
          date_of_birth: deliveryProfile.dateOfBirth,
          age: deliveryProfile.age,
          aadhaar_last4: deliveryProfile.aadhaarLast4,
          aadhaar_masked: deliveryProfile.aadhaarMasked,
          photo_required: true,
          updated_at: deliveryProfile.updatedAt
        } satisfies Json
      },
      { onConflict: "user_id" }
    );

    if (deliveryError) {
      warnings.push("delivery_partners");
    }
  }

  return warnings;
}

function buildUserMetadata(profile: ManagedProfile): Json {
  if (profile.role === "CUSTOMER") {
    return {
      profile: {
        role: profile.role,
        completed: true,
        address: profile.address,
        preferences: profile.preferences,
        updated_at: profile.updatedAt
      }
    };
  }

  if (profile.role === "RESTAURANT") {
    return {
      profile: {
        role: profile.role,
        completed: true,
        owner_name: profile.ownerName,
        restaurant_name: profile.restaurantName,
        cuisine: profile.cuisine,
        outlet_address: profile.outletAddress,
        updated_at: profile.updatedAt
      }
    };
  }

  return {
    profile: {
      role: profile.role,
      completed: true,
      age: profile.age,
      vehicle_type: profile.vehicleType,
      vehicle_number: profile.vehicleNumber,
      license_number: profile.licenseNumber,
      aadhaar_masked: profile.aadhaarMasked,
      updated_at: profile.updatedAt
    }
  };
}

function calculateAge(dateOfBirth: string) {
  const parts = dateOfBirth.split("-").map((part) => Number(part));
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (!year || !month || !day) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age -= 1;
  }

  return age;
}

function getMetadataString(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : null;
}

function ProfileFormSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="h-80 animate-pulse rounded-lg border bg-muted" />
      <div className="h-[520px] animate-pulse rounded-lg border bg-muted" />
    </div>
  );
}
