"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-destructive">Error</p>
        <h1 className="text-3xl font-bold tracking-normal">Something went wrong</h1>
        <p className="text-muted-foreground">FairEats could not complete this request. Try again in a moment.</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
