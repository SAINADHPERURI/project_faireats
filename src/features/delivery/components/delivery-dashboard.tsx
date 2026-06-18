"use client";

import { useEffect, useMemo, useState } from "react";
import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BadgeIndianRupee,
  Bike,
  CheckCircle2,
  Clock3,
  History,
  IndianRupee,
  LineChart as LineChartIcon,
  MapPin,
  Navigation,
  PackageCheck,
  Route,
  ShieldCheck,
  Star,
  Timer,
  TrendingUp,
  UserRound,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { appRoutes } from "@/config/routes";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useDeliveryDashboardData } from "@/features/delivery/hooks/use-delivery-dashboard-data";
import type {
  DeliveryActivity,
  DeliveryDashboardView,
  DeliveryEarningPoint,
  DeliveryOrder,
  DeliveryOrderStatus,
  DeliveryPartnerProfile
} from "@/features/delivery/types";
import { LiveActivityFeed } from "@/features/marketplace/components/live-activity-feed";
import { NotificationCenter } from "@/features/marketplace/components/notification-center";
import { getMarketplaceOrders, marketplaceChangedEvent, seedMarketplaceOrders, updateMarketplaceOrderStatus } from "@/features/marketplace/lib/workflow";
import type { MarketplaceOrder } from "@/features/marketplace/types";
import { getStoredProfile, managedProfileStoreChangedEvent } from "@/features/profiles/lib/profile-store";
import type { DeliveryManagedProfile } from "@/features/profiles/types";
import { cn } from "@/lib/utils";

type EarningsRange = "daily" | "weekly" | "monthly";

