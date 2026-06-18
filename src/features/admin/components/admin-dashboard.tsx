"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Database,
  IndianRupee,
  LineChart as LineChartIcon,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { appRoutes } from "@/config/routes";
import { adminMetrics, managementCollections, platformChartData, platformHealthSignals } from "@/features/admin/data/admin-demo-data";
import type { AdminChartPoint, AdminManagementTab, AdminMetric } from "@/features/admin/types";
import { LiveActivityFeed } from "@/features/marketplace/components/live-activity-feed";
import { NotificationCenter } from "@/features/marketplace/components/notification-center";
import { AdminProfileDirectory } from "@/features/profiles/components/admin-profile-directory";
import { cn } from "@/lib/utils";

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

const metricToneClass: Record<AdminMetric["tone"], string> = {
  primary: "bg-primary text-primary-foreground",
  success: "bg-[#D7BFA6] text-foreground",
  warning: "bg-[#F3E7D6] text-foreground",
  info: "bg-[#FFFDF6] text-foreground"
};

export function AdminDashboard() {
  const [activeManagementTab, setActiveManagementTab] = useState<AdminManagementTab>("users");
  const [searchQuery, setSearchQuery] = useState("");
  const activeCollection = managementCollections.find((collection) => collection.id === activeManagementTab) ?? managementCollections[0];

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery || !activeCollection) {
      return activeCollection?.records ?? [];
    }

    return activeCollection.records.filter((record) =>
      [record.id, record.primary, record.secondary, record.status, record.metric].some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [activeCollection, searchQuery]);

  return (
    <div className="space-y-6">
      <AdminCommandHeader />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {adminMetrics.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} index={index} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <NotificationCenter role="ADMIN" compact />
        <LiveActivityFeed limit={6} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Orders per day
                </CardTitle>
                <CardDescription>Daily order volume across the FairEats marketplace.</CardDescription>
              </div>
              <Badge variant="secondary">7 day trend</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <OrdersPerDayChart data={platformChartData} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <IndianRupee className="h-5 w-5 text-primary" />
                  Revenue trends
                </CardTitle>
                <CardDescription>Platform fee and GMV signal model.</CardDescription>
              </div>
              <Badge>₹24.8L MTD</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <RevenueTrendChart data={platformChartData} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <LineChartIcon className="h-5 w-5 text-primary" />
              Platform growth
            </CardTitle>
            <CardDescription>User, restaurant, and delivery partner growth across the marketplace.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <PlatformGrowthChart data={platformChartData} />
          </CardContent>
        </Card>

        <PlatformHealthPanel />
      </section>

      {activeCollection ? (
        <ManagementPanel
          activeTab={activeManagementTab}
          onTabChange={setActiveManagementTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filteredRecords={filteredRecords}
          activeCollection={activeCollection}
        />
      ) : null}

      <AdminProfileDirectory />
    </div>
  );
}

function AdminCommandHeader() {
  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="p-6 lg:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Enterprise admin
            </Badge>
            <Badge variant="outline" className="bg-background">
              Live operations
            </Badge>
          </div>
          <div className="mt-5 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-normal sm:text-4xl">FairEats platform command center</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Monitor marketplace analytics, manage users and partners, track orders, and inspect platform growth from one protected workspace.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href={appRoutes.admin.database}>
                <Database className="mr-2 h-4 w-4" />
                View database
              </Link>
            </Button>
            <Button type="button" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh snapshot
            </Button>
          </div>
        </div>
        <div className="border-t bg-primary/25 p-6 lg:border-l lg:border-t-0">
          <div className="grid h-full content-between gap-4">
            <div className="rounded-lg border bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Marketplace health</p>
              <p className="mt-2 text-3xl font-bold">98.7%</p>
              <p className="mt-1 text-sm text-muted-foreground">Stable order, payout, and partner availability signals.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat icon={PackageCheck} label="Live orders" value="1,248" />
              <MiniStat icon={Activity} label="Incidents" value="2" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ metric, index }: { metric: AdminMetric; index: number }) {
  const Icon = metric.icon;

  return (
    <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Card className="h-full overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-lg border", metricToneClass[metric.tone])}>
              <Icon className="h-5 w-5" />
            </span>
            <Badge variant="outline" className="bg-background text-[11px]">
              {metric.change}
            </Badge>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">{metric.label}</p>
          <p className="mt-2 truncate text-3xl font-bold">{metric.value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{metric.detail}</p>
        </CardContent>
      </Card>
    </m.div>
  );
}

function OrdersPerDayChart({ data }: { data: AdminChartPoint[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={42} />
          <Tooltip content={<DashboardTooltip />} />
          <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueTrendChart({ data }: { data: AdminChartPoint[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="adminRevenueFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={formatShortCurrency} width={62} />
          <Tooltip content={<DashboardTooltip currencyKeys={["revenue"]} />} />
          <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#adminRevenueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PlatformGrowthChart({ data }: { data: AdminChartPoint[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={formatCompactNumber} width={62} />
          <Tooltip content={<DashboardTooltip />} />
          <Line type="monotone" dataKey="users" stroke="hsl(var(--foreground))" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="restaurants" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="deliveryPartners" stroke="hsl(var(--muted-foreground))" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ManagementPanel({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  filteredRecords,
  activeCollection
}: {
  activeTab: AdminManagementTab;
  onTabChange: (tab: AdminManagementTab) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filteredRecords: Array<{ id: string; primary: string; secondary: string; status: string; metric: string; updatedAt: string }>;
  activeCollection: NonNullable<(typeof managementCollections)[number]>;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle className="text-xl">Management console</CardTitle>
            <CardDescription>Operate users, restaurants, orders, and delivery partners from one governed view.</CardDescription>
          </div>
          <div className="relative w-full xl:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search records..." className="pl-9" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="flex gap-2 overflow-x-auto rounded-lg border bg-background p-2">
          {managementCollections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => onTabChange(collection.id)}
              className={cn(
                "h-10 shrink-0 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors",
                "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeTab === collection.id && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              {collection.label}
            </button>
          ))}
        </div>

        <div className="rounded-lg border bg-background">
          <div className="border-b p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">{activeCollection.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{activeCollection.description}</p>
              </div>
              <Badge variant="secondary">{filteredRecords.length} records</Badge>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/60 text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Record</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Metric</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{record.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{record.primary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{record.secondary}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="bg-card">
                        {record.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{record.metric}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.updatedAt}</td>
                    <td className="px-4 py-3">
                      <Button type="button" variant="outline" size="sm">
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformHealthPanel() {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="h-5 w-5 text-primary" />
          Platform health
        </CardTitle>
        <CardDescription>Operational controls for marketplace stability.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {platformHealthSignals.map((signal) => (
          <div key={signal.label} className="rounded-lg border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{signal.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{signal.detail}</p>
              </div>
              <Badge variant={signal.status === "Watch" ? "secondary" : "outline"}>{signal.status}</Badge>
            </div>
            <p className="mt-3 text-2xl font-bold">{signal.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/70 p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
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
          const displayValue = currencyKeys.includes(itemName) ? currencyFormatter.format(value) : numberFormatter.format(value);

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

function formatShortCurrency(value: number) {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }

  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }

  return currencyFormatter.format(value);
}

function formatCompactNumber(value: number) {
  if (value >= 100000) {
    return `${(value / 100000).toFixed(1)}L`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return numberFormatter.format(value);
}
