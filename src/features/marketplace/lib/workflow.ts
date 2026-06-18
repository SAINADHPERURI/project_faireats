import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { MarketplaceNotification, MarketplaceOrder, MarketplaceOrderEvent, MarketplaceOrderStatus, MarketplacePreferenceState, MarketplaceRole } from "@/features/marketplace/types";
import type { OrderStatus as DatabaseOrderStatus } from "@/types/database";

export const marketplaceOrdersKey = "faireats:marketplace-orders:v1";
export const marketplaceNotificationsKey = "faireats:marketplace-notifications:v1";
export const marketplacePreferencesKey = "faireats:marketplace-preferences:v1";
export const marketplaceChangedEvent = "faireats:marketplace-changed";

export const marketplaceOrderFlow: Array<{ status: MarketplaceOrderStatus; label: string }> = [
  { status: "PLACED", label: "Placed" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "PREPARING", label: "Preparing" },
  { status: "READY", label: "Ready" },
  { status: "ASSIGNED", label: "Assigned" },
  { status: "PICKED_UP", label: "Picked up" },
  { status: "DELIVERED", label: "Delivered" }
];

export const marketplaceStatusLabel: Record<MarketplaceOrderStatus, string> = {
  PLACED: "Placed",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked up",
  DELIVERED: "Delivered",
  REJECTED: "Rejected"
};

const autoDeliveryPartners = ["Aarav K.", "Meera S.", "Rahul P.", "Ananya V."];

export function calculateDynamicDeliveryFee(distanceKm: number) {
  if (distanceKm <= 2) {
    return 20;
  }

  if (distanceKm <= 5) {
    return 35;
  }

  if (distanceKm <= 8) {
    return 50;
  }

  return 65;
}

export function parseDistanceKm(distance: string | number) {
  if (typeof distance === "number") {
    return distance;
  }

  const parsed = Number.parseFloat(distance.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 3;
}

export function getMarketplaceOrders() {
  return readJson<MarketplaceOrder[]>(marketplaceOrdersKey, []).filter(isMarketplaceOrder);
}

export function saveMarketplaceOrders(orders: MarketplaceOrder[]) {
  writeJson(marketplaceOrdersKey, orders);
  emitMarketplaceChanged();
}

export function seedMarketplaceOrders(orders: MarketplaceOrder[]) {
  const existing = getMarketplaceOrders();
  const existingIds = new Set(existing.map((order) => order.id));
  const additions = orders.filter((order) => !existingIds.has(order.id));

  if (additions.length > 0) {
    saveMarketplaceOrders([...additions, ...existing]);
  }
}

export function upsertMarketplaceOrder(order: MarketplaceOrder) {
  const orders = getMarketplaceOrders();
  saveMarketplaceOrders([order, ...orders.filter((item) => item.id !== order.id)]);
}

export function createMarketplaceOrder(input: Omit<MarketplaceOrder, "id" | "status" | "placedAt" | "updatedAt" | "timeline">) {
  const createdAt = new Date().toISOString();
  const orderId = `FE-${Math.floor(3000 + Math.random() * 6000)}`;
  const order: MarketplaceOrder = {
    ...input,
    id: orderId,
    status: "PLACED",
    placedAt: "Just now",
    updatedAt: createdAt,
    timeline: [createOrderEvent(orderId, "PLACED", "Order placed", `${input.customerName} placed an order at ${input.restaurantName}.`, createdAt)]
  };

  upsertMarketplaceOrder(order);
  addMarketplaceNotification({
    role: "RESTAURANT",
    title: `${order.id} placed`,
    body: `${order.customerName} placed ${order.items.length} item groups worth ₹${order.total}.`,
    orderId: order.id
  });
  void syncOrderStatusToDatabase(order.id, "PLACED");

  return order;
}

export function updateMarketplaceOrderStatus(orderId: string, status: MarketplaceOrderStatus, actor: MarketplaceRole) {
  const orders = getMarketplaceOrders();
  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    return null;
  }

  const updatedAt = new Date().toISOString();
  const deliveryPartnerName = status === "ASSIGNED" && order.deliveryPartnerName === "Assigning soon" ? assignDeliveryPartner(orderId) : order.deliveryPartnerName;
  const nextOrder: MarketplaceOrder = {
    ...order,
    status,
    deliveryPartnerName,
    eta: status === "DELIVERED" ? "Delivered" : status === "PICKED_UP" ? "12 min" : order.eta,
    updatedAt,
    timeline: [
      ...order.timeline,
      createOrderEvent(orderId, status, `Order ${marketplaceStatusLabel[status].toLowerCase()}`, buildStatusDescription(order, status, deliveryPartnerName), updatedAt)
    ]
  };

  saveMarketplaceOrders([nextOrder, ...orders.filter((item) => item.id !== orderId)]);
  notifyRolesForStatus(nextOrder, status, actor);
  void syncOrderStatusToDatabase(orderId, status);

  return nextOrder;
}

