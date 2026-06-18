"use client";

import { useQuery } from "@tanstack/react-query";

import { getDeliveryDashboardDemoData } from "@/features/delivery/data/delivery-demo-data";

export function useDeliveryDashboardData() {
  return useQuery({
    queryKey: ["delivery", "dashboard-demo"],
    queryFn: getDeliveryDashboardDemoData,
    staleTime: 1000 * 60 * 10
  });
}
