import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";

import { serverEnv } from "@/config/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DatabaseTableName =
  | "users"
  | "restaurants"
  | "menu_items"
  | "orders"
  | "order_items"
  | "delivery_partners"
  | "reviews"
  | "notifications"
  | "favorites"
  | "analytics";

export interface DatabaseTableSnapshot {
  name: DatabaseTableName;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  rowCount: number | null;
  error: string | null;
}

interface QueryResult<Row extends object> {
  data: Row[] | null;
  error: PostgrestError | null;
  count: number | null;
}

export async function getDatabaseSnapshots(): Promise<DatabaseTableSnapshot[]> {
  const supabase = serverEnv.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdminClient() : await createSupabaseServerClient();

  return Promise.all([
    getIdentitySnapshot(supabase),
    toSnapshot("restaurants", supabase.from("restaurants").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(100)),
    toSnapshot("menu_items", supabase.from("menu_items").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(100)),
    toSnapshot("orders", supabase.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(100)),
    toSnapshot("order_items", supabase.from("order_items").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(100)),
    toSnapshot("delivery_partners", supabase.from("delivery_partners").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(100)),
    toSnapshot("reviews", supabase.from("reviews").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(100)),
    toSnapshot("notifications", supabase.from("notifications").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(100)),
    toSnapshot("favorites", supabase.from("favorites").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(100)),
    toSnapshot("analytics", supabase.from("analytics").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(100))
  ]);
}

async function getIdentitySnapshot(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const usersSnapshot = await toSnapshot(
    "users",
    supabase.from("users").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(100)
  );

  if (!usersSnapshot.error) {
    return usersSnapshot;
  }

  return toSnapshot(
    "users",
    supabase.from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(100)
  );
}

async function toSnapshot<Row extends object>(name: DatabaseTableName, query: PromiseLike<QueryResult<Row>>): Promise<DatabaseTableSnapshot> {
  const { data, error, count } = await query;
  const rows = (data ?? []).map(rowToRecord);
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  return {
    name,
    columns,
    rows,
    rowCount: count,
    error: error?.message ?? null
  };
}

function rowToRecord(row: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row));
}
