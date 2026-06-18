import type { Metadata } from "next";

import { CustomerDashboard } from "@/features/customer/components/customer-dashboard";

export const metadata: Metadata = {
  title: "Customer dashboard"
};

export default function CustomerPage() {
  return <CustomerDashboard />;
}
