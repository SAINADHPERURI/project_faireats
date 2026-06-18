import { Bike, Building2, IndianRupee, PackageCheck, UsersRound } from "lucide-react";

import type { AdminChartPoint, AdminHealthSignal, AdminManagementCollection, AdminMetric } from "@/features/admin/types";

export const adminMetrics: AdminMetric[] = [
  {
    label: "Total users",
    value: "48,260",
    change: "+12.4%",
    detail: "1,284 joined this month",
    tone: "primary",
    icon: UsersRound
  },
  {
    label: "Total restaurants",
    value: "1,248",
    change: "+8.1%",
    detail: "86 pending verification",
    tone: "warning",
    icon: Building2
  },
  {
    label: "Total orders",
    value: "182,940",
    change: "+18.7%",
    detail: "6,420 placed today",
    tone: "info",
    icon: PackageCheck
  },
  {
    label: "Active delivery partners",
    value: "2,186",
    change: "+5.6%",
    detail: "842 currently available",
    tone: "success",
    icon: Bike
  },
  {
    label: "Revenue",
    value: "₹24.8L",
    change: "+21.3%",
    detail: "₹3.2L platform fees today",
    tone: "primary",
    icon: IndianRupee
  }
];

export const platformChartData: AdminChartPoint[] = [
  { label: "Mon", orders: 820, revenue: 182000, users: 42000, restaurants: 1124, deliveryPartners: 1910 },
  { label: "Tue", orders: 940, revenue: 214000, users: 42680, restaurants: 1148, deliveryPartners: 1954 },
  { label: "Wed", orders: 1080, revenue: 248000, users: 43420, restaurants: 1172, deliveryPartners: 2010 },
  { label: "Thu", orders: 1260, revenue: 286000, users: 44180, restaurants: 1194, deliveryPartners: 2075 },
  { label: "Fri", orders: 1488, revenue: 342000, users: 45240, restaurants: 1216, deliveryPartners: 2138 },
  { label: "Sat", orders: 1724, revenue: 418000, users: 46610, restaurants: 1232, deliveryPartners: 2194 },
  { label: "Sun", orders: 1608, revenue: 394000, users: 48260, restaurants: 1248, deliveryPartners: 2186 }
];

export const managementCollections: AdminManagementCollection[] = [
  {
    id: "users",
    label: "Users",
    description: "Customer, restaurant, delivery, and admin accounts.",
    records: [
      { id: "USR-2048", primary: "PERURI LEELA SAINADH", secondary: "Customer - Hyderabad", status: "Active", metric: "12 orders", updatedAt: "2 min ago" },
      { id: "USR-2031", primary: "Aarav Krishna", secondary: "Delivery partner - HITEC City", status: "Verified", metric: "96% acceptance", updatedAt: "18 min ago" },
      { id: "USR-2015", primary: "Nisha Rao", secondary: "Restaurant owner - Jubilee Hills", status: "Review", metric: "3 outlets", updatedAt: "43 min ago" }
    ]
  },
  {
    id: "restaurants",
    label: "Restaurants",
    description: "Verification, availability, quality, and revenue controls.",
    records: [
      { id: "RST-1902", primary: "Urban Tandoor", secondary: "North Indian - Jubilee Hills", status: "Open", metric: "₹82K today", updatedAt: "Live" },
      { id: "RST-1887", primary: "Sushi Harbor", secondary: "Japanese - Financial District", status: "Busy", metric: "4.8 rating", updatedAt: "8 min ago" },
      { id: "RST-1844", primary: "Vegan Valley", secondary: "Healthy - Madhapur", status: "Closed", metric: "21 pending items", updatedAt: "1 hr ago" }
    ]
  },
  {
    id: "orders",
    label: "Orders",
    description: "Lifecycle, payment, support, and SLA visibility.",
    records: [
      { id: "FE-2091", primary: "Urban Tandoor -> Aarav Mehta", secondary: "Preparing - prepaid", status: "Preparing", metric: "24 min ETA", updatedAt: "Now" },
      { id: "FE-2088", primary: "Vegan Valley -> Nisha Rao", secondary: "Picked up - prepaid", status: "In transit", metric: "18 min ETA", updatedAt: "12 min ago" },
      { id: "FE-2076", primary: "Dosa Lane -> Rohan Iyer", secondary: "Delivered - COD", status: "Delivered", metric: "₹684 total", updatedAt: "41 min ago" }
    ]
  },
  {
    id: "delivery",
    label: "Delivery partners",
    description: "Identity, availability, earnings, and route health.",
    records: [
      { id: "DP-4021", primary: "Aarav K.", secondary: "Electric scooter - Madhapur", status: "Available", metric: "11 trips today", updatedAt: "Live" },
      { id: "DP-3972", primary: "Meera S.", secondary: "Bike - Kondapur", status: "On delivery", metric: "₹1,840 today", updatedAt: "6 min ago" },
      { id: "DP-3914", primary: "Rahul P.", secondary: "Cycle - Gachibowli", status: "Offline", metric: "92% on-time", updatedAt: "2 hr ago" }
    ]
  }
];

export const platformHealthSignals: AdminHealthSignal[] = [
  { label: "Order SLA", value: "93.6%", detail: "Delivered within promised windows", status: "Strong" },
  { label: "Dispute rate", value: "0.8%", detail: "Support tickets per completed order", status: "Stable" },
  { label: "Restaurant payout lag", value: "1.4h", detail: "Average settlement queue delay", status: "Watch" },
  { label: "Courier utilization", value: "74%", detail: "Active time across verified partners", status: "Stable" }
];
