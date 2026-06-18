export type MarketplaceRole = "CUSTOMER" | "RESTAURANT" | "DELIVERY" | "ADMIN";

export type MarketplaceOrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "ASSIGNED"
  | "PICKED_UP"
  | "DELIVERED"
  | "REJECTED";

export interface MarketplaceOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface MarketplaceOrderEvent {
  id: string;
  orderId: string;
  status: MarketplaceOrderStatus;
  title: string;
  description: string;
  createdAt: string;
}

export interface MarketplaceOrder {
  id: string;
  restaurantId: string;
  restaurantName: string;
  customerName: string;
  deliveryPartnerName: string;
  address: string;
  distanceKm: number;
  eta: string;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  tax: number;
  total: number;
  status: MarketplaceOrderStatus;
  items: MarketplaceOrderItem[];
  placedAt: string;
  updatedAt: string;
  timeline: MarketplaceOrderEvent[];
}

export interface MarketplaceNotification {
  id: string;
  role: MarketplaceRole | "ALL";
  title: string;
  body: string;
  orderId?: string;
  createdAt: string;
  read: boolean;
}

export interface MarketplacePreferenceState {
  favoriteRestaurantIds: string[];
  wishlistItemIds: string[];
}