type ChartPayloadItem = {
  name?: string;
  value?: number;
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("en-IN");

const viewItems: Array<{ id: DeliveryDashboardView; label: string; icon: LucideIcon }> = [
  { id: "dashboard", label: "Dashboard", icon: Bike },
  { id: "orders", label: "Orders", icon: PackageCheck },
  { id: "earnings", label: "Earnings", icon: WalletCards },
  { id: "timeline", label: "Timeline", icon: History }
];

const orderStatusMeta: Record<DeliveryOrderStatus, { label: string; className: string }> = {
  ASSIGNED: { label: "Assigned", className: "border-sky-200 bg-sky-50 text-sky-700" },
  PICKED_UP: { label: "Picked up", className: "border-amber-200 bg-amber-50 text-amber-700" },
  DELIVERED: { label: "Delivered", className: "border-primary/20 bg-primary/10 text-primary" }
};

const timelineToneClass: Record<DeliveryActivity["tone"], string> = {
  success: "bg-primary text-primary-foreground",
  warning: "bg-secondary text-secondary-foreground",
  info: "bg-accent text-accent-foreground"
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

export function DeliveryDashboard() {
  const { data, isLoading } = useDeliveryDashboardData();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<DeliveryDashboardView>("dashboard");
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [earningsRange, setEarningsRange] = useState<EarningsRange>("daily");
  const [managedProfile, setManagedProfile] = useState<DeliveryManagedProfile | null>(null);

  useEffect(() => {
    if (!data) {
      return;
    }

    const dashboardData = data;
    seedMarketplaceOrders(dashboardData.orders.map(deliveryOrderToMarketplaceOrder));

    function syncWorkflowOrders() {
      setOrders(mergeDeliveryOrders(dashboardData.orders, getMarketplaceOrders()));
    }

    syncWorkflowOrders();
    window.addEventListener("storage", syncWorkflowOrders);
    window.addEventListener(marketplaceChangedEvent, syncWorkflowOrders);

    return () => {
      window.removeEventListener("storage", syncWorkflowOrders);
      window.removeEventListener(marketplaceChangedEvent, syncWorkflowOrders);
    };
  }, [data]);

  useEffect(() => {
    if (!user) {
      setManagedProfile(null);
      return;
    }

    const userId = user.id;

    function loadStoredProfile() {
      const storedProfile = getStoredProfile(userId, "DELIVERY");
      setManagedProfile(storedProfile?.role === "DELIVERY" ? storedProfile : null);
    }

    loadStoredProfile();
    window.addEventListener("storage", loadStoredProfile);
    window.addEventListener(managedProfileStoreChangedEvent, loadStoredProfile);

    return () => {
      window.removeEventListener("storage", loadStoredProfile);
      window.removeEventListener(managedProfileStoreChangedEvent, loadStoredProfile);
    };
  }, [user]);

  const metrics = useMemo(() => {
    const activeDeliveries = orders.filter((order) => order.status !== "DELIVERED");
    const completedDeliveries = orders.filter((order) => order.status === "DELIVERED");
    const dailyEarnings = orders.reduce((total, order) => total + (order.status === "DELIVERED" ? order.payout + order.tip : 0), 0);
    const monthlyEarnings = data?.monthlyEarnings.reduce((total, point) => total + point.earnings, 0) ?? 0;

    return {
      activeDeliveries,
      completedDeliveries,
      dailyEarnings,
      monthlyEarnings
    };
  }, [data?.monthlyEarnings, orders]);

  if (isLoading || !data) {
    return <DeliveryDashboardSkeleton />;
  }

  function updateOrderStatus(orderId: string, status: DeliveryOrderStatus) {
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
    updateMarketplaceOrderStatus(orderId, status, "DELIVERY");
    toast.success(status === "PICKED_UP" ? `Order ${orderId} picked up.` : `Order ${orderId} marked delivered.`);
  }

  const earningSeries =
    earningsRange === "daily" ? data.dailyEarnings : earningsRange === "weekly" ? data.weeklyEarnings : data.monthlyEarnings;

  return (
    <div className="space-y-6">
      <DeliveryHero profile={data.profile} managedProfile={managedProfile} activeDeliveries={metrics.activeDeliveries.length} />
      {!managedProfile ? <DeliveryProfileNotice /> : null}
      <section className="grid gap-6 xl:grid-cols-2">
        <NotificationCenter role="DELIVERY" compact />
        <LiveActivityFeed limit={4} />
      </section>
      <ViewSwitcher activeView={activeView} onChange={setActiveView} activeOrderCount={metrics.activeDeliveries.length} />

      <m.div key={activeView} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="space-y-6">
        {activeView === "dashboard" ? (
          <DashboardView
            profile={data.profile}
            orders={orders}
            activity={data.activity}
            metrics={metrics}
            earningSeries={data.dailyEarnings}
            onViewOrders={() => setActiveView("orders")}
            onUpdateOrderStatus={updateOrderStatus}
          />
        ) : null}

        {activeView === "orders" ? <OrdersView orders={orders} onUpdateOrderStatus={updateOrderStatus} /> : null}

        {activeView === "earnings" ? (
          <EarningsView
            range={earningsRange}
            onRangeChange={setEarningsRange}
            earningSeries={earningSeries}
            daily={data.dailyEarnings}
            weekly={data.weeklyEarnings}
            monthly={data.monthlyEarnings}
          />
        ) : null}

        {activeView === "timeline" ? <TimelineView activity={data.activity} orders={orders} /> : null}
      </m.div>
    </div>
  );
}

function DeliveryHero({
  profile,
  managedProfile,
  activeDeliveries
}: {
  profile: DeliveryPartnerProfile;
  managedProfile: DeliveryManagedProfile | null;
  activeDeliveries: number;
}) {
  const displayName = managedProfile?.fullName ?? profile.name;
  const vehicle = managedProfile ? `${managedProfile.vehicleType} - ${managedProfile.vehicleNumber}` : profile.vehicle;

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <DeliveryAvatar image={managedProfile?.photoDataUrl ?? null} name={displayName} />
          <div className="min-w-0">
          <Badge className="mb-3 gap-1 bg-primary text-primary-foreground">
            <Navigation className="h-3.5 w-3.5" />
            Delivery partner workspace
          </Badge>
          <h2 className="text-2xl font-bold tracking-normal">Welcome back, {displayName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {vehicle} - {profile.zone}
          </p>
            {managedProfile?.phone ? <p className="mt-1 text-sm font-medium text-foreground">{managedProfile.phone}</p> : null}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <InfoPill icon={Star} label={`${profile.rating.toFixed(1)} rating`} />
          <InfoPill icon={ShieldCheck} label={`${profile.acceptanceRate}% acceptance`} />
          <InfoPill icon={Route} label={`${activeDeliveries} active`} />
        </div>
      </div>
    </section>
  );
}

function DeliveryAvatar({ image, name }: { image: string | null; name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      className={cn(
        "grid h-20 w-20 shrink-0 place-items-center rounded-lg border bg-primary/10 bg-cover bg-center text-xl font-bold text-primary shadow-sm",
        image && "text-transparent"
      )}
      style={image ? { backgroundImage: `url(${image})` } : undefined}
      aria-label="Delivery partner profile photo"
    >
      {image ? null : initials || "DP"}
    </span>
  );
}

function DeliveryProfileNotice() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold">Delivery profile photo not found on this device</p>
        <p className="mt-1 text-sm text-muted-foreground">Complete your delivery profile to show verified identity details in this dashboard.</p>
      </div>
      <Button asChild>
        <Link href={appRoutes.delivery.profile}>
          <UserRound className="mr-2 h-4 w-4" />
          Open profile
        </Link>
      </Button>
    </div>
  );
}

