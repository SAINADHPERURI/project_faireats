"use client";

import { useEffect, useMemo, useState } from "react";
import { m } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMarketplaceNotifications, marketplaceChangedEvent, markMarketplaceNotificationsRead } from "@/features/marketplace/lib/workflow";
import type { MarketplaceNotification, MarketplaceRole } from "@/features/marketplace/types";
import { cn } from "@/lib/utils";

export function NotificationCenter({ role, compact = false }: { role: MarketplaceRole; compact?: boolean }) {
  const [notifications, setNotifications] = useState<MarketplaceNotification[]>([]);

  useEffect(() => {
    function refreshNotifications() {
      setNotifications(getMarketplaceNotifications(role));
    }

    refreshNotifications();
    window.addEventListener("storage", refreshNotifications);
    window.addEventListener(marketplaceChangedEvent, refreshNotifications);

    return () => {
      window.removeEventListener("storage", refreshNotifications);
      window.removeEventListener(marketplaceChangedEvent, refreshNotifications);
    };
  }, [role]);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  return (
    <Card>
      <CardHeader className={cn("border-b", compact && "p-4")}>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
          <div className="flex items-center gap-2">
            {unreadCount > 0 ? <Badge>{unreadCount} new</Badge> : <Badge variant="secondary">Clear</Badge>}
            <Button type="button" variant="outline" size="sm" onClick={() => markMarketplaceNotificationsRead(role)}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Read
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-3", compact ? "p-4" : "p-5")}>
        {notifications.length > 0 ? (
          notifications.slice(0, compact ? 4 : 8).map((notification, index) => (
            <m.div
              key={notification.id}
              className={cn("rounded-lg border bg-background p-3", !notification.read && "border-primary bg-primary/10")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{notification.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                </div>
                {!notification.read ? <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" /> : null}
              </div>
            </m.div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed bg-background p-5 text-center text-sm text-muted-foreground">No notifications yet.</div>
        )}
      </CardContent>
    </Card>
  );
}
