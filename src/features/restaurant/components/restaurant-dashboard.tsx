"use client";

import { useEffect, useMemo, useState } from "react";
import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeIndianRupee,
  BarChart3,
  CheckCircle2,
  ChefHat,
  Clock3,
  Flame,
  LineChart as LineChartIcon,
  MinusCircle,
  Pencil,
  Power,
  Plus,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Star,
  Store,
  Trash2,
  TrendingUp,
  Utensils,
  XCircle
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveActivityFeed } from "@/features/marketplace/components/live-activity-feed";
import { NotificationCenter } from "@/features/marketplace/components/notification-center";
import {
  calculateDynamicDeliveryFee,
  getMarketplaceOrders,
  marketplaceChangedEvent,
  parseDistanceKm,
  seedMarketplaceOrders,
  updateMarketplaceOrderStatus
} from "@/features/marketplace/lib/workflow";
import type { MarketplaceOrder } from "@/features/marketplace/types";
import { useRestaurantDashboardData } from "@/features/restaurant/hooks/use-restaurant-dashboard-data";
import {
  getRestaurantOperatingStatus,
  setRestaurantOperatingStatus,
  type RestaurantOperatingStatus
} from "@/features/restaurant/lib/restaurant-operating-status";
import type {
  RestaurantDashboardView,
  RestaurantMenuItem,
  RestaurantOrder,
  RestaurantOrderStatus,
  RestaurantPeakHourPoint,
  RestaurantRevenuePoint,
  RestaurantTopItemPoint
} from "@/features/restaurant/types";
import { cn } from "@/lib/utils";

interface MenuDraft {
  name: string;
  category: string;
  description: string;
  price: string;
  prepTimeMinutes: string;
}

type ChartPayloadItem = {
  name?: string;
  value?: number;
  color?: string;
  payload?: Record<string, unknown>;
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("en-IN");

const viewItems: Array<{ id: RestaurantDashboardView; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: Store },
  { id: "menu", label: "Menu", icon: Utensils },
  { id: "orders", label: "Orders", icon: ReceiptText },
  { id: "analytics", label: "Analytics", icon: BarChart3 }
];

const orderStatusMeta: Record<RestaurantOrderStatus, { label: string; className: string }> = {
  PLACED: { label: "Placed", className: "border-sky-200 bg-sky-50 text-sky-700" },
  ACCEPTED: { label: "Accepted", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  PREPARING: { label: "Preparing", className: "border-amber-200 bg-amber-50 text-amber-700" },
  READY: { label: "Ready", className: "border-violet-200 bg-violet-50 text-violet-700" },
  ASSIGNED: { label: "Assigned", className: "border-primary/20 bg-primary/10 text-primary" },
  PICKED_UP: { label: "Picked up", className: "border-cyan-200 bg-cyan-50 text-cyan-700" },
  DELIVERED: { label: "Delivered", className: "border-primary/20 bg-primary/10 text-primary" },
  REJECTED: { label: "Rejected", className: "border-destructive/30 bg-destructive/10 text-destructive" }
};

const nextOrderStatus: Partial<Record<RestaurantOrderStatus, RestaurantOrderStatus>> = {
  PLACED: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
  READY: "ASSIGNED",
  ASSIGNED: "PICKED_UP",
  PICKED_UP: "DELIVERED"
};

const initialDraft: MenuDraft = {
  name: "",
  category: "Recommended",
  description: "",
  price: "",
  prepTimeMinutes: "18"
};

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatShortCurrency(value: number) {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }

  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }

  return formatCurrency(value);
}

