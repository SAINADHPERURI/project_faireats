import { AlertCircle, Database } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDatabaseSnapshots } from "@/server/db/database-inspector";

const tableLabels: Record<string, string> = {
  users: "Users",
  restaurants: "Restaurants",
  menu_items: "Menu items",
  orders: "Orders",
  order_items: "Order items",
  delivery_partners: "Delivery partners",
  reviews: "Reviews",
  notifications: "Notifications",
  favorites: "Favorites",
  analytics: "Analytics"
};

export async function DatabaseViewer() {
  const snapshots = await getDatabaseSnapshots();

  return (
    <div className="space-y-4">
      {snapshots.map((snapshot) => (
        <Card key={snapshot.name}>
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{tableLabels[snapshot.name]}</CardTitle>
              </div>
              <Badge variant={snapshot.error ? "destructive" : "secondary"}>
                {snapshot.error ? "RLS blocked" : `${snapshot.rows.length}${snapshot.rowCount === null ? "" : ` / ${snapshot.rowCount}`} rows`}
              </Badge>
            </div>
            <CardDescription>{snapshot.name}</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.error ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                <span>{snapshot.error}</span>
              </div>
            ) : snapshot.rows.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No rows found.</div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {snapshot.columns.map((column) => (
                        <th key={column} className="border-b px-3 py-2 font-medium">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.rows.map((row, rowIndex) => (
                      <tr key={`${snapshot.name}-${rowIndex}`} className="odd:bg-background even:bg-muted/30">
                        {snapshot.columns.map((column) => (
                          <td key={column} className="max-w-[320px] border-b px-3 py-2 align-top">
                            <span className="block truncate" title={formatCell(row[column])}>
                              {formatCell(row[column])}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatCell(value: unknown) {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}
