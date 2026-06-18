"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AuthActionState } from "@/features/auth/lib/action-state";

export function AuthFormMessage({ state }: { state: AuthActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  const isError = state.status === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border p-3 text-sm",
        isError ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-primary"
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-none" />
      <span className="break-words">{state.message}</span>
    </div>
  );
}
