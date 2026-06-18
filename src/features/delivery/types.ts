export type DeliveryDashboardView = "dashboard" | "orders" | "earnings" | "timeline";

export type DeliveryOrderStatus = "ASSIGNED" | "PICKED_UP" | "DELIVERED";

export interface DeliveryOrder {
  id: string;
  restaurantName: string;
  customerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceKm: number;
  estimatedTimeMinutes: number;
  payout: number;
  tip: number;
  status: DeliveryOrderStatus;
  assignedAt: string;
  itemsCount: number;
  paymentMode: "PREPAID" | "COD";
}

export interface DeliveryEarningPoint {
  label: string;
  earnings: number;
  deliveries: number;
}

export interface DeliveryActivity {
  id: string;
  title: string;
  description: string;
  time: string;
  tone: "success" | "warning" | "info";
}

export interface DeliveryPartnerProfile {
  name: string;
  vehicle: string;
  rating: number;
  acceptanceRate: number;
  onTimeRate: number;
  zone: string;
}

export interface DeliveryDashboardData {
  profile: DeliveryPartnerProfile;
  orders: DeliveryOrder[];
  dailyEarnings: DeliveryEarningPoint[];
  weeklyEarnings: DeliveryEarningPoint[];
  monthlyEarnings: DeliveryEarningPoint[];
  activity: DeliveryActivity[];
}
