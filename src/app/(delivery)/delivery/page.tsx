import type { Metadata } from "next";

import { DeliveryDashboard } from "@/features/delivery/components/delivery-dashboard";

export const metadata: Metadata = {
  title: "Delivery dashboard"
};

export default function DeliveryPage() {
  return <DeliveryDashboard />;
}
