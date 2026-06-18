"use client";

import { useQuery } from "@tanstack/react-query";

import { getRestaurantDashboardDemoData } from "@/features/restaurant/data/restaurant-demo-data";

export function useRestaurantDashboardData() {
  return useQuery({
    queryKey: ["restaurant", "dashboard-demo"],
    queryFn: getRestaurantDashboardDemoData,
    staleTime: 1000 * 60 * 10
  });
}
