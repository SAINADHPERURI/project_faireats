import type { Metadata } from "next";

import { RestaurantDashboard } from "@/features/restaurant/components/restaurant-dashboard";

export const metadata: Metadata = {
  title: "Restaurant dashboard"
};

export default function RestaurantPage() {
  return <RestaurantDashboard />;
}