export function getMarketplaceNotifications(role?: MarketplaceRole) {
  const notifications = readJson<MarketplaceNotification[]>(marketplaceNotificationsKey, []).filter(isMarketplaceNotification);

  if (!role) {
    return notifications;
  }

  return notifications.filter((notification) => notification.role === "ALL" || notification.role === role);
}

export function addMarketplaceNotification(input: Omit<MarketplaceNotification, "id" | "createdAt" | "read">) {
  const notifications = getMarketplaceNotifications();
  const notification: MarketplaceNotification = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false
  };

  writeJson(marketplaceNotificationsKey, [notification, ...notifications].slice(0, 80));
  emitMarketplaceChanged();
  return notification;
}

export function markMarketplaceNotificationsRead(role: MarketplaceRole) {
  const notifications = getMarketplaceNotifications();
  writeJson(
    marketplaceNotificationsKey,
    notifications.map((notification) => (notification.role === "ALL" || notification.role === role ? { ...notification, read: true } : notification))
  );
  emitMarketplaceChanged();
}

export function getMarketplacePreferences(): MarketplacePreferenceState {
  return readJson<MarketplacePreferenceState>(marketplacePreferencesKey, {
    favoriteRestaurantIds: [],
    wishlistItemIds: []
  });
}

export function setMarketplacePreferences(preferences: MarketplacePreferenceState) {
  writeJson(marketplacePreferencesKey, preferences);
  emitMarketplaceChanged();
}

export function getLiveActivityFeed(limit = 10) {
  return getMarketplaceOrders()
    .flatMap((order) => order.timeline.map((event) => ({ ...event, order })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function emitMarketplaceChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(marketplaceChangedEvent));
}

function createOrderEvent(orderId: string, status: MarketplaceOrderStatus, title: string, description: string, createdAt: string): MarketplaceOrderEvent {
  return {
    id: crypto.randomUUID(),
    orderId,
    status,
    title,
    description,
    createdAt
  };
}

function buildStatusDescription(order: MarketplaceOrder, status: MarketplaceOrderStatus, deliveryPartnerName: string) {
  if (status === "ASSIGNED") {
    return `${deliveryPartnerName} has been assigned to ${order.id}.`;
  }

  if (status === "PICKED_UP") {
    return `${deliveryPartnerName} picked up ${order.id} from ${order.restaurantName}.`;
  }

  if (status === "DELIVERED") {
    return `${order.id} was delivered to ${order.address}.`;
  }

  return `${order.id} is now ${marketplaceStatusLabel[status].toLowerCase()} at ${order.restaurantName}.`;
}

function notifyRolesForStatus(order: MarketplaceOrder, status: MarketplaceOrderStatus, actor: MarketplaceRole) {
  const title = `${order.id} ${marketplaceStatusLabel[status]}`;
  const body = buildStatusDescription(order, status, order.deliveryPartnerName);

  addMarketplaceNotification({ role: "CUSTOMER", title, body, orderId: order.id });

  if (actor !== "RESTAURANT" && status !== "DELIVERED") {
    addMarketplaceNotification({ role: "RESTAURANT", title, body, orderId: order.id });
  }

  if (["ASSIGNED", "PICKED_UP", "DELIVERED"].includes(status)) {
    addMarketplaceNotification({ role: "DELIVERY", title, body, orderId: order.id });
  }

  addMarketplaceNotification({ role: "ADMIN", title, body, orderId: order.id });
}

function assignDeliveryPartner(orderId: string) {
  const numericPart = Number(orderId.replace(/\D/g, ""));
  return autoDeliveryPartners[numericPart % autoDeliveryPartners.length] ?? autoDeliveryPartners[0] ?? "Aarav K.";
}

async function syncOrderStatusToDatabase(orderId: string, status: MarketplaceOrderStatus) {
  try {
    const supabase = createSupabaseBrowserClient();
    const databaseStatus: DatabaseOrderStatus = status === "REJECTED" ? "CANCELLED" : status;
    await supabase.from("orders").update({ status: databaseStatus }).eq("order_number", orderId);
  } catch {
    // Local demo state remains authoritative when RLS or offline mode blocks the database update.
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function isMarketplaceOrder(value: unknown): value is MarketplaceOrder {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && typeof (value as MarketplaceOrder).id === "string";
}

function isMarketplaceNotification(value: unknown): value is MarketplaceNotification {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && typeof (value as MarketplaceNotification).id === "string";
}
