import type { LucideIcon } from "lucide-react";

export type AdminManagementTab = "users" | "restaurants" | "orders" | "delivery";

export interface AdminMetric {
  label: string;
  value: string;
  change: string;
  detail: string;
  tone: "primary" | "success" | "warning" | "info";
  icon: LucideIcon;
}

export interface AdminChartPoint {
  label: string;
  orders: number;
  revenue: number;
  users: number;
  restaurants: number;
  deliveryPartners: number;
}

export interface AdminManagementRecord {
  id: string;
  primary: string;
  secondary: string;
  status: string;
  metric: string;
  updatedAt: string;
}

export interface AdminManagementCollection {
  id: AdminManagementTab;
  label: string;
  description: string;
  records: AdminManagementRecord[];
}

export interface AdminHealthSignal {
  label: string;
  value: string;
  detail: string;
  status: "Stable" | "Watch" | "Strong";
}
