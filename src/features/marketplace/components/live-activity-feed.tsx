"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { Activity, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLiveActivityFeed, marketplaceChangedEvent } from "@/features/marketplace/lib/workflow";
import type { MarketplaceOrderEvent } from "@/features/marketplace/types";

type ActivityFeedItem = MarketplaceOrderEvent & {
  order: {
    restaurantName: string;
  };
};

export function LiveActivityFeed({ limit = 6 }: { limit?: number }) {
  const [items, setItems] = useState<ActivityFeedItem[]>([]);

  useEffect(() => {
    function refreshFeed() {
      setItems(getLiveActivityFeed(limit) as ActivityFeedItem[]);
    }

    refreshFeed();
    window.addEventListener("storage", refreshFeed);
    window.addEventListener(marketplaceChangedEvent, refreshFeed);

    return () => {
      window.removeEventListener("storage", refreshFeed);
      window.removeEventListener(marketplaceChangedEvent, refreshFeed);
    };
  }, [limit]);

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Live activity feed
            </CardTitle>
            <CardDescription>Order acceptance, pickup, and delivery events in real time.</CardDescription>
          </div>
          <Badge variant="secondary">Live</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {items.length > 0 ? (
          items.map((item, index) => (
            <m.div
              key={item.id}
              className="flex gap-3 rounded-lg border bg-background p-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <Clock3 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </m.div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed bg-background p-5 text-center text-sm text-muted-foreground">Lifecycle events appear here as orders move.</div>
        )}
      </CardContent>
    </Card>
  );
}
