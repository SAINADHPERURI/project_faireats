import type { RestaurantDashboardData } from "@/features/restaurant/types";

export const restaurantDashboardDemoData: RestaurantDashboardData = {
  restaurantId: "urban-tandoor",
  restaurantName: "Urban Tandoor",
  cuisine: "North Indian Kitchen",
  rating: 4.8,
  monthlyTarget: 900000,
  menuItems: [
    {
      id: "paneer-tikka-bowl",
      name: "Paneer Tikka Rice Bowl",
      category: "Recommended",
      description: "Smoky paneer tikka, jeera rice, pickled onions, and mint yoghurt.",
      price: 249,
      isAvailable: true,
      ordersToday: 34,
      monthlyOrders: 482,
      revenueToday: 8466,
      rating: 4.9,
      prepTimeMinutes: 18
    },
    {
      id: "hyderabadi-veg-biryani",
      name: "Hyderabadi Veg Dum Biryani",
      category: "Biryani",
      description: "Basmati rice layered with vegetables, saffron, fried onion, and raita.",
      price: 289,
      isAvailable: true,
      ordersToday: 41,
      monthlyOrders: 610,
      revenueToday: 11849,
      rating: 4.8,
      prepTimeMinutes: 22
    },
    {
      id: "butter-chicken-meal",
      name: "Butter Chicken Meal",
      category: "Mains",
      description: "Makhani chicken curry served with butter naan and cucumber salad.",
      price: 349,
      isAvailable: true,
      ordersToday: 28,
      monthlyOrders: 436,
      revenueToday: 9772,
      rating: 4.7,
      prepTimeMinutes: 20
    },
    {
      id: "tandoori-mushroom",
      name: "Tandoori Mushroom Platter",
      category: "Starters",
      description: "Charred mushrooms, peppers, onion petals, and smoked curd marinade.",
      price: 239,
      isAvailable: false,
      ordersToday: 9,
      monthlyOrders: 188,
      revenueToday: 2151,
      rating: 4.5,
      prepTimeMinutes: 16
    },
    {
      id: "dal-makhani-combo",
      name: "Dal Makhani Combo",
      category: "Combos",
      description: "Slow-cooked black dal, jeera rice, butter naan, and salad.",
      price: 269,
      isAvailable: true,
      ordersToday: 22,
      monthlyOrders: 354,
      revenueToday: 5918,
      rating: 4.6,
      prepTimeMinutes: 19
    },
    {
      id: "nimbu-masala-soda",
      name: "Nimbu Masala Soda",
      category: "Beverages",
      description: "Chilled lemon soda with roasted cumin, mint, and black salt.",
      price: 79,
      isAvailable: true,
      ordersToday: 45,
      monthlyOrders: 740,
      revenueToday: 3555,
      rating: 4.6,
      prepTimeMinutes: 4
    }
  ],
  orders: [
    {
      id: "FE-2091",
      customerName: "Aarav Mehta",
      items: [
        { name: "Hyderabadi Veg Dum Biryani", quantity: 2 },
        { name: "Nimbu Masala Soda", quantity: 2 }
      ],
      total: 736,
      status: "PLACED",
      placedAt: "2 min ago",
      deliveryAddress: "Madhapur, Hyderabad",
      paymentStatus: "PAID",
      courierName: null
    },
    {
      id: "FE-2088",
      customerName: "Nisha Rao",
      items: [
        { name: "Paneer Tikka Rice Bowl", quantity: 1 },
        { name: "Dal Makhani Combo", quantity: 1 }
      ],
      total: 568,
      status: "ACCEPTED",
      placedAt: "9 min ago",
      deliveryAddress: "Kondapur, Hyderabad",
      paymentStatus: "PAID",
      courierName: "Vikram S."
    },
    {
      id: "FE-2082",
      customerName: "Rohan Iyer",
      items: [{ name: "Butter Chicken Meal", quantity: 2 }],
      total: 748,
      status: "PREPARING",
      placedAt: "18 min ago",
      deliveryAddress: "Jubilee Hills, Hyderabad",
      paymentStatus: "PAID",
      courierName: "Meera P."
    },
    {
      id: "FE-2075",
      customerName: "Sneha Kapoor",
      items: [{ name: "Dal Makhani Combo", quantity: 1 }],
      total: 308,
      status: "READY",
      placedAt: "26 min ago",
      deliveryAddress: "HITEC City, Hyderabad",
      paymentStatus: "PENDING",
      courierName: "Imran K."
    },
    {
      id: "FE-2069",
      customerName: "Karthik Reddy",
      items: [
        { name: "Paneer Tikka Rice Bowl", quantity: 1 },
        { name: "Nimbu Masala Soda", quantity: 1 }
      ],
      total: 367,
      status: "PICKED_UP",
      placedAt: "37 min ago",
      deliveryAddress: "Gachibowli, Hyderabad",
      paymentStatus: "PAID",
      courierName: "Ananya V."
    }
  ],
  revenueSeries: [
    { label: "Mon", revenue: 38200, orders: 118 },
    { label: "Tue", revenue: 42150, orders: 132 },
    { label: "Wed", revenue: 51890, orders: 158 },
    { label: "Thu", revenue: 47740, orders: 146 },
    { label: "Fri", revenue: 62400, orders: 191 },
    { label: "Sat", revenue: 78220, orders: 228 },
    { label: "Sun", revenue: 70360, orders: 214 }
  ],
  peakHours: [
    { hour: "8 AM", orders: 18 },
    { hour: "11 AM", orders: 31 },
    { hour: "1 PM", orders: 58 },
    { hour: "4 PM", orders: 26 },
    { hour: "7 PM", orders: 76 },
    { hour: "9 PM", orders: 64 },
    { hour: "11 PM", orders: 29 }
  ],
  topSellingItems: [
    { name: "Veg Dum Biryani", sold: 610, revenue: 176290 },
    { name: "Paneer Bowl", sold: 482, revenue: 120018 },
    { name: "Butter Chicken", sold: 436, revenue: 152164 },
    { name: "Masala Soda", sold: 740, revenue: 58460 },
    { name: "Dal Combo", sold: 354, revenue: 95226 }
  ]
};

export async function getRestaurantDashboardDemoData() {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 500);
  });

  return restaurantDashboardDemoData;
}
