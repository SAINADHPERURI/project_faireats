import type { UserRole } from "@/types/auth";

export type ManagedProfileRole = Exclude<UserRole, "ADMIN">;

export interface ManagedProfileBase {
  id: string;
  userId: string;
  email: string;
  role: ManagedProfileRole;
  fullName: string;
  phone: string;
  avatarDataUrl: string | null;
  updatedAt: string;
}

export interface CustomerManagedProfile extends ManagedProfileBase {
  role: "CUSTOMER";
  address: string;
  preferences: string;
}

export interface RestaurantManagedProfile extends ManagedProfileBase {
  role: "RESTAURANT";
  ownerName: string;
  restaurantName: string;
  cuisine: string;
  outletAddress: string;
}

export interface DeliveryManagedProfile extends Omit<ManagedProfileBase, "avatarDataUrl"> {
  role: "DELIVERY";
  avatarDataUrl: null;
  photoDataUrl: string;
  dateOfBirth: string;
  age: number;
  licenseNumber: string;
  aadhaarLast4: string;
  aadhaarMasked: string;
  vehicleType: string;
  vehicleNumber: string;
}

export type ManagedProfile = CustomerManagedProfile | RestaurantManagedProfile | DeliveryManagedProfile;