export function RestaurantDashboard() {
  const { data, isLoading } = useRestaurantDashboardData();
  const [activeView, setActiveView] = useState<RestaurantDashboardView>("overview");
  const [menuItems, setMenuItems] = useState<RestaurantMenuItem[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [draft, setDraft] = useState<MenuDraft>(initialDraft);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [operatingStatus, setOperatingStatus] = useState<RestaurantOperatingStatus>("OPEN");

  useEffect(() => {
    if (!data) {
      return;
    }

    const dashboardData = data;
    setMenuItems(dashboardData.menuItems);
    setOperatingStatus(getRestaurantOperatingStatus(dashboardData.restaurantId));
    seedMarketplaceOrders(
      dashboardData.orders.map((order) =>
        restaurantOrderToMarketplaceOrder(order, dashboardData.restaurantId, dashboardData.restaurantName)
      )
    );

    function syncWorkflowOrders() {
      setOrders(mergeRestaurantOrders(dashboardData.orders, getMarketplaceOrders(), dashboardData.restaurantId));
    }

    syncWorkflowOrders();
    window.addEventListener("storage", syncWorkflowOrders);
    window.addEventListener(marketplaceChangedEvent, syncWorkflowOrders);

    return () => {
      window.removeEventListener("storage", syncWorkflowOrders);
      window.removeEventListener(marketplaceChangedEvent, syncWorkflowOrders);
    };
  }, [data]);

  const metrics = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== "REJECTED");
    const revenueToday = menuItems.reduce((total, item) => total + item.revenueToday, 0);
    const ordersToday = menuItems.reduce((total, item) => total + item.ordersToday, 0);
    const totalOrders = menuItems.reduce((total, item) => total + item.monthlyOrders, 0);
    const monthlyRevenue = Math.round(data?.revenueSeries.reduce((total, point) => total + point.revenue, 0) ?? revenueToday * 24);

    return {
      activeOrders,
      revenueToday,
      ordersToday,
      totalOrders,
      monthlyRevenue,
      availability: menuItems.length === 0 ? 0 : Math.round((menuItems.filter((item) => item.isAvailable).length / menuItems.length) * 100)
    };
  }, [data?.revenueSeries, menuItems, orders]);

  if (isLoading || !data) {
    return <RestaurantDashboardSkeleton />;
  }

  const restaurantId = data.restaurantId;

  function resetDraft() {
    setDraft(initialDraft);
    setEditingItemId(null);
  }

  function handleDraftChange(field: keyof MenuDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function saveMenuItem() {
    const price = Number(draft.price);
    const prepTimeMinutes = Number(draft.prepTimeMinutes);

    if (!draft.name.trim() || !draft.description.trim() || !Number.isFinite(price) || price <= 0 || !Number.isFinite(prepTimeMinutes) || prepTimeMinutes <= 0) {
      toast.error("Add a name, description, valid price, and prep time.");
      return;
    }

    if (editingItemId) {
      setMenuItems((current) =>
        current.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                name: draft.name.trim(),
                category: draft.category.trim() || "Recommended",
                description: draft.description.trim(),
                price,
                prepTimeMinutes
              }
            : item
        )
      );
      toast.success("Menu item updated.");
    } else {
      const newItem: RestaurantMenuItem = {
        id: `menu-${Date.now()}`,
        name: draft.name.trim(),
        category: draft.category.trim() || "Recommended",
        description: draft.description.trim(),
        price,
        isAvailable: true,
        ordersToday: 0,
        monthlyOrders: 0,
        revenueToday: 0,
        rating: 4.6,
        prepTimeMinutes
      };

      setMenuItems((current) => [newItem, ...current]);
      toast.success("Menu item added.");
    }

    resetDraft();
  }

  function editMenuItem(item: RestaurantMenuItem) {
    setEditingItemId(item.id);
    setDraft({
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price.toString(),
      prepTimeMinutes: item.prepTimeMinutes.toString()
    });
    setActiveView("menu");
  }

  function deleteMenuItem(itemId: string) {
    setMenuItems((current) => current.filter((item) => item.id !== itemId));
    if (editingItemId === itemId) {
      resetDraft();
    }
    toast.success("Menu item deleted.");
  }

  function toggleAvailability(itemId: string) {
    setMenuItems((current) => current.map((item) => (item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item)));
  }

  function updateOrderStatus(orderId: string, status: RestaurantOrderStatus) {
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
    updateMarketplaceOrderStatus(orderId, status, "RESTAURANT");
    toast.success(`Order ${orderId} marked ${orderStatusMeta[status].label.toLowerCase()}.`);
  }

  function toggleOperatingStatus() {
    const nextStatus: RestaurantOperatingStatus = operatingStatus === "OPEN" ? "CLOSED" : "OPEN";

    setOperatingStatus(nextStatus);
    setRestaurantOperatingStatus(restaurantId, nextStatus);
    toast.success(nextStatus === "OPEN" ? "Restaurant is open for orders." : "Restaurant is closed for customer orders.");
  }

  return (
    <div className="space-y-6">
      <RestaurantToolbar
        activeView={activeView}
        onChange={setActiveView}
        restaurantName={data.restaurantName}
        cuisine={data.cuisine}
        rating={data.rating}
        activeOrderCount={metrics.activeOrders.length}
        isOpen={operatingStatus === "OPEN"}
        onToggleOperatingStatus={toggleOperatingStatus}
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <NotificationCenter role="RESTAURANT" compact />
        <LiveActivityFeed limit={4} />
      </section>

      <m.div key={activeView} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
        {activeView === "overview" ? (
          <OverviewView
            data={data}
            menuItems={menuItems}
            orders={orders}
            metrics={metrics}
            onViewMenu={() => setActiveView("menu")}
            onViewOrders={() => setActiveView("orders")}
            onEditMenuItem={editMenuItem}
            onUpdateOrderStatus={updateOrderStatus}
          />
        ) : null}

        {activeView === "menu" ? (
          <MenuManagementView
            menuItems={menuItems}
            draft={draft}
            editingItemId={editingItemId}
            onDraftChange={handleDraftChange}
            onSave={saveMenuItem}
            onReset={resetDraft}
            onEdit={editMenuItem}
            onDelete={deleteMenuItem}
            onToggleAvailability={toggleAvailability}
          />
        ) : null}

        {activeView === "orders" ? <OrderManagementView orders={orders} onUpdateOrderStatus={updateOrderStatus} /> : null}

        {activeView === "analytics" ? <AnalyticsView data={data} menuItems={menuItems} orders={orders} /> : null}
      </m.div>
    </div>
  );
}

