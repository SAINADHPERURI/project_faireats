export type RestaurantDashboardView = "overview" | "menu" | "orders" | "analytics";

export type RestaurantOrderStatus = "PLACED" | "ACCEPTED" | "PREPARING" | "READY" | "ASSIGNED" | "PICKED_UP" | "DELIVERED" | "REJECTED";

export interface RestaurantMenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  isAvailable: boolean;
  ordersToday: number;
  monthlyOrders: number;
  revenueToday: number;
  rating: number;
  prepTimeMinutes: number;
}

export interface RestaurantOrder {
  id: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  total: number;
  status: RestaurantOrderStatus;
  placedAt: string;
  deliveryAddress: string;
  paymentStatus: "PAID" | "PENDING";
  courierName: string | null;
}

export interface RestaurantRevenuePoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface RestaurantPeakHourPoint {
  hour: string;
  orders: number;
}

export interface RestaurantTopItemPoint {
  name: string;
  sold: number;
  revenue: number;
}

export interface RestaurantDashboardData {
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  rating: number;
  monthlyTarget: number;
  menuItems: RestaurantMenuItem[];
  orders: RestaurantOrder[];
  revenueSeries: RestaurantRevenuePoint[];
  peakHours: RestaurantPeakHourPoint[];
  topSellingItems: RestaurantTopItemPoint[];
}
