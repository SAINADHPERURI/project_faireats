import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">404</p>
        <h1 className="text-3xl font-bold tracking-normal">Page not found</h1>
        <p className="text-muted-foreground">The FairEats page you are looking for is unavailable or has moved.</p>
        <Button asChild>
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </main>
  );
}
