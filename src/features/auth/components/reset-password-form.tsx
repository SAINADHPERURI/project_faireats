"use client";

import { useActionState } from "react";
import { KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthFormField } from "@/features/auth/components/auth-form-field";
import { AuthFormMessage } from "@/features/auth/components/auth-form-message";
import { initialAuthActionState } from "@/features/auth/lib/action-state";
import { updatePasswordAction } from "@/features/auth/lib/actions";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, initialAuthActionState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-normal">Choose new password</h2>
        <p className="text-sm text-muted-foreground">Set a new password for your FairEats account.</p>
      </div>

      <AuthFormMessage state={state} />
      <AuthFormField label="New password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      <AuthFormField label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
        Update password
      </Button>
    </form>
  );
}
