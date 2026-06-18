"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { appRoutes } from "@/config/routes";
import { AuthFormField } from "@/features/auth/components/auth-form-field";
import { AuthFormMessage } from "@/features/auth/components/auth-form-message";
import { initialAuthActionState } from "@/features/auth/lib/action-state";
import { requestPasswordResetAction } from "@/features/auth/lib/actions";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialAuthActionState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-normal">Reset password</h2>
        <p className="text-sm text-muted-foreground">Send a secure recovery link to your email.</p>
      </div>

      <AuthFormMessage state={state} />
      <AuthFormField label="Email" name="email" type="email" autoComplete="email" required />

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Send reset link
      </Button>

      <Button asChild variant="ghost" className="w-full">
        <Link href={appRoutes.signIn}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Link>
      </Button>
    </form>
  );
}