function RestaurantToolbar({
  activeView,
  restaurantName,
  cuisine,
  rating,
  activeOrderCount,
  isOpen,
  onToggleOperatingStatus,
  onChange
}: {
  activeView: RestaurantDashboardView;
  restaurantName: string;
  cuisine: string;
  rating: number;
  activeOrderCount: number;
  isOpen: boolean;
  onToggleOperatingStatus: () => void;
  onChange: (view: RestaurantDashboardView) => void;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Badge className="mb-3 gap-1 bg-primary text-primary-foreground">
              <ChefHat className="h-3.5 w-3.5" />
              Live restaurant workspace
            </Badge>
            <h2 className="text-2xl font-bold tracking-normal">{restaurantName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{cuisine} with real-time order, menu, and revenue controls.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <InfoPill icon={Star} label={`${rating.toFixed(1)} rating`} />
            <InfoPill icon={Activity} label={`${activeOrderCount} active`} />
            <InfoPill icon={Clock3} label={isOpen ? "Open now" : "Closed"} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("gap-1", isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              <Store className="h-3.5 w-3.5" />
              {isOpen ? "Accepting orders" : "Unavailable"}
            </Badge>
            <Button type="button" variant={isOpen ? "outline" : "default"} onClick={onToggleOperatingStatus}>
              <Power className="mr-2 h-4 w-4" />
              {isOpen ? "Close restaurant" : "Open restaurant"}
            </Button>
          </div>
        </div>
      </section>

      <nav className="flex gap-2 overflow-x-auto rounded-lg border bg-card p-2 shadow-sm" aria-label="Restaurant dashboard">
        {viewItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors",
                "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive && "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function OverviewView({
  data,
  menuItems,
  orders,
  metrics,
  onViewMenu,
  onViewOrders,
  onEditMenuItem,
  onUpdateOrderStatus
}: {
  data: {
    revenueSeries: RestaurantRevenuePoint[];
    monthlyTarget: number;
    peakHours: RestaurantPeakHourPoint[];
  };
  menuItems: RestaurantMenuItem[];
  orders: RestaurantOrder[];
  metrics: {
    activeOrders: RestaurantOrder[];
    revenueToday: number;
    ordersToday: number;
    monthlyRevenue: number;
    totalOrders: number;
    availability: number;
  };
  onViewMenu: () => void;
  onViewOrders: () => void;
  onEditMenuItem: (item: RestaurantMenuItem) => void;
  onUpdateOrderStatus: (orderId: string, status: RestaurantOrderStatus) => void;
}) {
  const metricCards = [
    { label: "Orders today", value: numberFormatter.format(metrics.ordersToday), detail: "+14% vs yesterday", icon: ShoppingBag },
    { label: "Revenue today", value: formatCurrency(metrics.revenueToday), detail: "Live accepted revenue", icon: BadgeIndianRupee },
    { label: "Monthly revenue", value: formatShortCurrency(metrics.monthlyRevenue), detail: `${Math.round((metrics.monthlyRevenue / data.monthlyTarget) * 100)}% of target`, icon: TrendingUp },
    { label: "Total orders", value: numberFormatter.format(metrics.totalOrders), detail: "This month", icon: ReceiptText }
  ];

  const hotItems = [...menuItems].sort((a, b) => b.ordersToday - a.ordersToday).slice(0, 3);
  const liveOrders = orders.filter((order) => !["DELIVERED", "REJECTED"].includes(order.status)).slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} index={index} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <LineChartIcon className="h-5 w-5 text-primary" />
                Revenue momentum
              </CardTitle>
              <CardDescription>Daily revenue and order volume across the current week.</CardDescription>
            </div>
            <Badge variant="outline">{metrics.availability}% menu live</Badge>
          </CardHeader>
          <CardContent className="p-5">
            <RevenueAreaChart data={data.revenueSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Live order queue</CardTitle>
                <CardDescription>Accept, reject, and advance kitchen status.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={onViewOrders}>
                All orders
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            {liveOrders.length > 0 ? (
              liveOrders.map((order) => <CompactOrderCard key={order.id} order={order} onUpdateOrderStatus={onUpdateOrderStatus} />)
            ) : (
              <EmptyState icon={CheckCircle2} title="No active orders" description="Kitchen queue is clear right now." compact />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Top live items</CardTitle>
                <CardDescription>Best performers by orders today.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={onViewMenu}>
                Manage menu
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            {hotItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.ordersToday} orders • {formatCurrency(item.revenueToday)}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => onEditMenuItem(item)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock3 className="h-5 w-5 text-primary" />
              Peak hours
            </CardTitle>
            <CardDescription>Use this to staff the kitchen and prep batching windows.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <PeakHoursChart data={data.peakHours} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MenuManagementView({
  menuItems,
  draft,
  editingItemId,
  onDraftChange,
  onSave,
  onReset,
  onEdit,
  onDelete,
  onToggleAvailability
}: {
  menuItems: RestaurantMenuItem[];
  draft: MenuDraft;
  editingItemId: string | null;
  onDraftChange: (field: keyof MenuDraft, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  onEdit: (item: RestaurantMenuItem) => void;
  onDelete: (itemId: string) => void;
  onToggleAvailability: (itemId: string) => void;
}) {
  const liveCount = menuItems.filter((item) => item.isAvailable).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Plus className="h-5 w-5 text-primary" />
            {editingItemId ? "Edit item" : "Add item"}
          </CardTitle>
          <CardDescription>Manage item details, pricing, and kitchen prep expectations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <FormField label="Item name">
            <Input value={draft.name} onChange={(event) => onDraftChange("name", event.target.value)} placeholder="Paneer tikka bowl" />
          </FormField>
          <FormField label="Category">
            <Input value={draft.category} onChange={(event) => onDraftChange("category", event.target.value)} placeholder="Recommended" />
          </FormField>
          <FormField label="Description">
            <textarea
              value={draft.description}
              onChange={(event) => onDraftChange("description", event.target.value)}
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Short menu description"
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Price">
              <Input value={draft.price} onChange={(event) => onDraftChange("price", event.target.value)} inputMode="numeric" placeholder="249" />
            </FormField>
            <FormField label="Prep minutes">
              <Input value={draft.prepTimeMinutes} onChange={(event) => onDraftChange("prepTimeMinutes", event.target.value)} inputMode="numeric" placeholder="18" />
            </FormField>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" onClick={onSave}>
              {editingItemId ? "Save changes" : "Add item"}
            </Button>
            <Button type="button" variant="outline" onClick={onReset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Menu management</CardTitle>
              <CardDescription>
                {liveCount} of {menuItems.length} items available for customers.
              </CardDescription>
            </div>
            <Badge variant="secondary">{menuItems.length} total items</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {menuItems.map((item) => (
              <div key={item.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.name}</h3>
                    <Badge variant="outline">{item.category}</Badge>
                    <Badge className={cn(item.isAvailable ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      {item.isAvailable ? "Available" : "Hidden"}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{formatCurrency(item.price)}</span>
                    <span>{item.prepTimeMinutes} min prep</span>
                    <span>{item.ordersToday} orders today</span>
                    <span>{item.rating.toFixed(1)} rating</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => onToggleAvailability(item.id)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Toggle
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => onEdit(item)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => onDelete(item.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  <div className="rounded-md border bg-background px-3 py-2 text-center text-sm font-semibold">{formatCurrency(item.revenueToday)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrderManagementView({
  orders,
  onUpdateOrderStatus
}: {
  orders: RestaurantOrder[];
  onUpdateOrderStatus: (orderId: string, status: RestaurantOrderStatus) => void;
}) {
  const statusCounts = Object.entries(orderStatusMeta).map(([status, meta]) => ({
    status: status as RestaurantOrderStatus,
    label: meta.label,
    count: orders.filter((order) => order.status === status).length
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
        {statusCounts.map((item) => (
          <div key={item.status} className="rounded-lg border bg-card p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-bold">{item.count}</p>
          </div>
        ))}
      </section>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl">Order management</CardTitle>
          <CardDescription>Accept orders, reject when necessary, and move kitchen status forward.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onUpdateOrderStatus={onUpdateOrderStatus} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsView({
  data,
  menuItems,
  orders
}: {
  data: {
    revenueSeries: RestaurantRevenuePoint[];
    peakHours: RestaurantPeakHourPoint[];
    topSellingItems: RestaurantTopItemPoint[];
    monthlyTarget: number;
  };
  menuItems: RestaurantMenuItem[];
  orders: RestaurantOrder[];
}) {
  const deliveredRevenue = orders.filter((order) => order.status === "DELIVERED").reduce((total, order) => total + order.total, 0);
  const liveRevenue = menuItems.reduce((total, item) => total + item.revenueToday, 0);
  const targetProgress = Math.min(100, Math.round(((data.revenueSeries.reduce((total, point) => total + point.revenue, 0) + deliveredRevenue) / data.monthlyTarget) * 100));
  const mostOrderedItem = data.topSellingItems[0];
  const peakHour = data.peakHours.reduce((best, point) => (point.orders > best.orders ? point : best), data.peakHours[0] ?? { hour: "7 PM", orders: 0 });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <InsightWidget icon={Flame} label="Most ordered item" value={mostOrderedItem?.name ?? "Menu leader"} detail={`${mostOrderedItem?.sold ?? 0} monthly orders`} />
        <InsightWidget icon={BadgeIndianRupee} label="Revenue trend" value={formatCurrency(liveRevenue)} detail={`${targetProgress}% toward monthly target`} />
        <InsightWidget icon={TrendingUp} label="Peak hour prediction" value={peakHour.hour} detail={`${peakHour.orders} expected orders`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Revenue chart</CardTitle>
            <CardDescription>Weekly gross revenue in Indian rupees.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <RevenueAreaChart data={data.revenueSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Orders chart</CardTitle>
            <CardDescription>Daily order volume for staffing and prep planning.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <OrdersLineChart data={data.revenueSeries} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Peak hours</CardTitle>
            <CardDescription>Orders by time window.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <PeakHoursChart data={data.peakHours} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Top selling items</CardTitle>
            <CardDescription>Monthly leaders by units sold and revenue.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <TopItemsChart data={data.topSellingItems} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function RevenueAreaChart({ data }: { data: RestaurantRevenuePoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.34} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={formatShortCurrency} width={58} />
          <Tooltip content={<DashboardTooltip currencyKeys={["revenue"]} />} />
          <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#revenueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function OrdersLineChart({ data }: { data: RestaurantRevenuePoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={40} />
          <Tooltip content={<DashboardTooltip />} />
          <Line type="monotone" dataKey="orders" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PeakHoursChart({ data }: { data: RestaurantPeakHourPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={36} />
          <Tooltip content={<DashboardTooltip />} />
          <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
            {data.map((point, index) => (
              <Cell key={point.hour} fill={index === 4 ? "hsl(var(--secondary))" : "hsl(var(--primary))"} opacity={index === 4 ? 1 : 0.82} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopItemsChart({ data }: { data: RestaurantTopItemPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 18, right: 20, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <YAxis type="category" dataKey="name" width={104} axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <Tooltip content={<DashboardTooltip />} />
          <Bar dataKey="sold" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DashboardTooltip({
  active,
  payload,
  label,
  currencyKeys = []
}: {
  active?: boolean;
  payload?: ChartPayloadItem[];
  label?: string;
  currencyKeys?: string[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card p-3 text-sm shadow-lg">
      {label ? <p className="mb-2 font-semibold">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((item) => {
          const itemName = item.name ?? "";
          const value = item.value ?? 0;
          const displayValue = currencyKeys.includes(itemName) ? formatCurrency(value) : numberFormatter.format(value);

          return (
            <div key={itemName} className="flex items-center justify-between gap-4">
              <span className="capitalize text-muted-foreground">{itemName}</span>
              <span className="font-semibold">{displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompactOrderCard({ order, onUpdateOrderStatus }: { order: RestaurantOrder; onUpdateOrderStatus: (orderId: string, status: RestaurantOrderStatus) => void }) {
  const nextStatus = nextOrderStatus[order.status];

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {order.id} • {order.customerName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
        <div className="flex gap-2">
          {order.status === "PLACED" ? (
            <>
              <Button type="button" size="sm" onClick={() => onUpdateOrderStatus(order.id, "ACCEPTED")}>
                Accept
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onUpdateOrderStatus(order.id, "REJECTED")}>
                Reject
              </Button>
            </>
          ) : nextStatus ? (
            <Button type="button" size="sm" onClick={() => onUpdateOrderStatus(order.id, nextStatus)}>
              Update
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, onUpdateOrderStatus }: { order: RestaurantOrder; onUpdateOrderStatus: (orderId: string, status: RestaurantOrderStatus) => void }) {
  const nextStatus = nextOrderStatus[order.status];

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{order.id}</h3>
            <StatusBadge status={order.status} />
            <Badge variant={order.paymentStatus === "PAID" ? "secondary" : "outline"}>{order.paymentStatus}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {order.customerName} • {order.placedAt} • {order.deliveryAddress}
          </p>
          <div className="flex flex-wrap gap-2">
            {order.items.map((item) => (
              <Badge key={item.name} variant="outline">
                {item.quantity}x {item.name}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Courier: {order.courierName ?? "Waiting assignment"}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:w-72 lg:grid-cols-1">
          <div className="rounded-md border bg-card px-3 py-2 text-sm font-bold">{formatCurrency(order.total)}</div>
          {order.status === "PLACED" ? (
            <>
              <Button type="button" onClick={() => onUpdateOrderStatus(order.id, "ACCEPTED")}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Accept order
              </Button>
              <Button type="button" variant="outline" onClick={() => onUpdateOrderStatus(order.id, "REJECTED")} className="text-destructive hover:text-destructive">
                <XCircle className="mr-2 h-4 w-4" />
                Reject order
              </Button>
            </>
          ) : nextStatus ? (
            <Button type="button" onClick={() => onUpdateOrderStatus(order.id, nextStatus)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Mark {orderStatusMeta[nextStatus].label}
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled>
              <MinusCircle className="mr-2 h-4 w-4" />
              No action
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  metric,
  index
}: {
  metric: {
    label: string;
    value: string;
    detail: string;
    icon: LucideIcon;
  };
  index: number;
}) {
  const Icon = metric.icon;

  return (
    <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-2 truncate text-2xl font-bold">{metric.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        </CardContent>
      </Card>
    </m.div>
  );
}

function InsightWidget({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-semibold">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: RestaurantOrderStatus }) {
  const meta = orderStatusMeta[status];

  return <span className={cn("inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold", meta.className)}>{meta.label}</span>;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  compact = false
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("grid place-items-center rounded-lg border bg-background text-center", compact ? "min-h-40 p-5" : "min-h-72 p-8")}>
      <div className="max-w-sm">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function restaurantOrderToMarketplaceOrder(order: RestaurantOrder, restaurantId: string, restaurantName: string): MarketplaceOrder {
  const createdAt = new Date().toISOString();
  const distanceKm = parseDistanceKm(order.deliveryAddress.includes("Madhapur") ? "2.4 km" : "4.2 km");
  const deliveryFee = calculateDynamicDeliveryFee(distanceKm);
  const subtotal = Math.max(0, order.total - deliveryFee - 12);

  return {
    id: order.id,
    restaurantId,
    restaurantName,
    customerName: order.customerName,
    deliveryPartnerName: order.courierName ?? "Assigning soon",
    address: order.deliveryAddress,
    distanceKm,
    eta: order.status === "DELIVERED" ? "Delivered" : "24 min",
    subtotal,
    deliveryFee,
    platformFee: 12,
    tax: Math.max(0, order.total - subtotal - deliveryFee - 12),
    total: order.total,
    status: order.status,
    items: order.items.map((item, index) => ({
      id: `${order.id}-${index}`,
      name: item.name,
      quantity: item.quantity,
      price: Math.round(subtotal / Math.max(order.items.reduce((total, current) => total + current.quantity, 0), 1))
    })),
    placedAt: order.placedAt,
    updatedAt: createdAt,
    timeline: [
      {
        id: `${order.id}-seed`,
        orderId: order.id,
        status: order.status,
        title: `${order.id} ${order.status.toLowerCase()}`,
        description: `${order.id} is ${order.status.toLowerCase()} at ${restaurantName}.`,
        createdAt
      }
    ]
  };
}

function mergeRestaurantOrders(seedOrders: RestaurantOrder[], workflowOrders: MarketplaceOrder[], restaurantId: string): RestaurantOrder[] {
  const workflowRestaurantOrders = workflowOrders
    .filter((order) => order.restaurantId === restaurantId)
    .map((order) => ({
      id: order.id,
      customerName: order.customerName,
      items: order.items.map((item) => ({ name: item.name, quantity: item.quantity })),
      total: order.total,
      status: order.status,
      placedAt: order.placedAt,
      deliveryAddress: order.address,
      paymentStatus: "PAID" as const,
      courierName: order.deliveryPartnerName
    }));
  const workflowIds = new Set(workflowRestaurantOrders.map((order) => order.id));

  return [...workflowRestaurantOrders, ...seedOrders.filter((order) => !workflowIds.has(order.id))];
}

function RestaurantDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36" />
      <div className="flex gap-2 overflow-hidden rounded-lg border bg-card p-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-32 shrink-0" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
