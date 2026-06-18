"use client";

import { useQuery } from "@tanstack/react-query";

import { getCustomerDashboardDemoData } from "@/features/customer/data/customer-demo-data";

export function useCustomerDashboardData() {
  return useQuery({
    queryKey: ["customer", "dashboard-demo"],
    queryFn: getCustomerDashboardDemoData,
    staleTime: 1000 * 60 * 10
  });
}
