"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { appRoutes } from "@/config/routes";
import { AuthFormField } from "@/features/auth/components/auth-form-field";
import { AuthFormMessage } from "@/features/auth/components/auth-form-message";
import { SocialSignInButtons } from "@/features/auth/components/social-sign-in-buttons";
import { initialAuthActionState } from "@/features/auth/lib/action-state";
import { signInAction } from "@/features/auth/lib/actions";
import type { OnboardableUserRole } from "@/types/auth";

export function SignInForm({
  expectedRole,
  heading = "Sign in",
  description = "Access the right FairEats workspace for your role.",
  showHeading = true
}: {
  expectedRole?: OnboardableUserRole;
  heading?: string;
  description?: string;
  showHeading?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(signInAction, initialAuthActionState);

  return (
    <form action={formAction} className="space-y-5">
      {expectedRole ? <input type="hidden" name="expectedRole" value={expectedRole} /> : null}
      {showHeading ? (
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-normal">{heading}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      ) : null}

      <AuthFormMessage state={state} />

      {!expectedRole ? (
        <>
          <SocialSignInButtons />
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-xs uppercase text-muted-foreground">or use email</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}

      <AuthFormField label="Email" name="email" type="email" autoComplete="email" required />
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Password</span>
          <Link className="text-sm font-medium text-primary hover:underline" href={appRoutes.forgotPassword}>
            Forgot password
          </Link>
        </div>
        <AuthFormField label="" aria-label="Password" name="password" type="password" autoComplete="current-password" minLength={8} required />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
        Sign in securely
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New to FairEats?{" "}
        <Link className="font-medium text-primary hover:underline" href={appRoutes.signUp}>
          Create account
        </Link>
      </p>
    </form>
  );
}
