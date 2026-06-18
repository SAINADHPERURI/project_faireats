import type { Metadata } from "next";

import { DatabaseViewer } from "@/features/admin/components/database-viewer";

export const metadata: Metadata = {
  title: "Database"
};

export default function AdminDatabasePage() {
  return <DatabaseViewer />;
}