function ViewSwitcher({
  activeView,
  activeOrderCount,
  onChange
}: {
  activeView: DeliveryDashboardView;
  activeOrderCount: number;
  onChange: (view: DeliveryDashboardView) => void;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-lg border bg-card p-2 shadow-sm" aria-label="Delivery dashboard">
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
            {item.id === "orders" && activeOrderCount > 0 ? (
              <span className={cn("ml-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px]", isActive ? "bg-white/20" : "bg-primary text-primary-foreground")}>
                {activeOrderCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

function DashboardView({
  profile,
  orders,
  activity,
  metrics,
  earningSeries,
  onViewOrders,
  onUpdateOrderStatus
}: {
  profile: DeliveryPartnerProfile;
  orders: DeliveryOrder[];
  activity: DeliveryActivity[];
  metrics: {
    activeDeliveries: DeliveryOrder[];
    completedDeliveries: DeliveryOrder[];
    dailyEarnings: number;
    monthlyEarnings: number;
  };
  earningSeries: DeliveryEarningPoint[];
  onViewOrders: () => void;
  onUpdateOrderStatus: (orderId: string, status: DeliveryOrderStatus) => void;
}) {
  const metricCards = [
    { label: "Active deliveries", value: metrics.activeDeliveries.length.toString(), detail: "Assigned or picked up", icon: Bike },
    { label: "Completed", value: metrics.completedDeliveries.length.toString(), detail: "Delivered today", icon: CheckCircle2 },
    { label: "Daily earnings", value: formatCurrency(metrics.dailyEarnings), detail: "Delivered orders", icon: BadgeIndianRupee },
    { label: "Monthly earnings", value: formatShortCurrency(metrics.monthlyEarnings), detail: "Current month", icon: WalletCards }
  ];
  const nextOrder = metrics.activeDeliveries[0];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} index={index} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <LineChartIcon className="h-5 w-5 text-primary" />
                  Daily earnings
                </CardTitle>
                <CardDescription>Hourly earnings and delivery volume for today.</CardDescription>
              </div>
              <Badge variant="outline">{profile.onTimeRate}% on-time</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <EarningsAreaChart data={earningSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Next delivery</CardTitle>
                <CardDescription>Pickup and dropoff details for your queue.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={onViewOrders}>
                All orders
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {nextOrder ? (
              <DeliveryOrderCard order={nextOrder} onUpdateOrderStatus={onUpdateOrderStatus} compact />
            ) : (
              <EmptyState icon={CheckCircle2} title="No active deliveries" description="You are clear for the next assignment." compact />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1fr)]">
        <RouteCard orders={orders} />
        <ActivityTimeline activity={activity.slice(0, 4)} />
      </section>
    </div>
  );
}

function OrdersView({ orders, onUpdateOrderStatus }: { orders: DeliveryOrder[]; onUpdateOrderStatus: (orderId: string, status: DeliveryOrderStatus) => void }) {
  const assignedOrders = orders.filter((order) => order.status === "ASSIGNED");
  const activeOrders = orders.filter((order) => order.status !== "DELIVERED");
  const deliveredOrders = orders.filter((order) => order.status === "DELIVERED");

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatusSummary title="Assigned orders" value={assignedOrders.length.toString()} icon={PackageCheck} />
        <StatusSummary title="In progress" value={activeOrders.length.toString()} icon={Route} />
        <StatusSummary title="Delivered" value={deliveredOrders.length.toString()} icon={CheckCircle2} />
      </section>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl">Assigned orders</CardTitle>
          <CardDescription>Pickup orders, confirm handoff, and mark delivered from a mobile-friendly queue.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 lg:grid-cols-2">
          {orders.map((order) => (
            <DeliveryOrderCard key={order.id} order={order} onUpdateOrderStatus={onUpdateOrderStatus} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function EarningsView({
  range,
  onRangeChange,
  earningSeries,
  daily,
  weekly,
  monthly
}: {
  range: EarningsRange;
  onRangeChange: (range: EarningsRange) => void;
  earningSeries: DeliveryEarningPoint[];
  daily: DeliveryEarningPoint[];
  weekly: DeliveryEarningPoint[];
  monthly: DeliveryEarningPoint[];
}) {
  const total = earningSeries.reduce((sum, point) => sum + point.earnings, 0);
  const deliveries = earningSeries.reduce((sum, point) => sum + point.deliveries, 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <InsightWidget icon={IndianRupee} label={`${range} earnings`} value={formatCurrency(total)} detail={`${deliveries} deliveries tracked`} />
        <InsightWidget icon={TrendingUp} label="Avg per delivery" value={formatCurrency(deliveries > 0 ? Math.round(total / deliveries) : 0)} detail="Payout plus tips" />
        <InsightWidget icon={Timer} label="Best period" value={getBestEarningPoint(earningSeries).label} detail={formatCurrency(getBestEarningPoint(earningSeries).earnings)} />
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 border-b lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl">Earnings analytics</CardTitle>
            <CardDescription>Switch between daily, weekly, and monthly earning patterns.</CardDescription>
          </div>
          <div className="flex rounded-lg border bg-background p-1">
            {(["daily", "weekly", "monthly"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onRangeChange(item)}
                className={cn(
                  "h-9 rounded-md px-3 text-sm font-medium capitalize transition-colors",
                  range === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <EarningsAreaChart data={earningSeries} />
          <EarningsBreakdown daily={daily} weekly={weekly} monthly={monthly} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl">Delivery volume</CardTitle>
          <CardDescription>How many completed trips contributed to payout.</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <DeliveriesBarChart data={earningSeries} />
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineView({ activity, orders }: { activity: DeliveryActivity[]; orders: DeliveryOrder[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(320px,1fr)]">
      <ActivityTimeline activity={activity} />
      <RouteCard orders={orders} />
    </div>
  );
}

function DeliveryOrderCard({
  order,
  onUpdateOrderStatus,
  compact = false
}: {
  order: DeliveryOrder;
  onUpdateOrderStatus: (orderId: string, status: DeliveryOrderStatus) => void;
  compact?: boolean;
}) {
  const canPickup = order.status === "ASSIGNED";
  const canDeliver = order.status === "PICKED_UP";

  return (
    <div className={cn("rounded-lg border bg-background p-4", compact && "bg-card")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{order.id}</h3>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.restaurantName} • {order.itemsCount} items • {order.assignedAt}
          </p>
        </div>
        <p className="text-lg font-bold">{formatCurrency(order.payout + order.tip)}</p>
      </div>

      <div className="mt-4 grid gap-3 text-sm">
        <RouteLine icon={MapPin} label="Pickup" value={order.pickupAddress} />
        <RouteLine icon={Navigation} label="Dropoff" value={order.dropoffAddress} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
        <InfoBlock label="Distance" value={`${order.distanceKm.toFixed(1)} km`} />
        <InfoBlock label="ETA" value={`${order.estimatedTimeMinutes} min`} />
        <InfoBlock label="Tip" value={formatCurrency(order.tip)} />
        <InfoBlock label="Mode" value={order.paymentMode} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={() => onUpdateOrderStatus(order.id, "PICKED_UP")} disabled={!canPickup}>
          <PackageCheck className="mr-2 h-4 w-4" />
          Pickup order
        </Button>
        <Button type="button" variant={canDeliver ? "default" : "outline"} onClick={() => onUpdateOrderStatus(order.id, "DELIVERED")} disabled={!canDeliver}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark delivered
        </Button>
      </div>
    </div>
  );
}

function EarningsAreaChart({ data }: { data: DeliveryEarningPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="deliveryEarningsFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={formatShortCurrency} width={56} />
          <Tooltip content={<DashboardTooltip currencyKeys={["earnings"]} />} />
          <Area type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#deliveryEarningsFill)" />
          <Line type="monotone" dataKey="deliveries" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DeliveriesBarChart({ data }: { data: DeliveryEarningPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={36} />
          <Tooltip content={<DashboardTooltip />} />
          <Bar dataKey="deliveries" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
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

function ActivityTimeline({ activity }: { activity: DeliveryActivity[] }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-xl">Activity timeline</CardTitle>
        <CardDescription>Operational events, pickups, handoffs, and delivery alerts.</CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4">
          {activity.map((item, index) => (
            <div key={item.id} className="relative flex gap-3">
              {index < activity.length - 1 ? <span className="absolute left-4 top-9 h-[calc(100%-1rem)] w-px bg-border" /> : null}
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-md", timelineToneClass[item.tone])}>
                <Clock3 className="h-4 w-4" />
              </span>
              <div className="min-w-0 rounded-lg border bg-background p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{item.title}</p>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RouteCard({ orders }: { orders: DeliveryOrder[] }) {
  const routeOrders = orders.filter((order) => order.status !== "DELIVERED");
  const totalDistance = routeOrders.reduce((sum, order) => sum + order.distanceKm, 0);
  const totalTime = routeOrders.reduce((sum, order) => sum + order.estimatedTimeMinutes, 0);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Route className="h-5 w-5 text-primary" />
          Route snapshot
        </CardTitle>
        <CardDescription>Mobile-first view of the next active delivery stops.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoPanel icon={MapPin} label="Active distance" value={`${totalDistance.toFixed(1)} km`} />
          <InfoPanel icon={Timer} label="Estimated time" value={`${totalTime} min`} />
        </div>
        {routeOrders.length > 0 ? (
          <div className="space-y-3">
            {routeOrders.map((order) => (
              <div key={order.id} className="rounded-lg border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{order.restaurantName}</p>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{order.pickupAddress}</p>
                <p className="mt-1 text-sm text-muted-foreground">{order.dropoffAddress}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={CheckCircle2} title="Route clear" description="No active stops in your current route." compact />
        )}
      </CardContent>
    </Card>
  );
}

function EarningsBreakdown({
  daily,
  weekly,
  monthly
}: {
  daily: DeliveryEarningPoint[];
  weekly: DeliveryEarningPoint[];
  monthly: DeliveryEarningPoint[];
}) {
  const rows = [
    { label: "Daily", data: daily },
    { label: "Weekly", data: weekly },
    { label: "Monthly", data: monthly }
  ];

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const earnings = row.data.reduce((sum, point) => sum + point.earnings, 0);
        const deliveries = row.data.reduce((sum, point) => sum + point.deliveries, 0);

        return (
          <div key={row.label} className="rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{row.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{deliveries} deliveries</p>
              </div>
              <p className="text-lg font-bold">{formatCurrency(earnings)}</p>
            </div>
          </div>
        );
      })}
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

function StatusSummary({ title, value, icon: Icon }: { title: string; value: string; icon: LucideIcon }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
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

function InfoPanel({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
        <p className="mt-1 font-semibold">{value}</p>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-2">
      <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}

function RouteLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
        <p className="mt-1 break-words font-medium">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DeliveryOrderStatus }) {
  const meta = orderStatusMeta[status];

  return <span className={cn("inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold", meta.className)}>{meta.label}</span>;
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
    <div className={cn("grid place-items-center rounded-lg border bg-background text-center", compact ? "min-h-44 p-5" : "min-h-72 p-8")}>
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

function getBestEarningPoint(points: DeliveryEarningPoint[]) {
  return points.reduce((best, point) => (point.earnings > best.earnings ? point : best), points[0] ?? { label: "N/A", earnings: 0, deliveries: 0 });
}

function deliveryOrderToMarketplaceOrder(order: DeliveryOrder): MarketplaceOrder {
  const createdAt = new Date().toISOString();
  const subtotal = Math.max(0, order.payout * 4);

  return {
    id: order.id,
    restaurantId: slugifyRestaurant(order.restaurantName),
    restaurantName: order.restaurantName,
    customerName: order.customerName,
    deliveryPartnerName: "Aarav K.",
    address: order.dropoffAddress,
    distanceKm: order.distanceKm,
    eta: order.status === "DELIVERED" ? "Delivered" : `${order.estimatedTimeMinutes} min`,
    subtotal,
    deliveryFee: order.payout,
    platformFee: 12,
    tax: Math.round(subtotal * 0.05),
    total: subtotal + order.payout + order.tip + 12,
    status: order.status,
    items: [
      {
        id: `${order.id}-items`,
        name: `${order.itemsCount} item order`,
        quantity: order.itemsCount,
        price: Math.round(subtotal / Math.max(order.itemsCount, 1))
      }
    ],
    placedAt: order.assignedAt,
    updatedAt: createdAt,
    timeline: [
      {
        id: `${order.id}-seed`,
        orderId: order.id,
        status: order.status,
        title: `${order.id} ${order.status.toLowerCase()}`,
        description: `${order.id} is ${order.status.toLowerCase()} with delivery partner assigned.`,
        createdAt
      }
    ]
  };
}

function mergeDeliveryOrders(seedOrders: DeliveryOrder[], workflowOrders: MarketplaceOrder[]): DeliveryOrder[] {
  const workflowDeliveryOrders = workflowOrders
    .filter((order) => ["ASSIGNED", "PICKED_UP", "DELIVERED"].includes(order.status))
    .map((order) => ({
      id: order.id,
      restaurantName: order.restaurantName,
      customerName: order.customerName,
      pickupAddress: `${order.restaurantName} pickup counter`,
      dropoffAddress: order.address,
      distanceKm: order.distanceKm,
      estimatedTimeMinutes: order.status === "DELIVERED" ? 0 : Number.parseInt(order.eta, 10) || 24,
      payout: order.deliveryFee,
      tip: Math.max(0, order.total - order.subtotal - order.deliveryFee - order.platformFee - order.tax),
      status: order.status as DeliveryOrderStatus,
      assignedAt: order.placedAt,
      itemsCount: order.items.reduce((total, item) => total + item.quantity, 0),
      paymentMode: "PREPAID" as const
    }));
  const workflowIds = new Set(workflowDeliveryOrders.map((order) => order.id));

  return [...workflowDeliveryOrders, ...seedOrders.filter((order) => !workflowIds.has(order.id))];
}

function slugifyRestaurant(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function DeliveryDashboardSkeleton() {
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
