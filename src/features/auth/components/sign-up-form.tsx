"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Bike, ChefHat, Loader2, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { appRoutes } from "@/config/routes";
import { cn } from "@/lib/utils";
import { AuthFormField } from "@/features/auth/components/auth-form-field";
import { AuthFormMessage } from "@/features/auth/components/auth-form-message";
import { initialAuthActionState } from "@/features/auth/lib/action-state";
import { signUpAction } from "@/features/auth/lib/actions";

const roleOptions = [
  { value: "CUSTOMER", label: "Customer", icon: ShoppingBag },
  { value: "RESTAURANT", label: "Restaurant", icon: ChefHat },
  { value: "DELIVERY", label: "Delivery", icon: Bike }
] as const;

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialAuthActionState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-normal">Create account</h2>
        <p className="text-sm text-muted-foreground">Start with the correct FairEats role.</p>
      </div>

      <AuthFormMessage state={state} />

      <AuthFormField label="Full name" name="fullName" autoComplete="name" required />
      <AuthFormField label="Email" name="email" type="email" autoComplete="email" required />
      <AuthFormField label="Password" name="password" type="password" autoComplete="new-password" minLength={8} required />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Role</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {roleOptions.map((role, index) => (
            <label key={role.value} className="group cursor-pointer">
              <input className="peer sr-only" type="radio" name="role" value={role.value} defaultChecked={index === 0} />
              <span
                className={cn(
                  "flex min-h-24 flex-col justify-between rounded-md border bg-background p-3 text-sm transition-colors",
                  "peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary"
                )}
              >
                <role.icon className="h-5 w-5" />
                <span className="font-medium">{role.label}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
        Create secure account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link className="font-medium text-primary hover:underline" href={appRoutes.signIn}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
