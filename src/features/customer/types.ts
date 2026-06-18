export type CustomerDashboardView = "home" | "restaurants" | "checkout" | "orders" | "favorites" | "profile";

export type OrderStatus = "PLACED" | "ACCEPTED" | "PREPARING" | "READY" | "ASSIGNED" | "PICKED_UP" | "DELIVERED";
export type FoodDiscoveryCategory =
  | "South Indian"
  | "Desserts"
  | "Biryani"
  | "Pizza"
  | "Cake"
  | "Chinese"
  | "Burger"
  | "Shawarma"
  | "Samosa"
  | "Momo"
  | "Parotta"
  | "Pakoda"
  | "Rolls"
  | "Pav Bhaji";

export interface CustomerProfile {
  fullName: string;
  email: string;
  phone: string;
  defaultAddress: string;
  loyaltyPoints: number;
  fairnessCredits: number;
  savedAddresses: string[];
  paymentMethods: string[];
  dietaryPreferences: string[];
}

export interface CustomerMenuItem {
  id: string;
  restaurantId: string;
  name: string;
  category: string;
  description: string;
  price: number;
  rating: number;
  prepTime: string;
  calories: number;
  isPopular: boolean;
  isVeg: boolean;
  discoveryCategory?: FoodDiscoveryCategory;
}

export interface CustomerRestaurant {
  id: string;
  name: string;
  cuisine: string;
  category: string;
  rating: number;
  reviewCount: number;
  eta: string;
  deliveryFee: number;
  distance: string;
  priceLevel: string;
  address: string;
  description: string;
  promotion: string;
  fairnessScore: number;
  tags: string[];
  isTrending: boolean;
  isFavorite: boolean;
  isOpen: boolean;
  menu: CustomerMenuItem[];
}

export interface CustomerOrder {
  id: string;
  restaurantName: string;
  placedAt: string;
  eta: string;
  status: OrderStatus;
  total: number;
  items: string[];
  deliveryPartner: string;
  address: string;
}

export interface CustomerDashboardData {
  profile: CustomerProfile;
  restaurants: CustomerRestaurant[];
  orders: CustomerOrder[];
}
