import type { DeliveryDashboardData } from "@/features/delivery/types";

export const deliveryDashboardDemoData: DeliveryDashboardData = {
  profile: {
    name: "Aarav K.",
    vehicle: "Electric scooter",
    rating: 4.9,
    acceptanceRate: 96,
    onTimeRate: 93,
    zone: "Madhapur - HITEC City"
  },
  orders: [
    {
      id: "FE-2091",
      restaurantName: "Urban Tandoor",
      customerName: "Aarav Mehta",
      pickupAddress: "Road 36, Jubilee Hills",
      dropoffAddress: "Madhapur Metro Station",
      distanceKm: 4.2,
      estimatedTimeMinutes: 24,
      payout: 96,
      tip: 20,
      status: "ASSIGNED",
      assignedAt: "2 min ago",
      itemsCount: 4,
      paymentMode: "PREPAID"
    },
    {
      id: "FE-2088",
      restaurantName: "Vegan Valley",
      customerName: "Nisha Rao",
      pickupAddress: "Kavuri Hills, Madhapur",
      dropoffAddress: "Botanical Garden Road",
      distanceKm: 3.1,
      estimatedTimeMinutes: 18,
      payout: 78,
      tip: 0,
      status: "PICKED_UP",
      assignedAt: "12 min ago",
      itemsCount: 2,
      paymentMode: "PREPAID"
    },
    {
      id: "FE-2076",
      restaurantName: "Dosa Lane",
      customerName: "Rohan Iyer",
      pickupAddress: "Ayyappa Society, Madhapur",
      dropoffAddress: "Cyber Towers, HITEC City",
      distanceKm: 2.4,
      estimatedTimeMinutes: 14,
      payout: 64,
      tip: 10,
      status: "DELIVERED",
      assignedAt: "41 min ago",
      itemsCount: 3,
      paymentMode: "COD"
    },
    {
      id: "FE-2069",
      restaurantName: "Sushi Harbor",
      customerName: "Sneha Kapoor",
      pickupAddress: "Financial District, Gachibowli",
      dropoffAddress: "Kondapur Main Road",
      distanceKm: 5.6,
      estimatedTimeMinutes: 32,
      payout: 118,
      tip: 35,
      status: "DELIVERED",
      assignedAt: "1 hr ago",
      itemsCount: 2,
      paymentMode: "PREPAID"
    }
  ],
  dailyEarnings: [
    { label: "8 AM", earnings: 86, deliveries: 1 },
    { label: "10 AM", earnings: 172, deliveries: 2 },
    { label: "12 PM", earnings: 328, deliveries: 4 },
    { label: "2 PM", earnings: 448, deliveries: 5 },
    { label: "5 PM", earnings: 596, deliveries: 7 },
    { label: "8 PM", earnings: 812, deliveries: 10 },
    { label: "10 PM", earnings: 924, deliveries: 11 }
  ],
  weeklyEarnings: [
    { label: "Mon", earnings: 1240, deliveries: 14 },
    { label: "Tue", earnings: 1388, deliveries: 16 },
    { label: "Wed", earnings: 1512, deliveries: 17 },
    { label: "Thu", earnings: 1196, deliveries: 13 },
    { label: "Fri", earnings: 1784, deliveries: 20 },
    { label: "Sat", earnings: 2296, deliveries: 25 },
    { label: "Sun", earnings: 2050, deliveries: 23 }
  ],
  monthlyEarnings: [
    { label: "Week 1", earnings: 8940, deliveries: 98 },
    { label: "Week 2", earnings: 10420, deliveries: 112 },
    { label: "Week 3", earnings: 11880, deliveries: 128 },
    { label: "Week 4", earnings: 9650, deliveries: 104 }
  ],
  activity: [
    {
      id: "activity-1",
      title: "Order assigned",
      description: "FE-2091 assigned from Urban Tandoor with prepaid handoff.",
      time: "2 min ago",
      tone: "info"
    },
    {
      id: "activity-2",
      title: "Pickup completed",
      description: "FE-2088 picked up from Vegan Valley. Customer ETA is 18 minutes.",
      time: "12 min ago",
      tone: "warning"
    },
    {
      id: "activity-3",
      title: "Delivery completed",
      description: "FE-2076 delivered successfully. COD collected and logged.",
      time: "41 min ago",
      tone: "success"
    },
    {
      id: "activity-4",
      title: "High demand zone",
      description: "Madhapur has peak dinner demand. Stay near HITEC City for faster jobs.",
      time: "1 hr ago",
      tone: "info"
    }
  ]
};

export async function getDeliveryDashboardDemoData() {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 480);
  });

  return deliveryDashboardDemoData;
}
